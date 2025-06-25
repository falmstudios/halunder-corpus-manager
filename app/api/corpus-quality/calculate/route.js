import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Function to count words in a sentence
function countWords(text) {
  if (!text || typeof text !== 'string') return 0
  return text.trim().split(/\s+/).filter(word => word.length > 0).length
}

// Function to count punctuation marks
function countPunctuation(text) {
  if (!text || typeof text !== 'string') return 0
  // Count common punctuation marks
  const punctuationRegex = /[.,!?;:–—„""''«»]/g
  const matches = text.match(punctuationRegex)
  return matches ? matches.length : 0
}

// Function to calculate ratio (avoiding division by zero)
function calculateRatio(count1, count2) {
  if (count1 === 0 && count2 === 0) return 1
  if (count1 === 0 || count2 === 0) return 0
  const min = Math.min(count1, count2)
  const max = Math.max(count1, count2)
  return min / max
}

// Function to determine quality tags based on metrics
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

// Function to determine quality bucket based on tags
function determineQualityBucket(tags) {
  const hasSimilarLength = tags.includes('similar_length')
  const hasSimilarPunctuation = tags.includes('similar_punctuation')
  const hasDifferentLength = tags.includes('different_length')
  const hasVeryDifferentPunctuation = tags.includes('very_different_punctuation')
  
  // High Quality: both similar
  if (hasSimilarLength && hasSimilarPunctuation) {
    return 'high_quality'
  }
  
  // Poor Quality: both very different
  if (hasDifferentLength && hasVeryDifferentPunctuation) {
    return 'poor_quality'
  }
  
  // Good Quality: at least one similar
  if (hasSimilarLength || hasSimilarPunctuation) {
    return 'good_quality'
  }
  
  // Needs Review: some differences but not extreme
  return 'needs_review'
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { textId, sentenceIds, forceRecalculate } = body
    
    console.log('Calculating quality metrics for:', { textId, sentenceIds, forceRecalculate })
    
    // Build query
    let query = supabase
      .from('parallel_corpus')
      .select('id, halunder_sentence, german_sentence, quality_bucket')
    
    // If not force recalculate, only get sentences without quality metrics
    if (!forceRecalculate) {
      query = query.or('quality_bucket.is.null,quality_bucket.eq.unreviewed')
    }
    
    // Filter by text ID if provided
    if (textId) {
      query = query.eq('source_text_id', textId)
    }
    
    // Filter by specific sentence IDs if provided
    if (sentenceIds && sentenceIds.length > 0) {
      query = query.in('id', sentenceIds)
    }
    
    // Fetch sentences
    const { data: sentences, error: fetchError } = await query
    
    if (fetchError) {
      console.error('Error fetching sentences:', fetchError)
      return Response.json({ error: fetchError.message }, { status: 500 })
    }
    
    if (!sentences || sentences.length === 0) {
      return Response.json({ 
        message: 'No sentences found to process',
        processed: 0 
      }, { status: 200 })
    }
    
    console.log(`Processing ${sentences.length} sentences...`)
    
    // Calculate metrics for each sentence
    const updates = sentences.map(sentence => {
      // Count words
      const halunderWordCount = countWords(sentence.halunder_sentence)
      const germanWordCount = countWords(sentence.german_sentence)
      const lengthRatio = calculateRatio(halunderWordCount, germanWordCount)
      
      // Count punctuation
      const halunderPunctuationCount = countPunctuation(sentence.halunder_sentence)
      const germanPunctuationCount = countPunctuation(sentence.german_sentence)
      const punctuationRatio = calculateRatio(halunderPunctuationCount, germanPunctuationCount)
      
      // Determine quality tags and bucket
      const qualityTags = determineQualityTags(lengthRatio, punctuationRatio)
      const qualityBucket = determineQualityBucket(qualityTags)
      
      return {
        id: sentence.id,
        halunder_word_count: halunderWordCount,
        german_word_count: germanWordCount,
        length_ratio: lengthRatio,
        halunder_punctuation_count: halunderPunctuationCount,
        german_punctuation_count: germanPunctuationCount,
        punctuation_ratio: punctuationRatio,
        quality_tags: qualityTags,
        quality_bucket: qualityBucket
      }
    })
    
    // Update sentences in batches of 100
    const batchSize = 100
    let totalUpdated = 0
    
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize)
      
      // Update each sentence individually (Supabase doesn't support bulk updates with different values)
      const updatePromises = batch.map(update => 
        supabase
          .from('parallel_corpus')
          .update({
            halunder_word_count: update.halunder_word_count,
            german_word_count: update.german_word_count,
            length_ratio: update.length_ratio,
            halunder_punctuation_count: update.halunder_punctuation_count,
            german_punctuation_count: update.german_punctuation_count,
            punctuation_ratio: update.punctuation_ratio,
            quality_tags: update.quality_tags,
            quality_bucket: update.quality_bucket
          })
          .eq('id', update.id)
      )
      
      const results = await Promise.all(updatePromises)
      
      // Check for errors
      const errors = results.filter(result => result.error)
      if (errors.length > 0) {
        console.error('Errors updating sentences:', errors)
      }
      
      totalUpdated += batch.length - errors.length
      console.log(`Updated ${totalUpdated} of ${updates.length} sentences...`)
    }
    
    // Get summary statistics
    const bucketCounts = updates.reduce((acc, update) => {
      acc[update.quality_bucket] = (acc[update.quality_bucket] || 0) + 1
      return acc
    }, {})
    
    return Response.json({ 
      message: 'Quality metrics calculated successfully',
      processed: updates.length,
      updated: totalUpdated,
      bucketCounts,
      sample: updates.slice(0, 5) // Return first 5 as sample
    }, { status: 200 })
    
  } catch (error) {
    console.error('Error in calculate quality metrics:', error)
    return Response.json({ 
      error: error.message || 'Failed to calculate quality metrics' 
    }, { status: 500 })
  }
}

// GET endpoint to check calculation status or trigger calculation for all
export async function GET(request) {
  try {
    // Get count of sentences without quality metrics
    const { data, error, count } = await supabase
      .from('parallel_corpus')
      .select('id', { count: 'exact', head: true })
      .or('quality_bucket.is.null,quality_bucket.eq.unreviewed')
    
    if (error) {
      console.error('Error checking uncalculated sentences:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }
    
    // Get total count
    const { count: totalCount } = await supabase
      .from('parallel_corpus')
      .select('id', { count: 'exact', head: true })
    
    // Get bucket counts
    const { data: bucketData, error: bucketError } = await supabase
      .from('parallel_corpus')
      .select('quality_bucket')
      .not('quality_bucket', 'is', null)
    
    let bucketCounts = {}
    if (bucketData) {
      bucketCounts = bucketData.reduce((acc, row) => {
        acc[row.quality_bucket] = (acc[row.quality_bucket] || 0) + 1
        return acc
      }, {})
    }
    
    return Response.json({
      totalSentences: totalCount || 0,
      uncalculatedSentences: count || 0,
      calculatedSentences: (totalCount || 0) - (count || 0),
      bucketCounts
    }, { status: 200 })
    
  } catch (error) {
    console.error('Error getting calculation status:', error)
    return Response.json({ 
      error: error.message || 'Failed to get calculation status' 
    }, { status: 500 })
  }
}
