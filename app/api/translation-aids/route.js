import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const textId = searchParams.get('textId')
    
    if (!textId) {
      return Response.json({ error: 'textId parameter is required' }, { status: 400 })
    }
    
    const { data, error } = await supabase
      .from('translation_aids')
      .select('*')
      .eq('text_id', textId)
      .order('number', { ascending: true })
    
    if (error) {
      console.error('Database error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }
    
    return Response.json({ aids: data || [] })
    
  } catch (error) {
    console.error('API error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
