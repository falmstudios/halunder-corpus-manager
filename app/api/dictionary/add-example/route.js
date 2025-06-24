import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const body = await request.json()
    
    const { data, error } = await supabase
      .from('dictionary_examples')
      .insert({
        entry_id: body.entry_id,
        meaning_id: body.meaning_id,
        halunder_sentence: body.halunder_sentence,
        german_sentence: body.german_sentence,
        source_reference: body.source_reference,
        example_order: 999 // Add at the end
      })
      .select()
      .single()
    
    if (error) throw error
    
    return Response.json({ example: data })
    
  } catch (error) {
    console.error('Add example error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
