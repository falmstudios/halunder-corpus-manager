import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    // Get texts that have processed corpus data
    const { data, error } = await supabase
      .from('texts')
      .select(`
        id,
        title,
        author,
        review_status,
        parallel_corpus!inner(id)
      `)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    // Remove duplicates and flatten
    const uniqueTexts = data.reduce((acc, text) => {
      if (!acc.find(t => t.id === text.id)) {
        acc.push({
          id: text.id,
          title: text.title,
          author: text.author,
          review_status: text.review_status
        })
      }
      return acc
    }, [])

    return Response.json({ texts: uniqueTexts })

  } catch (error) {
    console.error('API error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
