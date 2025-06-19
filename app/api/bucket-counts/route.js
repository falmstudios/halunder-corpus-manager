import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    // Get all texts with their review_status
    const { data: texts, error: textsError } = await supabase
      .from('texts')
      .select('review_status')
    
    if (textsError) {
      console.error('Database error:', textsError)
      return Response.json({ error: textsError.message }, { status: 500 })
    }
    
    // Get all custom buckets
    const { data: customBuckets, error: bucketsError } = await supabase
      .from('custom_buckets')
      .select('bucket_key')
    
    if (bucketsError) {
      console.error('Custom buckets error:', bucketsError)
      return Response.json({ error: bucketsError.message }, { status: 500 })
    }
    
    // Initialize counts for default buckets
    const counts = {
      pending: 0,
      parallel_confirmed: 0,
      german_available: 0,
      halunder_only: 0,
      deleted: 0
    }
    
    // Initialize counts for custom buckets
    customBuckets.forEach(bucket => {
      counts[bucket.bucket_key] = 0
    })
    
    // Count all texts including those with null review_status (treat as pending)
    texts.forEach(text => {
      const status = text.review_status || 'pending'
      if (counts.hasOwnProperty(status)) {
        counts[status]++
      } else {
        // Handle case where text has a status that's not in our buckets
        // This could happen if a custom bucket was deleted but texts still reference it
        console.warn(`Found text with unknown status: ${status}`)
      }
    })
    
    console.log('Bucket counts:', counts) // Debug log
    
    return Response.json({ counts })
    
  } catch (error) {
    console.error('API error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
