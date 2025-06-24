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
        
        // Combine all additional info fields
        let additionalInfo = []
        if (entry.additionalInfo) additionalInfo.push(entry.additionalInfo)
        if (entry.usage) additionalInfo.push(`Gebrauch: ${entry.usage}`)
        if (entry.idioms) additionalInfo.push(`Redewendungen: ${entry.idioms}`)
        if (entry.references) additionalInfo.push(`Verweise: ${entry.references}`)
        
        // Insert main entry
        const { data: newEntry, error: entryError } = await supabase
          .from('dictionary_entries')
          .insert({
            halunder_word: entry.halunderWord,
            german_word: entry.germanWord,
            pronunciation: entry.pronunciation,
            word_type: entry.wordType,
            gender: entry.gender,
            plural_form: entry.pluralForm || entry.plural,
            plural_pronunciation: entry.pluralPronunciation,
            etymology: entry.etymology,
            additional_info: additionalInfo.length > 0 ? additionalInfo.join('\n\n') : null,
            source: source
          })
          .select()
          .single()
        
        if (entryError) throw entryError
        
        // Handle verb details if present
        if (entry.wordType && entry.wordType.includes('verb')) {
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
        
        // Insert meaning
        if (entry.germanMeaning) {
          const { data: meaning, error: meaningError } = await supabase
            .from('dictionary_meanings')
            .insert({
              entry_id: newEntry.id,
              meaning_number: 1,
              german_meaning: entry.germanMeaning,
              halunder_meaning: entry.halunderMeaning,
              context: entry.context,
              usage_notes: entry.usage,
              meaning_order: 0
            })
            .select()
            .single()
          
          if (meaningError) throw meaningError
          
          // Handle examples
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
        
        // Store alternative forms in additional_info for now
        // Since we don't have a specific table for them
        
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
