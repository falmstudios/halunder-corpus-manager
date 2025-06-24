import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const body = await request.json()
    const { 
      id, 
      quality_bucket, 
      quality_reviewed, 
      quality_reviewer_notes,
      halunder_sentence,
      german_sentence 
    } = body
    
    if (!id) {
      return Response.json(
        { error: 'Sentence ID is required' },
        { status: 400 }
      )
    }
    
    // Build update object
    const updates = {
      updated_at: new Date().toISOString()
    }
    
    // Add fields if provided
    if (quality_bucket !== undefined) updates.quality_bucket = quality_bucket
    if (quality_reviewed !== undefined) updates.quality_reviewed = quality_reviewed
    if (quality_reviewer_notes !== undefined) updates.quality_reviewer_notes = quality_reviewer_notes
    if (halunder_sentence !== undefined) updates.halunder_sentence = halunder_sentence
    if (german_sentence !== undefined) updates.german_sentence = german_sentence
    
    // If sentences were updated, recalculate metrics
    if (halunder_sentence !== undefined || german_sentence !== undefined) {
      // Get current sentence if we need one of the texts
      if (halunder_sentence === undefined || german_sentence === undefined) {
        const { data: current, error: fetchError } = await supabase
          .from('parallel_corpus')
          .select('halunder_sentence, german_sentence')
          .eq('id', id)
          .single()
        
        if (fetchError) {
          return Response.json({ error: 'Failed to fetch current sentence' }, { status: 500 })
        }
        
        if (halunder_sentence === undefined) updates.halunder_sentence = current.halunder_sentence
        if (german_sentence === undefined) updates.german_sentence = current.german_sentence
      }
      
      // Recalculate metrics
      const halunderWords = countWords(updates.halunder_sentence || halunder_sentence)
      const germanWords = countWords(updates.german_sentence || german_sentence)
      const halunderPunct = countPunctuation(updates.halunder_sentence || halunder_sentence)
      const germanPunct = countPunctuation(updates.german_sentence || german_sentence)
      
      updates.halunder_word_count = halunderWords
      updates.german_word_count = germanWords
      updates.length_ratio = calculateRatio(halunderWords, germanWords)
      updates.halunder_punctuation_count = halunderPunct
      updates.german_punctuation_count = germanPunct
      updates.punctuation_ratio = calculateRatio(halunderPunct, germanPunct)
      
      // Recalculate quality tags and bucket
      updates.quality_tags = determineQualityTags(updates.length_ratio, updates.punctuation_ratio)
      // Only update bucket if not manually set
      if (quality_bucket === undefined) {
        updates.quality_bucket = determineQualityBucket(updates.quality_tags)
      }
    }
    
    // Update the sentence
    const { data, error } = await supabase
      .from('parallel_corpus')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating sentence:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }
    
    return Response.json({
      message: 'Sentence updated successfully',
      sentence: data
    })
    
  } catch (error) {
    console.error('Error updating sentence:', error)
    return Response.json(
      { error: 'Failed to update sentence' },
      { status: 500 }
    )
  }
}

// Helper functions (same as in calculate route)
function countWords(text) {
  if (!text) return 0
  return text.trim().split(/\s+/).filter(word => word.length > 0).length
}

function countPunctuation(text) {
  if (!text) return 0
  const punctuationRegex = /[.,!?;:–—„"\"\']/g
  const matches = text.match(punctuationRegex)
  return matches ? matches.length : 0
}

function calculateRatio(num1, num2) {
  if (num1 === 0 && num2 === 0) return 1
  if (num1 === 0 || num2 === 0) return 0
  const min = Math.min(num1, num2)
  const max = Math.max(num1, num2)
  return min / max
}

function determineQualityTags(lengthRatio, punctuationRatio) {
  const tags = []
  
  if (lengthRatio >= 0.8) {
    tags.push('similar_length')
  } else if (lengthRatio < 0.6) {
    tags.push('different_length')
  }
  
  if (punctuationRatio >= 0.8) {
    tags.push('similar_punctuation')
  } else if (punctuationRatio < 0.5) {
    tags.push('very_different_punctuation')
  }
  
  return tags
}

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

// DELETE endpoint to remove a sentence
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return Response.json(
        { error: 'Sentence ID is required' },
        { status: 400 }
      )
    }
    
    const { error } = await supabase
      .from('parallel_corpus')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting sentence:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }
    
    return Response.json({
      message: 'Sentence deleted successfully'
    })
    
  } catch (error) {
    console.error('Error deleting sentence:', error)
    return Response.json(
      { error: 'Failed to delete sentence' },
      { status: 500 }
    )
  }
}
