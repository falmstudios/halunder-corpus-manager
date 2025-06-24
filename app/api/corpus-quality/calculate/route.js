import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Function to count words
function countWords(text) {
  if (!text) return 0
  return text.trim().split(/\s+/).filter(word => word.length > 0).length
}

// Function to count punctuation
function countPunctuation(text) {
  if (!text) return 0
  const punctuationRegex = /[.,!?;:–—„"\"\']/g
  const matches = text.match(punctuationRegex)
  return matches ? matches.length : 0
}

// Function to calculate ratio (avoiding division by zero)
function calculateRatio(num1, num2) {
  if (num1 === 0 && num2 === 0) return 1
  if (num1 === 0 || num2 === 0) return 0
  const min = Math.min(num1, num2)
  const max = Math.max(num1, num2)
  return min / max
}

// Function to determine quality tags
function determineQualityTags(lengthRatio, punctuationRatio) {
  const tags = []
  
  // Length tags
  if (lengthRatio >= 0.8) {
    tags.push('similar_length')
  } else if (lengthRatio < 0.6) {
    tags.push('different_length')
  }
  
  // Punctuation tags
  if (punctuationRatio >= 0.8) {
    tags.push('similar_punctuation')
  } else if (punctuationRatio < 0.5) {
    tags.push('very_different_punctuation')
  }
  
  return tags
}

// Function to determine quality bucket
function determineQualityBucket(tags) {
  const hasSimilarLength = tags.includes('similar_length')
  const hasSimilarPunctuation = tags.includes('similar_punctuation')
  const hasDifferentLength = tags.includes('different_length')
  const hasVeryDifferentPunctuation = tags.includes('very_different_punctuation')
  
  if (hasSimilarLength && hasSimilarPunctuation) {
    return 'high_quality'
  } else if (hasSimilarLength || hasSimilarPunctuation) {
    return 'good_quality'
  } else if (hasDifferentLength && hasVeryDifferentPunctuation) {
    return 'poor_quality'
  } else if (hasDifferentLength || !hasSimilarPunctuation) {
    return 'needs_review'
  } else {
    return 'unreviewed'
  }
}

export async function POST(request) {
  try {
    const { textId, forceRecalculate = false } = await request.json()
    
    console.log('Calculating quality metrics...', { textId, forceRecalculate })
    
    // Build query
    let query = supabase
      .from('parallel_corpus')
      .select('*')
    
    // If textId provided, only calculate for that text
    if (textId) {
      query = query.eq('source_text_id', textId)
    }
    
    // If not forcing recalculation, only calculate for sentences without metrics
    if (!forceRecalculate) {
      query = query.is('quality_bucket', null)
    }
    
    const { data: sentences, error: fetchError } = await query
    
    if (fetchError) {
      console.error('Error fetching sentences:', fetchError)
      return Response.json({ error: fetchError.message }, { status: 500 })
    }
    
    if (!sentences || sentences.length === 0) {
      return Response.json({ 
        message: 'No sentences to process',
        processed: 0 
      })
    }
    
    console.log(`Processing ${sentences.length} sentences...`)
    
    // Calculate metrics for each sentence
    const updates = sentences.map(sentence => {
      const halunderWords = countWords(sentence.halunder_sentence)
      const germanWords = countWords(sentence.german_sentence)
      const halunderPunct = countPunctuation(sentence.halunder_sentence)
      const germanPunct = countPunctuation(sentence.german_sentence)
      
      const lengthRatio = calculateRatio(halunderWords, germanWords)
      const punctuationRatio = calculateRatio(halunderPunct, germanPunct)
      
      const qualityTags = determineQualityTags(lengthRatio, punctuationRatio)
      const qualityBucket = determineQualityBucket(qualityTags)
      
      return {
        id: sentence.id,
        halunder_word_count: halunderWords,
        german_word_count: germanWords,
        length_ratio: lengthRatio,
        halunder_punctuation_count: halunderPunct,
        german_punctuation_count: germanPunct,
        punctuation_ratio: punctuationRatio,
        quality_tags: qualityTags,
        quality_bucket: qualityBucket,
        updated_at: new Date().toISOString()
      }
    })
    
    // Batch update in chunks of 100
    const chunkSize = 100
    let totalUpdated = 0
    
    for (let i = 0; i < updates.length; i += chunkSize) {
      const chunk = updates.slice(i, i + chunkSize)
      
      // Update each record individually (Supabase doesn't support bulk updates well)
      for (const update of chunk) {
        const { error: updateError } = await supabase
          .from('parallel_corpus')
          .update({
            halunder_word_count: update.halunder_word_count,
            german_word_count: update.german_word_count,
            length_ratio: update.length_ratio,
            halunder_punctuation_count: update.halunder_punctuation_count,
            german_punctuation_count: update.german_punctuation_count,
            punctuation_ratio: update.punctuation_ratio,
            quality_tags: update.quality_tags,
            quality_bucket: update.quality_bucket,
            updated_at: update.updated_at
          })
          .eq('id', update.id)
        
        if (updateError) {
          console.error('Error updating sentence:', updateError)
        } else {
          totalUpdated++
        }
      }
    }
    
    // Get summary statistics
    const { data: stats, error: statsError } = await supabase
      .from('parallel_corpus')
      .select('quality_bucket')
      .in('id', updates.map(u => u.id))
    
    const bucketCounts = stats?.reduce((acc, item) => {
      acc[item.quality_bucket] = (acc[item.quality_bucket] || 0) + 1
      return acc
    }, {}) || {}
    
    return Response.json({
      message: 'Quality metrics calculated successfully',
      processed: sentences.length,
      updated: totalUpdated,
      bucketCounts
    })
    
  } catch (error) {
    console.error('Error calculating quality metrics:', error)
    return Response.json(
      { error: 'Failed to calculate quality metrics' },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  try {
    // Get counts of sentences by quality bucket
    const { data, error } = await supabase
      .from('parallel_corpus')
      .select('quality_bucket')
    
    if (error) {
      console.error('Error fetching bucket counts:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }
    
    const counts = data.reduce((acc, item) => {
      const bucket = item.quality_bucket || 'unprocessed'
      acc[bucket] = (acc[bucket] || 0) + 1
      return acc
    }, {})
    
    // Calculate total and percentage needing processing
    const total = data.length
    const unprocessed = counts.unprocessed || 0
    const percentageProcessed = total > 0 ? ((total - unprocessed) / total * 100).toFixed(1) : 0
    
    return Response.json({
      counts,
      total,
      unprocessed,
      percentageProcessed
    })
    
  } catch (error) {
    console.error('Error getting quality stats:', error)
    return Response.json(
      { error: 'Failed to get quality statistics' },
      { status: 500 }
    )
  }
}
