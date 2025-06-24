import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { entries, source } = await request.json()
    
    if (!entries || !Array.isArray(entries)) {
      return Response.json({ error: 'No valid entries array provided' }, { status: 400 })
    }
    
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
          processed++
          continue
        }
        
        // Insert main entry - handle different field names
        const { data: newEntry, error: entryError } = await supabase
          .from('dictionary_entries')
          .insert({
            halunder_word: entry.halunderWord,
            german_word: entry.germanWord || entry.german_word,
            pronunciation: entry.pronunciation,
            word_type: entry.wordType || entry.word_type,
            gender: entry.gender,
            plural_form: entry.pluralForm || entry.plural || entry.plural_form,
            etymology: entry.etymology,
            additional_info: entry.additionalInfo || entry.usage || entry.idioms || entry.references,
            source: source
          })
          .select()
          .single()
        
        if (entryError) throw entryError
        
        // Handle verb details if present
        if (entry.wordType && entry.wordType.includes('verb')) {
          // Extract verb class from wordType (e.g., "verb (weak)" -> "weak")
          const verbClassMatch = entry.wordType.match(/verb\s*\(([^)]+)\)/)
          if (verbClassMatch || entry.conjugationClass) {
            await supabase
              .from('dictionary_verb_details')
              .insert({
                entry_id: newEntry.id,
                verb_class: verbClassMatch ? verbClassMatch[1] : null,
                conjugation_class: entry.conjugationClass || null
              })
          }
        }
        
        // Handle meanings - your JSON has germanMeaning directly
        if (entry.germanMeaning) {
          const { data: meaning, error: meaningError } = await supabase
            .from('dictionary_meanings')
            .insert({
              entry_id: newEntry.id,
              meaning_number: 1,
              german_meaning: entry.germanMeaning,
              halunder_meaning: entry.halunderMeaning,
              context: entry.context || entry.usage,
              meaning_order: 0
            })
            .select()
            .single()
          
          if (meaningError) throw meaningError
          
          // Handle examples - they're directly on the entry in your JSON
          if (entry.examples && Array.isArray(entry.examples)) {
            const examples = entry.examples.map((ex, index) => ({
              entry_id: newEntry.id,
              meaning_id: meaning.id,
              halunder_sentence: ex.halunder,
              german_sentence: ex.german,
              source_reference: ex.source || ex.note,
              example_order: index
            }))
            
            const { error: examplesError } = await supabase
              .from('dictionary_examples')
              .insert(examples)
            
            if (examplesError) throw examplesError
          }
        }
        
        // Handle alternative forms as references
        if (entry.alternativeForms && Array.isArray(entry.alternativeForms)) {
          for (const altForm of entry.alternativeForms) {
            // First, check if the alternative form exists as an entry
            const { data: altEntry } = await supabase
              .from('dictionary_entries')
              .select('id')
              .eq('halunder_word', altForm.replace(/\s*\([^)]*\)\s*/g, '').trim())
              .single()
            
            if (altEntry) {
              await supabase
                .from('dictionary_references')
                .insert({
                  entry_id: newEntry.id,
                  referenced_entry_id: altEntry.id,
                  reference_type: 'alternative_form',
                  notes: 'Alternative form'
                })
            }
          }
        }
        
        // Handle compounds
        if (entry.compounds && Array.isArray(entry.compounds)) {
          const compounds = entry.compounds.map(comp => ({
            base_entry_id: newEntry.id,
            compound_word: comp.word || comp,
            compound_meaning: comp.meaning || null
          }))
          
          await supabase
            .from('dictionary_compounds')
            .insert(compounds)
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
