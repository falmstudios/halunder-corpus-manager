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
    
    console.log('Searching for word:', word)
    
    // Search in parallel_corpus table with proper join
    let query = supabase
      .from('parallel_corpus')
      .select(`
        halunder_sentence,
        german_sentence,
        source_text_id,
        sentence_order,
        source_type
      `)
    
    // Use simple contains search
    if (germanWord) {
      query = query.or(`halunder_sentence.ilike.%${word}%,german_sentence.ilike.%${germanWord}%`)
    } else {
      query = query.ilike('halunder_sentence', `%${word}%`)
    }
    
    const { data, error } = await query.limit(200)
    
    if (error) {
      console.error('Database error:', error)
      throw error
    }
    
    console.log('Raw results:', data?.length || 0)
    
    // Filter results in JavaScript to ensure whole word matches
    const wordRegex = new RegExp(`\\b${word}\\b`, 'i')
    const germanRegex = germanWord ? new RegExp(`\\b${germanWord}\\b`, 'i') : null
    
    const sentences = (data || [])
      .filter(item => {
        const halunderMatch = wordRegex.test(item.halunder_sentence)
        const germanMatch = germanRegex ? germanRegex.test(item.german_sentence) : false
        return halunderMatch || germanMatch
      })
      .map(item => {
        // Get text info separately if needed
        return {
          halunder_sentence: item.halunder_sentence,
          german_sentence: item.german_sentence,
          source: `Text ${item.source_text_id}`, // Fallback if join fails
          author: '',
          sentence_order: item.sentence_order,
          source_type: item.source_type,
          // Highlight the matched word
          halunder_highlighted: item.halunder_sentence.replace(
            wordRegex, 
            `<mark style="background-color: yellow; padding: 2px;">$&</mark>`
          ),
          german_highlighted: germanRegex ? 
            item.german_sentence.replace(germanRegex, `<mark style="background-color: yellow; padding: 2px;">$&</mark>`) : 
            item.german_sentence
        }
      })
    
    // If we have results, try to get text titles
    if (sentences.length > 0) {
      const textIds = [...new Set(sentences.map(s => s.source_text_id))]
      const { data: texts } = await supabase
        .from('texts')
        .select('id, title, author')
        .in('id', textIds)
      
      // Map text info to sentences
      if (texts) {
        sentences.forEach(sentence => {
          const text = texts.find(t => t.id === sentence.source_text_id)
          if (text) {
            sentence.source = text.title || 'Untitled'
            sentence.author = text.author || ''
          }
        })
      }
    }
    
    console.log('Filtered results:', sentences.length)
    
    return Response.json({ sentences })
    
  } catch (error) {
    console.error('Corpus search error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
