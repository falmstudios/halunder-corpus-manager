import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { entries } = await request.json()
    
    if (!entries || !Array.isArray(entries)) {
      return Response.json({ 
        error: 'Entries must be an array' 
      }, { status: 400 })
    }

    const results = {
      imported: 0,
      skipped: 0,
      errors: 0,
      details: []
    }

    for (const entry of entries) {
      try {
        // Validate required fields
        if (!entry.halunderWord || !entry.germanMeaning) {
          results.skipped++
          results.details.push({
            word: entry.halunderWord || 'unknown',
            reason: 'Missing required fields'
          })
          continue
        }

        // Check if entry already exists
        const { data: existing } = await supabase
          .from('dictionary_entries')
          .select('id')
          .eq('halunder_word', entry.halunderWord)
          .single()

        if (existing) {
          results.skipped++
          results.details.push({
            word: entry.halunderWord,
            reason: 'Already exists'
          })
          continue
        }

        // Map word types
        let wordType = entry.wordType
        if (wordType) {
          const typeMap = {
            'Substantiv': 'noun',
            'Verb': 'verb',
            'Adjektiv': 'adjective',
            'Adverb': 'adverb',
            'Pronomen': 'pronoun',
            'Präposition': 'preposition',
            'Konjunktion': 'conjunction',
            'Interjektion': 'interjection',
            'Zahlwort': 'numeral',
            'Eigenname': 'proper noun'
          }
          wordType = typeMap[wordType] || wordType
        }

        // Insert new entry
        const { data: newEntry, error: insertError } = await supabase
          .from('dictionary_entries')
          .insert({
            halunder_word: entry.halunderWord,
            german_word: entry.germanMeaning,
            pronunciation: entry.pronunciation || null,
            word_type: wordType || null,
            word_gender: entry.wordGender || null,
            etymology: entry.etymology || null,
            usage_notes: entry.usageNotes || null,
            source: entry.source || 'Import'
          })
          .select()
          .single()

        if (insertError) {
          throw insertError
        }

        // Add meanings if provided
        if (entry.meanings && Array.isArray(entry.meanings)) {
          for (let i = 0; i < entry.meanings.length; i++) {
            const meaning = entry.meanings[i]
            await supabase
              .from('dictionary_meanings')
              .insert({
                entry_id: newEntry.id,
                meaning_number: i + 1,
                definition: meaning.definition || meaning,
                context: meaning.context || null,
                usage_notes: meaning.usageNotes || null
              })
          }
        } else if (entry.germanMeaning) {
          // Create a single meaning from the german word
          await supabase
            .from('dictionary_meanings')
            .insert({
              entry_id: newEntry.id,
              meaning_number: 1,
              definition: entry.germanMeaning
            })
        }

        results.imported++
      } catch (error) {
        results.errors++
        results.details.push({
          word: entry.halunderWord || 'unknown',
          error: error.message
        })
      }
    }

    return Response.json(results)
    
  } catch (error) {
    console.error('Import error:', error)
    return Response.json({ 
      error: error.message 
    }, { status: 500 })
  }
}
