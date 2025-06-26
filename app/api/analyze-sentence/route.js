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
    
    if (error) throw error
    
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
