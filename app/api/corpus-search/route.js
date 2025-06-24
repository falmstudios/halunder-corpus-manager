import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const word = searchParams.get('word')
    const germanWords = searchParams.get('german') // Can be comma-separated
    
    if (!word && !germanWords) {
      return Response.json({ error: 'Word parameter required' }, { status: 400 })
    }
    
    console.log('Searching for word:', word, 'German:', germanWords)
    
    // Build query conditions
    let conditions = []
    
    // Add Halunder word search
    if (word) {
      conditions.push(`halunder_sentence.ilike.%${word}%`)
    }
    
    // Add German word searches (for each meaning)
    if (germanWords) {
      const germanList = germanWords.split(',').map(w => w.trim()).filter(w => w)
      germanList.forEach(germanWord => {
        conditions.push(`german_sentence.ilike.%${germanWord}%`)
      })
    }
    
    // Search with OR conditions
    let query = supabase
      .from('parallel_corpus')
      .select(`
        halunder_sentence,
        german_sentence,
        source_text_id,
        sentence_order,
        source_type
      `)
      .or(conditions.join(','))
    
    const { data, error } = await query.limit(200)
    
    if (error) {
      console.error('Database error:', error)
      throw error
    }
    
    console.log('Raw results:', data?.length || 0)
    
    // Filter results in JavaScript to ensure whole word matches
    const wordRegex = word ? new RegExp(`\\b${word}\\b`, 'i') : null
    const germanRegexes = germanWords ? 
      germanWords.split(',').map(w => w.trim()).filter(w => w).map(w => new RegExp(`\\b${w}\\b`, 'i')) : 
      []
    
    const sentences = (data || [])
      .filter(item => {
        const halunderMatch = wordRegex ? wordRegex.test(item.halunder_sentence) : false
        const germanMatch = germanRegexes.some(regex => regex.test(item.german_sentence))
        return halunderMatch || germanMatch
      })
      .map(item => {
        // Highlight all matched words
        let halunderHighlighted = item.halunder_sentence
        let germanHighlighted = item.german_sentence
        
        if (wordRegex) {
          halunderHighlighted = halunderHighlighted.replace(
            wordRegex, 
            `<mark style="background-color: yellow; padding: 2px;">$&</mark>`
          )
        }
        
        germanRegexes.forEach(regex => {
          germanHighlighted = germanHighlighted.replace(
            regex, 
            `<mark style="background-color: yellow; padding: 2px;">$&</mark>`
          )
        })
        
        return {
          halunder_sentence: item.halunder_sentence,
          german_sentence: item.german_sentence,
          source_text_id: item.source_text_id,
          source: `Text ${item.source_text_id}`,
          author: '',
          sentence_order: item.sentence_order,
          source_type: item.source_type,
          halunder_highlighted,
          german_highlighted
        }
      })
    
    // Get text titles if we have results
    if (sentences.length > 0) {
      const textIds = [...new Set(sentences.map(s => s.source_text_id).filter(id => id))]
      if (textIds.length > 0) {
        const { data: texts } = await supabase
          .from('texts')
          .select('id, title, author')
          .in('id', textIds)
        
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
    }
    
    console.log('Filtered results:', sentences.length)
    
    return Response.json({ sentences })
    
  } catch (error) {
    console.error('Corpus search error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
