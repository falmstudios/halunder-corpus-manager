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
      // Search in dictionary_entries from ALL sources
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
          source,
          german_word,
          dictionary_meanings (
            id,
            german_meaning,
            meaning_number
          ),
          dictionary_examples (
            halunder_sentence,
            german_sentence
          )
        `)
        .or(`halunder_word.eq.${word},halunder_word.ilike.${word}`)
        .limit(10)
      
      if (!error && entries && entries.length > 0) {
        wordAnalysis[word] = entries.map(entry => ({
          word,
          entry_id: entry.id,
          halunder_word: entry.halunder_word,
          word_type: entry.word_type,
          gender: entry.gender,
          german_meaning: entry.german_word || 
            entry.dictionary_meanings
              ?.map(m => m.german_meaning)
              ?.filter(m => m)
              ?.join('; ') || '',
          pronunciation: entry.pronunciation,
          etymology: entry.etymology,
          usage_notes: entry.usage_notes,
          source: entry.source,
          examples: entry.dictionary_examples || []
        }))
        
        console.log(`Found ${entries.length} entries for word "${word}" from sources:`, 
          entries.map(e => e.source).filter((v, i, a) => a.indexOf(v) === i))
      } else {
        // Also check the German side
        const { data: germanEntries } = await supabase
          .from('dictionary_entries')
          .select(`
            id,
            halunder_word,
            german_word,
            pronunciation,
            word_type,
            gender,
            source
          `)
          .ilike('german_word', `%${word}%`)
          .limit(5)
        
        if (germanEntries && germanEntries.length > 0) {
          // Word found as German translation
          console.log(`Word "${word}" found as German translation in ${germanEntries.length} entries`)
        } else {
          unknownWords.push(word)
          console.log('No entries found for word:', word)
        }
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
