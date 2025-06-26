import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const entry = await request.json()
    
    if (!entry.id) {
      return Response.json({ error: 'Entry ID is required' }, { status: 400 })
    }

    // Update the main entry
    const { data, error } = await supabase
      .from('dictionary_entries')
      .update({
        halunder_word: entry.halunder_word,
        german_word: entry.german_word,
        pronunciation: entry.pronunciation,
        word_type: entry.word_type,
        word_gender: entry.word_gender,
        etymology: entry.etymology,
        usage_notes: entry.usage_notes,
        source: entry.source,
        updated_at: new Date().toISOString()
      })
      .eq('id', entry.id)
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
      .single()

    if (error) {
      console.error('Update error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ entry: data })
    
  } catch (error) {
    console.error('API error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
