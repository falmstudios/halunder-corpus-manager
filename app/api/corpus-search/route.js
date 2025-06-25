import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const word = searchParams.get('word')
    const germanWords = searchParams.get('german')
    
    if (!word) {
      return Response.json({ error: 'Word parameter is required' }, { status: 400 })
    }

    console.log('Searching for word:', word, 'German:', germanWords)

    // Search in parallel corpus
    let query = supabase
      .from('parallel_corpus')
      .select(`
        id,
        halunder_sentence,
        german_sentence,
        source_text_id,
        texts!source_text_id (
          title,
          author
        )
      `)

    // Build OR conditions for search
    let orConditions = [`halunder_sentence.ilike.%${word}%`]
    
    if (germanWords) {
      const germanWordList = germanWords.split(',').map(w => w.trim()).filter(w => w)
      germanWordList.forEach(germanWord => {
        orConditions.push(`german_sentence.ilike.%${germanWord}%`)
      })
    }

    query = query.or(orConditions.join(','))
    
    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    console.log('Raw results:', data?.length || 0)

    // Process results to add highlighting
    const sentences = (data || []).map(sentence => {
      // Create highlighted versions
      let halunderHighlighted = sentence.halunder_sentence
      let germanHighlighted = sentence.german_sentence
      
      // Highlight the search word in Halunder sentence
      const halunderRegex = new RegExp(`\\b${word}\\b`, 'gi')
      halunderHighlighted = halunderHighlighted.replace(halunderRegex, '<mark>$&</mark>')
      
      // Highlight German words if provided
      if (germanWords) {
        const germanWordList = germanWords.split(',').map(w => w.trim()).filter(w => w)
        germanWordList.forEach(germanWord => {
          const germanRegex = new RegExp(`\\b${germanWord}\\b`, 'gi')
          germanHighlighted = germanHighlighted.replace(germanRegex, '<mark>$&</mark>')
        })
      }
      
      return {
        id: sentence.id,
        halunder_sentence: sentence.halunder_sentence,
        german_sentence: sentence.german_sentence,
        halunder_highlighted: halunderHighlighted,
        german_highlighted: germanHighlighted,
        source: sentence.texts?.title || 'Unbekannte Quelle',
        author: sentence.texts?.author || null
      }
    })

    return Response.json({ sentences }, { status: 200 })

  } catch (error) {
    console.error('Corpus search error:', error)
    return Response.json({ 
      error: error.message || 'Search failed' 
    }, { status: 500 })
  }
}
