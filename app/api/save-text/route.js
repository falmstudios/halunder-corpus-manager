import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { 
      id, 
      complete_helgolandic_text, 
      german_translation_text, 
      editorial_introduction,
      translation_aids 
    } = await request.json()
    
    if (!id) {
      return Response.json({ error: 'Text ID is required' }, { status: 400 })
    }

    // Update the main text
    const { error: textError } = await supabase
      .from('texts')
      .update({
        complete_helgolandic_text,
        german_translation_text,
        editorial_introduction,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
    
    if (textError) {
      console.error('Text update error:', textError)
      return Response.json({ error: textError.message }, { status: 500 })
    }

    // Update translation aids
    if (translation_aids && Array.isArray(translation_aids)) {
      // First, delete existing translation aids
      await supabase
        .from('translation_aids')
        .delete()
        .eq('text_id', id)
      
      // Insert new translation aids (only if they have content)
      const validAids = translation_aids.filter(aid => 
        aid.term && aid.term.trim() !== '' && aid.explanation && aid.explanation.trim() !== ''
      )
      
      if (validAids.length > 0) {
        const aidsToInsert = validAids.map(aid => ({
          text_id: id,
          number: aid.number || null,
          term: aid.term.trim(),
          explanation: aid.explanation.trim()
        }))
        
        const { error: aidsError } = await supabase
          .from('translation_aids')
          .insert(aidsToInsert)
        
        if (aidsError) {
          console.error('Translation aids error:', aidsError)
          // Don't fail the whole request for translation aids errors
        }
      }
    }
    
    return Response.json({ success: true })
    
  } catch (error) {
    console.error('API error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
