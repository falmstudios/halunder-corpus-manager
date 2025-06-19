import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const bucket = searchParams.get('bucket') || 'pending'
    const search = searchParams.get('search') || ''
    
    let query = supabase
      .from('texts')
      .select(`
        *,
        documents (
          id,
          publication,
          date,
          year,
          month,
          edition,
          issue_number,
          page_numbers,
          source_file,
          halunder_sentence_count,
          filename
        )
      `)
    
    // Handle pending status (including null values)
    if (bucket === 'pending') {
      query = query.or('review_status.is.null,review_status.eq.pending')
    } else {
      query = query.eq('review_status', bucket)
    }
    
    // Apply search filter with proper format
    if (search.trim()) {
      const searchTerm = search.trim()
      query = query.or(`title.ilike.%${searchTerm}%,author.ilike.%${searchTerm}%,complete_helgolandic_text.ilike.%${searchTerm}%,german_translation_text.ilike.%${searchTerm}%`)
    }
    
    query = query.order('created_at', { ascending: true })
    
    const { data, error } = await query
    
    if (error) {
      console.error('Database error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }
    
    return Response.json({ texts: data || [] })
    
  } catch (error) {
    console.error('API error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
