import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    // Get counts for each status
    const { data, error } = await supabase
      .from('texts')
      .select('review_status')
    
    if (error) {
      console.error('Database error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }
    
    // Count by status
    const counts = {
      pending: 0,
      parallel_confirmed: 0,
      german_available: 0,
      halunder_only: 0,
      deleted: 0
    }
    
    // Count all texts including those with null review_status (treat as pending)
    data.forEach(text => {
      const status = text.review_status || 'pending'
      if (counts.hasOwnProperty(status)) {
        counts[status]++
      }
    })
    
    console.log('Bucket counts:', counts) // Debug log
    
    return Response.json({ counts })
    
  } catch (error) {
    console.error('API error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
