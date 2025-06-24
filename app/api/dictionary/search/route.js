import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const searchType = searchParams.get('type') || 'both'
    const source = searchParams.get('source')
    const limit = parseInt(searchParams.get('limit')) || 100
    
    let supabaseQuery = supabase
      .from('dictionary_entries')
      .select(`
        *,
        dictionary_meanings (
          id,
          meaning_number,
          german_meaning,
          halunder_meaning,
          context,
          usage_notes
        ),
        dictionary_examples (
          id,
          halunder_sentence,
          german_sentence,
          source_reference
        ),
        dictionary_verb_details (
          verb_class,
          conjugation_class
        )
      `)
    
    // Handle letter search vs text search
    if (query.length === 1 && /^[A-ZÄÖÜ]$/i.test(query)) {
      // Single letter - filter by first letter
      supabaseQuery = supabaseQuery.ilike('halunder_word', `${query}%`)
    } else if (query) {
      // Text search
      if (searchType === 'halunder') {
        supabaseQuery = supabaseQuery.ilike('halunder_word', `%${query}%`)
      } else if (searchType === 'german') {
        // Search in german_word or in meanings
        supabaseQuery = supabaseQuery.or(
          `german_word.ilike.%${query}%,dictionary_meanings.german_meaning.ilike.%${query}%`
        )
      } else {
        // Search both
        supabaseQuery = supabaseQuery.or(
          `halunder_word.ilike.%${query}%,german_word.ilike.%${query}%,dictionary_meanings.german_meaning.ilike.%${query}%`
        )
      }
    }
    
    if (source && source !== 'all') {
      supabaseQuery = supabaseQuery.eq('source', source)
    }
    
    supabaseQuery = supabaseQuery
      .order('halunder_word')
      .limit(limit)
    
    const { data, error } = await supabaseQuery
    
    if (error) throw error
    
    return Response.json({ entries: data || [] })
    
  } catch (error) {
    console.error('Dictionary search error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
