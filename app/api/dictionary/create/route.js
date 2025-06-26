import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const entry = await request.json()
    
    if (!entry.halunder_word || !entry.german_word) {
      return Response.json({ 
        error: 'Halunder word and German translation are required' 
      }, { status: 400 })
    }

    // Check if entry already exists
    const { data: existing } = await supabase
      .from('dictionary_entries')
      .select('id')
      .eq('halunder_word', entry.halunder_word)
      .single()

    if (existing) {
      return Response.json({ 
        error: 'Ein Eintrag für dieses Wort existiert bereits' 
      }, { status: 400 })
    }

    // Insert new entry
    const { data, error } = await supabase
      .from('dictionary_entries')
      .insert({
        halunder_word: entry.halunder_word,
        german_word: entry.german_word,
        pronunciation: entry.pronunciation || null,
        word_type: entry.word_type || null,
        word_gender: entry.word_gender || null,
        etymology: entry.etymology || null,
        usage_notes: entry.usage_notes || null,
        source: entry.source || null
      })
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ entry: data })
    
  } catch (error) {
    console.error('API error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
