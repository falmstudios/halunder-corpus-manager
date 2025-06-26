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

// Function to fetch all rows bypassing the 1000 row limit
async function fetchAllRows(query, pageSize = 1000) {
  let allData = []
  let rangeStart = 0
  let hasMore = true
  
  while (hasMore) {
    const { data, error } = await query
      .range(rangeStart, rangeStart + pageSize - 1)
      
    if (error) {
      console.error('Error fetching batch:', error)
      throw error
    }
    
    if (data && data.length > 0) {
      allData = allData.concat(data)
      rangeStart += pageSize
      hasMore = data.length === pageSize
    } else {
      hasMore = false
    }
  }
  
  return allData
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { textId, sentenceIds, forceRecalculate } = body
    
    console.log('Calculating quality metrics for:', { textId, sentenceIds, forceRecalculate })
    
    // Build base query
    let baseQuery = supabase
      .from('parallel_corpus')
      .select('id, halunder_sentence, german_sentence, quality_bucket')
    
    // Only get sentences that need calculation
    if (!forceRecalculate) {
      baseQuery = baseQuery.or('quality_bucket.is.null,quality_bucket.eq.unreviewed')
    } else {
      // If force recalculate, get unreviewed sentences
      baseQuery = baseQuery.or('quality_bucket.is.null,quality_bucket.eq.unreviewed')
    }
    
    // Filter by text ID if provided
    if (textId) {
      baseQuery = baseQuery.eq('source_text_id', textId)
    }
    
    // Filter by specific sentence IDs if provided
    if (sentenceIds && sentenceIds.length > 0) {
      baseQuery = baseQuery.in('id', sentenceIds)
    }
    
    // Fetch ALL sentences using pagination
    const sentences = await fetchAllRows(baseQuery)
    
    if (!sentences || sentences.length === 0) {
      return Response.json({ 
        message: 'No sentences found to process',
        processed: 0 
      }, { status: 200 })
    }
    
    console.log(`Processing ${sentences.length} sentences (fetched all using pagination)...`)
    
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
    
    // Update sentences in batches
    const batchSize = 50
    let totalUpdated = 0
    let successfulUpdates = []
    
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize)
      
      // Update each sentence individually
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
            quality_bucket: update.quality_bucket,
            updated_at: new Date().toISOString()
          })
          .eq('id', update.id)
          .select()
      )
      
      const results = await Promise.all(updatePromises)
      
      // Track successful updates
      results.forEach((result, index) => {
        if (!result.error && result.data && result.data.length > 0) {
          successfulUpdates.push(batch[index])
          totalUpdated++
        } else if (result.error) {
          console.error('Error updating sentence:', batch[index].id, result.error)
        }
      })
      
      if (i % 500 === 0) {
        console.log(`Updated ${totalUpdated} of ${updates.length} sentences...`)
      }
    }
    
    // Get summary statistics from successful updates
    const bucketCounts = successfulUpdates.reduce((acc, update) => {
      acc[update.quality_bucket] = (acc[update.quality_bucket] || 0) + 1
      return acc
    }, {})
    
    console.log('Final bucket distribution:', bucketCounts)
    console.log('Total sentences found:', sentences.length)
    console.log('Total sentences updated:', totalUpdated)
    
    return Response.json({ 
      message: 'Quality metrics calculated successfully',
      totalFound: sentences.length,
      processed: updates.length,
      updated: totalUpdated,
      bucketCounts,
      sample: successfulUpdates.slice(0, 5)
    }, { status: 200 })
    
  } catch (error) {
    console.error('Error in calculate quality metrics:', error)
    return Response.json({ 
      error: error.message || 'Failed to calculate quality metrics' 
    }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    // Get count using Supabase count functionality (no 1000 limit)
    const { count: unreviewedCount, error: countError } = await supabase
      .from('parallel_corpus')
      .select('*', { count: 'exact', head: true })
      .or('quality_bucket.is.null,quality_bucket.eq.unreviewed')
    
    if (countError) {
      console.error('Error checking uncalculated sentences:', countError)
      return Response.json({ error: countError.message }, { status: 500 })
    }
    
    // Get total count
    const { count: totalCount, error: totalError } = await supabase
      .from('parallel_corpus')
      .select('*', { count: 'exact', head: true })
    
    if (totalError) {
      console.error('Error getting total count:', totalError)
    }
    
    // Get bucket distribution - fetch ALL rows
    const allSentencesQuery = supabase
      .from('parallel_corpus')
      .select('quality_bucket')
    
    const allSentences = await fetchAllRows(allSentencesQuery)
    
    let bucketCounts = {
      high_quality: 0,
      good_quality: 0,
      needs_review: 0,
      poor_quality: 0,
      unreviewed: 0,
      approved: 0,
      rejected: 0
    }
    
    allSentences.forEach(row => {
      const bucket = row.quality_bucket || 'unreviewed'
      if (bucket in bucketCounts) {
        bucketCounts[bucket]++
      }
    })
    
    console.log('Total sentences:', totalCount)
    console.log('Unreviewed sentences:', unreviewedCount)
    console.log('Bucket distribution:', bucketCounts)
    
    return Response.json({
      totalSentences: totalCount || 0,
      uncalculatedSentences: unreviewedCount || 0,
      calculatedSentences: (totalCount || 0) - (unreviewedCount || 0),
      bucketCounts
    }, { status: 200 })
    
  } catch (error) {
    console.error('Error getting calculation status:', error)
    return Response.json({ 
      error: error.message || 'Failed to get calculation status' 
    }, { status: 500 })
  }
}
