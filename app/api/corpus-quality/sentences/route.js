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
    const offset = (page - 1) * limit
    
    if (!bucket) {
      return Response.json({ 
        error: 'Bucket parameter is required' 
      }, { status: 400 })
    }
    
    // First, get the count
    const { count } = await supabase
      .from('parallel_corpus')
      .select('*', { count: 'exact', head: true })
      .eq('quality_bucket', bucket)
    
    // Then get the data with pagination
    const { data: sentences, error: sentencesError } = await supabase
      .from('parallel_corpus')
      .select(`
        id,
        halunder_sentence,
        german_sentence,
        halunder_word_count,
        german_word_count,
        length_ratio,
        halunder_punctuation_count,
        german_punctuation_count,
        punctuation_ratio,
        quality_tags,
        quality_bucket,
        quality_reviewed,
        quality_reviewer_notes,
        confidence_score,
        source_text_id,
        sentence_order,
        created_at,
        texts!source_text_id (
          id,
          title,
          author
        )
      `)
      .eq('quality_bucket', bucket)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (sentencesError) {
      console.error('Error fetching sentences:', sentencesError)
      return Response.json({ error: sentencesError.message }, { status: 500 })
    }
    
    return Response.json({
      sentences: sentences || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    }, { status: 200 })
    
  } catch (error) {
    console.error('Error in sentences endpoint:', error)
    return Response.json({ 
      error: error.message || 'Failed to fetch sentences' 
    }, { status: 500 })
  }
}
