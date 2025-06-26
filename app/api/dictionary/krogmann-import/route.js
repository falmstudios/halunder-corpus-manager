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
    const skipped = []
    
    for (const entry of entries) {
      try {
        // Check if entry already exists
        const { data: existing } = await supabase
          .from('dictionary_entries')
          .select('id, halunder_word')
          .eq('halunder_word', entry.halunderWord)
          .maybeSingle() // Use maybeSingle instead of single to avoid errors
        
        if (existing) {
          console.log(`Entry already exists: ${entry.halunderWord}`)
          skipped.push(entry.halunderWord)
          continue
        }
        
        // Build entry data with only existing columns
        const entryData = {
          halunder_word: entry.halunderWord,
          pronunciation: entry.pronunciation,
          word_type: entry.wordType,
          gender: entry.gender,
          german_word: entry.germanMeaning?.split(',')[0]?.trim(),
          etymology: entry.etymology,
          additional_info: entry.additionalInfo,
          source: source
        }
        
        // Add optional fields only if columns exist
        if (entry.plural) entryData.plural = entry.plural
        if (entry.usage || entry.usage_notes) entryData.usage_notes = entry.usage || entry.usage_notes
        if (entry.homonymNumber) entryData.homonym_number = entry.homonymNumber
        if (entry.alternativeForms) entryData.alternate_forms = entry.alternativeForms
        if (entry.idioms) entryData.idioms = entry.idioms
        if (entry.references) entryData.reference_notes = entry.references
        if (entry.relatedWords) entryData.related_words = entry.relatedWords
        if (entry.compounds) entryData.compounds = entry.compounds
        
        // Insert main dictionary entry
        const { data: newEntry, error: entryError } = await supabase
          .from('dictionary_entries')
          .insert(entryData)
          .select()
          .single()
        
        if (entryError) throw entryError
        
        // Insert meaning(s)
        if (entry.germanMeaning) {
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
          
          if (meaningError) {
            console.warn('Failed to insert meaning:', meaningError)
          } else {
            // Insert examples
            if (entry.examples && Array.isArray(entry.examples) && meaning) {
              for (const [index, ex] of entry.examples.entries()) {
                const exampleData = {
                  entry_id: newEntry.id,
                  meaning_id: meaning.id,
                  halunder_sentence: ex.halunder,
                  german_sentence: ex.german,
                  source_reference: ex.note || ex.source,
                  example_order: index
                }
                
                // Add context_note if column exists
                if (ex.note) {
                  exampleData.context_note = ex.note
                }
                
                const { error: exampleError } = await supabase
                  .from('dictionary_examples')
                  .insert(exampleData)
                
                if (exampleError) {
                  console.warn('Failed to insert example:', exampleError)
                }
              }
            }
          }
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
      skipped: skipped.length,
      errors,
      message: `Successfully imported ${processed} of ${entries.length} entries. Skipped ${skipped.length} existing entries.`
    })
    
  } catch (error) {
    console.error('Dictionary import error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
