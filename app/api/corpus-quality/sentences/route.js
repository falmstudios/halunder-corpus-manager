import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const bucket = searchParams.get('bucket')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const textId = searchParams.get('textId')
    
    if (!bucket) {
      return Response.json(
        { error: 'Bucket parameter is required' },
        { status: 400 }
      )
    }
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit
    
    // Build query
    let query = supabase
      .from('parallel_corpus')
      .select(`
        *,
        texts!source_text_id (
          id,
          title,
          author
        )
      `)
      .eq('quality_bucket', bucket)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    // Filter by text if provided
    if (textId) {
      query = query.eq('source_text_id', textId)
    }
    
    const { data: sentences, error, count } = await query
    
    if (error) {
      console.error('Error fetching sentences:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }
    
    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('parallel_corpus')
      .select('*', { count: 'exact', head: true })
      .eq('quality_bucket', bucket)
      .modify((query) => {
        if (textId) query.eq('source_text_id', textId)
      })
    
    if (countError) {
      console.error('Error getting count:', countError)
    }
    
    // Format response
    const formattedSentences = sentences.map(sentence => ({
      id: sentence.id,
      halunder_sentence: sentence.halunder_sentence,
      german_sentence: sentence.german_sentence,
      halunder_word_count: sentence.halunder_word_count,
      german_word_count: sentence.german_word_count,
      length_ratio: sentence.length_ratio,
      halunder_punctuation_count: sentence.halunder_punctuation_count,
      german_punctuation_count: sentence.german_punctuation_count,
      punctuation_ratio: sentence.punctuation_ratio,
      quality_tags: sentence.quality_tags || [],
      quality_bucket: sentence.quality_bucket,
      quality_reviewed: sentence.quality_reviewed || false,
      quality_reviewer_notes: sentence.quality_reviewer_notes,
      confidence_score: sentence.confidence_score,
      source_text: sentence.texts ? {
        id: sentence.texts.id,
        title: sentence.texts.title,
        author: sentence.texts.author
      } : null,
      created_at: sentence.created_at,
      updated_at: sentence.updated_at
    }))
    
    return Response.json({
      sentences: formattedSentences,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      }
    })
    
  } catch (error) {
    console.error('Error fetching sentences:', error)
    return Response.json(
      { error: 'Failed to fetch sentences' },
      { status: 500 }
    )
  }
}
