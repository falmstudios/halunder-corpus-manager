import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return Response.json({ error: 'ID required' }, { status: 400 })
    }
    
    const { data, error } = await supabase
      .from('dictionary_entries')
      .select(`
        *,
        dictionary_meanings (
          *
        ),
        dictionary_examples (
          *,
          corpus_text:texts (
            id,
            title,
            author
          )
        ),
        dictionary_verb_details (*),
        dictionary_references!entry_id (
          *,
          referenced_entry:dictionary_entries!referenced_entry_id (
            id,
            halunder_word,
            german_word
          )
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    
    // Get word frequency
    const { data: frequency } = await supabase
      .from('dictionary_word_frequency')
      .select('frequency')
      .eq('halunder_word', data.halunder_word)
      .single()
    
    return Response.json({ 
      entry: {
        ...data,
        frequency: frequency?.frequency || 0
      }
    })
    
  } catch (error) {
    console.error('Dictionary entry error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    
    // Insert main entry
    const { data: entry, error: entryError } = await supabase
      .from('dictionary_entries')
      .insert({
        halunder_word: body.halunder_word,
        german_word: body.german_word,
        pronunciation: body.pronunciation,
        word_type: body.word_type,
        gender: body.gender,
        plural_form: body.plural_form,
        etymology: body.etymology,
        source: body.source || 'manual'
      })
      .select()
      .single()
    
    if (entryError) throw entryError
    
    // Insert meanings
    if (body.meanings?.length > 0) {
      const meanings = body.meanings.map((m, index) => ({
        entry_id: entry.id,
        meaning_number: m.meaning_number || index + 1,
        german_meaning: m.german_meaning,
        halunder_meaning: m.halunder_meaning,
        context: m.context,
        meaning_order: index
      }))
      
      const { error: meaningsError } = await supabase
        .from('dictionary_meanings')
        .insert(meanings)
      
      if (meaningsError) throw meaningsError
    }
    
    return Response.json({ entry })
    
  } catch (error) {
    console.error('Dictionary create error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    const { data, error } = await supabase
      .from('dictionary_entries')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return Response.json({ entry: data })
    
  } catch (error) {
    console.error('Dictionary update error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
