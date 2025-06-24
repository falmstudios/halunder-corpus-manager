import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const word = searchParams.get('word')
    const germanWord = searchParams.get('german')
    
    if (!word) {
      return Response.json({ error: 'Word parameter required' }, { status: 400 })
    }
    
    // Create word boundary regex patterns
    // \y matches word boundaries in PostgreSQL
    const halunderPattern = `\\y${word}\\y`
    
    // Search in parallel corpus
    let query = supabase
      .from('parallel_corpus')
      .select(`
        halunder_sentence,
        german_sentence,
        source_text_id,
        texts!inner(title, author)
      `)
    
    // Search for whole word matches
    if (germanWord) {
      // If we have a German translation, search in both
      const germanPattern = `\\y${germanWord}\\y`
      query = query.or(`halunder_sentence.ilike.%${halunderPattern}%,german_sentence.ilike.%${germanPattern}%`)
    } else {
      // Otherwise just search in Halunder
      query = query.filter('halunder_sentence', 'ilike', `%${halunderPattern}%`)
    }
    
    const { data, error } = await query.limit(50)
    
    if (error) throw error
    
    // Filter results to ensure whole word matches (double-check in JavaScript)
    const wordRegex = new RegExp(`\\b${word}\\b`, 'i')
    const germanRegex = germanWord ? new RegExp(`\\b${germanWord}\\b`, 'i') : null
    
    const sentences = data
      .filter(item => {
        const halunderMatch = wordRegex.test(item.halunder_sentence)
        const germanMatch = germanRegex ? germanRegex.test(item.german_sentence) : false
        return halunderMatch || germanMatch
      })
      .map(item => ({
        halunder_sentence: item.halunder_sentence,
        german_sentence: item.german_sentence,
        source: item.texts?.title || 'Unbekannte Quelle',
        author: item.texts?.author,
        // Highlight the matched word
        halunder_highlighted: item.halunder_sentence.replace(
          wordRegex, 
          `<mark>$&</mark>`
        ),
        german_highlighted: germanRegex ? 
          item.german_sentence.replace(germanRegex, `<mark>$&</mark>`) : 
          item.german_sentence
      }))
    
    return Response.json({ sentences })
    
  } catch (error) {
    console.error('Corpus search error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
