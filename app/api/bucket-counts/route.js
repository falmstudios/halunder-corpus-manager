import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    console.log('Fetching bucket counts...')
    
    // Get all texts with their review_status (the column might be called processing_status)
    const { data: texts, error: textsError } = await supabase
      .from('texts')
      .select('review_status, processing_status') // Try both possible column names
    
    if (textsError) {
      console.error('Database error:', textsError)
      return Response.json({ error: textsError.message }, { status: 500 })
    }
    
    console.log('Found texts:', texts?.length || 0)
    
    // Initialize counts
    const counts = {
      pending: 0,
      parallel_confirmed: 0,
      german_available: 0,
      halunder_only: 0,
      deleted: 0
    }
    
    // Count texts - use either review_status or processing_status
    texts.forEach(text => {
      const status = text.review_status || text.processing_status || 'pending'
      if (counts.hasOwnProperty(status)) {
        counts[status]++
      } else {
        // If it's not a recognized status, count as pending
        counts.pending++
      }
    })
    
    console.log('Calculated counts:', counts)
    
    return Response.json({ counts })
    
  } catch (error) {
    console.error('API error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
