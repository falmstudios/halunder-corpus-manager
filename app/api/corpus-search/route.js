import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const word = searchParams.get('word')
    
    if (!word) {
      return Response.json({ error: 'Word parameter required' }, { status: 400 })
    }
    
    // Search in parallel corpus
    const { data, error } = await supabase
      .from('parallel_corpus')
      .select(`
        halunder_sentence,
        german_sentence,
        source_text_id,
        texts!inner(title, author)
      `)
      .or(`halunder_sentence.ilike.%${word}%`)
      .limit(20)
    
    if (error) throw error
    
    const sentences = data.map(item => ({
      halunder_sentence: item.halunder_sentence,
      german_sentence: item.german_sentence,
      source: item.texts?.title || 'Unbekannte Quelle',
      author: item.texts?.author
    }))
    
    return Response.json({ sentences })
    
  } catch (error) {
    console.error('Corpus search error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
