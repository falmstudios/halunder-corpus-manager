import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { entries, source = 'Krogmann' } = await request.json()
    
    if (!entries || !Array.isArray(entries)) {
      return Response.json({ error: 'Invalid entries array' }, { status: 400 })
    }
    
    let processed = 0
    const errors = []
    
    for (const entry of entries) {
      try {
        // Insert main dictionary entry
        const { data: newEntry, error: entryError } = await supabase
          .from('dictionary_entries')
          .insert({
            halunder_word: entry.halunderWord,
            pronunciation: entry.pronunciation,
            word_type: entry.wordType,
            gender: entry.gender,
            plural: entry.plural,
            german_word: entry.germanMeaning?.split(',')[0]?.trim(),
            etymology: entry.etymology,
            usage_notes: entry.usage,
            additional_info: entry.additionalInfo,
            homonym_number: entry.homonymNumber,
            alternate_forms: entry.alternativeForms,
            idioms: entry.idioms,
            references: entry.references,
            related_words: entry.relatedWords,
            compounds: entry.compounds,
            source: source
          })
          .select()
          .single()
        
        if (entryError) throw entryError
        
        // Insert alternative forms as word forms
        if (entry.alternativeForms && Array.isArray(entry.alternativeForms)) {
          for (const altForm of entry.alternativeForms) {
            // Parse form like "Kalberdaans (ka-.lbardgo.sn)"
            const match = altForm.match(/^([^\(]+)(?:\s*\(([^\)]+)\))?$/)
            if (match) {
              const [, wordForm, pronunciation] = match
              
              await supabase.from('dictionary_word_forms').insert({
                entry_id: newEntry.id,
                word_form: wordForm.trim(),
                form_type: 'alternate',
                description: pronunciation
              })
              
              if (pronunciation) {
                await supabase.from('dictionary_pronunciations').insert({
                  entry_id: newEntry.id,
                  pronunciation: pronunciation.trim(),
                  form_description: wordForm.trim()
                })
              }
            }
          }
        }
        
        // Insert plural as word form
        if (entry.plural) {
          await supabase.from('dictionary_word_forms').insert({
            entry_id: newEntry.id,
            word_form: entry.plural,
            form_type: 'plural'
          })
        }
        
        // Handle verb details
        if (entry.wordType?.includes('verb') || entry.conjugationClass) {
          const verbClassMatch = entry.wordType?.match(/verb\s*\(([^)]+)\)/)
          await supabase.from('dictionary_verb_details').insert({
            entry_id: newEntry.id,
            verb_class: verbClassMatch ? verbClassMatch[1] : entry.verbClass,
            conjugation_class: entry.conjugationClass
          })
        }
        
        // Insert meaning(s)
        const { data: meaning, error: meaningError } = await supabase
          .from('dictionary_meanings')
          .insert({
            entry_id: newEntry.id,
            meaning_number: 1,
            german_meaning: entry.germanMeaning,
            context: entry.context,
            usage_notes: entry.usage,
            meaning_order: 0
          })
          .select()
          .single()
        
        if (meaningError) throw meaningError
        
        // Insert examples
        if (entry.examples && Array.isArray(entry.examples)) {
          const examples = entry.examples.map((ex, index) => ({
            entry_id: newEntry.id,
            meaning_id: meaning.id,
            halunder_sentence: ex.halunder,
            german_sentence: ex.german,
            source_reference: ex.note || ex.source,
            context_note: ex.note,
            example_order: index
          }))
          
          const { error: examplesError } = await supabase
            .from('dictionary_examples')
            .insert(examples)
          
          if (examplesError) throw examplesError
        }
        
        processed++
        
      } catch (entryError) {
        console.error(`Error processing entry ${entry.halunderWord}:`, entryError)
        errors.push({
          word: entry.halunderWord,
          error: entryError.message
        })
      }
    }
    
    return Response.json({
      processed,
      total: entries.length,
      errors,
      message: `Successfully imported ${processed} of ${entries.length} entries`
    })
    
  } catch (error) {
    console.error('Dictionary import error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
