import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { entries, source } = await request.json()
    
    let processed = 0
    let errors = []
    
    for (const entry of entries) {
      try {
        // Check if entry already exists
        const { data: existing } = await supabase
          .from('dictionary_entries')
          .select('id')
          .eq('halunder_word', entry.halunderWord)
          .eq('source', source)
          .single()
        
        if (existing) {
          console.log(`Entry ${entry.halunderWord} already exists, skipping`)
          continue
        }
        
        // Insert main entry
        const { data: newEntry, error: entryError } = await supabase
          .from('dictionary_entries')
          .insert({
            halunder_word: entry.halunderWord,
            german_word: entry.germanWord,
            pronunciation: entry.pronunciation,
            word_type: entry.wordType,
            gender: entry.gender,
            plural_form: entry.pluralForm,
            etymology: entry.etymology || entry.additionalInfo,
            source: source
          })
          .select()
          .single()
        
        if (entryError) throw entryError
        
        // Insert verb details if present
        if (entry.verbDetails && (entry.verbDetails.verbClass || entry.verbDetails.conjugationClass)) {
          await supabase
            .from('dictionary_verb_details')
            .insert({
              entry_id: newEntry.id,
              verb_class: entry.verbDetails.verbClass,
              conjugation_class: entry.verbDetails.conjugationClass
            })
        }
        
        // Insert meanings
        if (entry.meanings && entry.meanings.length > 0) {
          const meanings = entry.meanings.map((m, index) => ({
            entry_id: newEntry.id,
            meaning_number: m.number || m.meaning_number || index + 1,
            german_meaning: m.germanMeaning,
            context: m.context,
            meaning_order: index
          }))
          
          const { data: insertedMeanings } = await supabase
            .from('dictionary_meanings')
            .insert(meanings)
            .select()
          
          // Insert examples for meanings
          for (let i = 0; i < entry.meanings.length; i++) {
            const meaning = entry.meanings[i]
            if (meaning.examples && meaning.examples.length > 0) {
              const examples = meaning.examples.map((ex, exIndex) => ({
                entry_id: newEntry.id,
                meaning_id: insertedMeanings[i].id,
                halunder_sentence: ex.halunder,
                german_sentence: ex.german,
                source_reference: ex.source,
                example_order: exIndex
              }))
              
              await supabase
                .from('dictionary_examples')
                .insert(examples)
            }
          }
        } else if (entry.germanMeaning) {
          // Single meaning entry
          const { data: meaning } = await supabase
            .from('dictionary_meanings')
            .insert({
              entry_id: newEntry.id,
              meaning_number: 1,
              german_meaning: entry.germanMeaning,
              meaning_order: 0
            })
            .select()
            .single()
          
          // Insert examples
          if (entry.examples && entry.examples.length > 0) {
            const examples = entry.examples.map((ex, index) => ({
              entry_id: newEntry.id,
              meaning_id: meaning.id,
              halunder_sentence: ex.halunder,
              german_sentence: ex.german,
              source_reference: ex.source,
              example_order: index
            }))
            
            await supabase
              .from('dictionary_examples')
              .insert(examples)
          }
        }
        
        processed++
        
      } catch (entryError) {
        errors.push({
          word: entry.halunderWord,
          error: entryError.message
        })
      }
    }
    
    return Response.json({
      processed,
      total: entries.length,
      errors
    })
    
  } catch (error) {
    console.error('Dictionary import error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
