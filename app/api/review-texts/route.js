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
        id,
        title,
        subtitle,
        author,
        translator,
        editor_corrector,
        text_quality,
        complete_helgolandic_text,
        german_translation_text,
        editorial_introduction,
        review_status,
        created_at,
        documents (
          publication,
          year,
          filename
        )
      `)
      .eq('review_status', bucket)
      .order('created_at', { ascending: true })
    
    // Apply search filter
    if (search.trim()) {
      query = query.or(`
        title.ilike.%${search}%,
        author.ilike.%${search}%,
        complete_helgolandic_text.ilike.%${search}%,
        german_translation_text.ilike.%${search}%
      `)
    }
    
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
