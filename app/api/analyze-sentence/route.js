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
    
    // Split sentence into words (basic tokenization)
    // Remove punctuation and convert to lowercase for matching
    const words = sentence
      .toLowerCase()
      .replace(/[.,!?;:'"„"»«]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 0)
    
    // Look up all words in dictionary
    const { data: lookupResults, error } = await supabase
      .rpc('lookup_dictionary_words', { words })
    
    if (error) {
      console.error('Dictionary lookup error:', error)
      // If the RPC function doesn't exist, fall back to direct query
      const wordAnalysis = {}
      const unknownWords = []
      
      for (const word of words) {
        const { data: entries, error: queryError } = await supabase
          .from('dictionary_entries')
          .select(`
            id,
            halunder_word,
            pronunciation,
            word_type,
            gender,
            etymology,
            usage_notes,
            dictionary_meanings (
              german_meaning
            )
          `)
          .ilike('halunder_word', word)
          .limit(5)
        
        if (!queryError && entries && entries.length > 0) {
          wordAnalysis[word] = entries.map(entry => ({
            word,
            entry_id: entry.id,
            halunder_word: entry.halunder_word,
            word_type: entry.word_type,
            gender: entry.gender,
            german_meaning: entry.dictionary_meanings?.[0]?.german_meaning || '',
            pronunciation: entry.pronunciation,
            etymology: entry.etymology,
            usage_notes: entry.usage_notes
          }))
        } else {
          unknownWords.push(word)
        }
      }
      
      return Response.json({
        sentence,
        words,
        wordAnalysis,
        unknownWords,
        stats: {
          totalWords: words.length,
          knownWords: Object.keys(wordAnalysis).length,
          unknownWords: unknownWords.length,
          coverage: (Object.keys(wordAnalysis).length / words.length * 100).toFixed(1) + '%'
        }
      })
    }
    
    // Group results by word
    const wordAnalysis = {}
    for (const result of lookupResults || []) {
      if (result.entry_id) {
        if (!wordAnalysis[result.word]) {
          wordAnalysis[result.word] = []
        }
        wordAnalysis[result.word].push(result)
      }
    }
    
    // Identify unknown words
    const unknownWords = words.filter(word => !wordAnalysis[word])
    
    return Response.json({
      sentence,
      words,
      wordAnalysis,
      unknownWords,
      stats: {
        totalWords: words.length,
        knownWords: Object.keys(wordAnalysis).length,
        unknownWords: unknownWords.length,
        coverage: (Object.keys(wordAnalysis).length / words.length * 100).toFixed(1) + '%'
      }
    })
    
  } catch (error) {
    console.error('Sentence analysis error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
