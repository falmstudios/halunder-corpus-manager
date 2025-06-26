import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const letter = searchParams.get('letter')
    
    let dbQuery = supabase
      .from('dictionary_entries')
      .select(`
        *,
        dictionary_meanings (
          id,
          meaning_number,
          definition,
          context,
          usage_notes
        )
      `)
      .order('halunder_word', { ascending: true })
    
    if (letter) {
      // Search by first letter of Halunder word
      dbQuery = dbQuery.ilike('halunder_word', `${letter}%`)
    } else if (query) {
      // Search in Halunder words (primary) or German translations
      dbQuery = dbQuery.or(`halunder_word.ilike.%${query}%,german_word.ilike.%${query}%`)
    }
    
    const { data, error } = await dbQuery.limit(100)
    
    if (error) {
      console.error('Search error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }
    
    return Response.json({ entries: data || [] })
    
  } catch (error) {
    console.error('API error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
