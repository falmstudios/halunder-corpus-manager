import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { sentence } = await request.json()
    
    if (!sentence) {
      return Response.json({ error: 'Sentence is required' }, { status: 400 })
    }
    
    console.log('Analyzing sentence:', sentence)
    
    // Split sentence into words (basic tokenization)
    // Remove punctuation and convert to lowercase for matching
    const words = sentence
      .toLowerCase()
      .replace(/[.,!?;:'"„"»«\-–—]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0)
    
    console.log('Words to analyze:', words)
    
    // Look up all words in dictionary
    const wordAnalysis = {}
    const unknownWords = []
    
    for (const word of words) {
      // Try exact match first
      let { data: entries, error } = await supabase
        .from('dictionary_entries')
        .select(`
          id,
          halunder_word,
          pronunciation,
          word_type,
          gender,
          etymology,
          usage_notes,
          plural,
          additional_info,
          dictionary_meanings (
            id,
            german_meaning,
            meaning_number
          )
        `)
        .eq('halunder_word', word)
      
      // If no exact match, try case-insensitive
      if (!entries || entries.length === 0) {
        const result = await supabase
          .from('dictionary_entries')
          .select(`
            id,
            halunder_word,
            pronunciation,
            word_type,
            gender,
            etymology,
            usage_notes,
            plural,
            additional_info,
            dictionary_meanings (
              id,
              german_meaning,
              meaning_number
            )
          `)
          .ilike('halunder_word', word)
        
        entries = result.data
        error = result.error
      }
      
      // If still no match, check word forms table
      if (!entries || entries.length === 0) {
        const { data: wordForms } = await supabase
          .from('dictionary_word_forms')
          .select(`
            entry_id,
            word_form,
            form_type,
            dictionary_entries (
              id,
              halunder_word,
              pronunciation,
              word_type,
              gender,
              etymology,
              usage_notes,
              dictionary_meanings (
                id,
                german_meaning,
                meaning_number
              )
            )
          `)
          .ilike('word_form', word)
        
        if (wordForms && wordForms.length > 0) {
          entries = wordForms.map(wf => ({
            ...wf.dictionary_entries,
            matched_form: wf.word_form,
            form_type: wf.form_type
          }))
        }
      }
      
      if (!error && entries && entries.length > 0) {
        wordAnalysis[word] = entries.map(entry => ({
          word,
          entry_id: entry.id,
          halunder_word: entry.halunder_word,
          word_type: entry.word_type,
          gender: entry.gender,
          german_meaning: entry.dictionary_meanings
            ?.map(m => m.german_meaning)
            ?.filter(m => m)
            ?.join('; ') || '',
          pronunciation: entry.pronunciation,
          etymology: entry.etymology,
          usage_notes: entry.usage_notes,
          matched_form: entry.matched_form,
          form_type: entry.form_type
        }))
        
        console.log(`Found ${entries.length} entries for word:`, word)
      } else {
        unknownWords.push(word)
        console.log('No entries found for word:', word)
      }
    }
    
    const stats = {
      totalWords: words.length,
      knownWords: Object.keys(wordAnalysis).length,
      unknownWords: unknownWords.length,
      coverage: words.length > 0 
        ? (Object.keys(wordAnalysis).length / words.length * 100).toFixed(1) + '%'
        : '0%'
    }
    
    console.log('Analysis complete:', stats)
    
    return Response.json({
      sentence,
      words,
      wordAnalysis,
      unknownWords,
      stats
    })
    
  } catch (error) {
    console.error('Sentence analysis error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
