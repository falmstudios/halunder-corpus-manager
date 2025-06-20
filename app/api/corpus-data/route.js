import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const textId = searchParams.get('textId')
    const type = searchParams.get('type')

    if (!type) {
      return Response.json({ error: 'Type parameter is required' }, { status: 400 })
    }

    let data, error

    switch (type) {
      case 'parallel':
        if (textId) {
          // Get sentences for specific text
          ({ data, error } = await supabase
            .from('parallel_corpus')
            .select('*')
            .eq('source_text_id', textId)
            .order('sentence_order', { ascending: true }))
        } else {
          // Get all sentences with text info
          ({ data, error } = await supabase
            .from('parallel_corpus')
            .select(`
              *,
              texts!inner(title)
            `)
            .order('created_at', { ascending: false }))
          
          // Add source text title to each sentence
          if (data) {
            data = data.map(sentence => ({
              ...sentence,
              source_text_title: sentence.texts?.title || 'Untitled'
            }))
          }
        }
        break

      case 'features':
        if (textId) {
          // Get features for specific text
          ({ data, error } = await supabase
            .from('linguistic_features')
            .select('*')
            .eq('source_text_id', textId)
            .order('created_at', { ascending: true }))
        } else {
          // Get all features with text info
          ({ data, error } = await supabase
            .from('linguistic_features')
            .select(`
              *,
              texts!inner(title)
            `)
            .order('created_at', { ascending: false }))
          
          // Add source text title to each feature
          if (data) {
            data = data.map(feature => ({
              ...feature,
              source_text_title: feature.texts?.title || 'Untitled'
            }))
          }
        }
        break

      case 'vocabulary':
        ({ data, error } = await supabase
          .from('vocabulary_tracker')
          .select('*')
          .order('frequency_count', { ascending: false })
          .limit(100))
        break

      default:
        return Response.json({ error: 'Invalid type parameter' }, { status: 400 })
    }

    if (error) {
      console.error('Database error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ data: data || [] })

  } catch (error) {
    console.error('API error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
