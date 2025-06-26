import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    // Get all sentences with their buckets
    const { data: allSentences, error } = await supabase
      .from('parallel_corpus')
      .select('quality_bucket')
    
    if (error) {
      console.error('Error fetching bucket data:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }
    
    // Initialize bucket counts
    const bucketCounts = {
      high_quality: 0,
      good_quality: 0,
      needs_review: 0,
      poor_quality: 0,
      unreviewed: 0,
      approved: 0,
      rejected: 0
    }
    
    // Count sentences per bucket
    allSentences.forEach(row => {
      const bucket = row.quality_bucket || 'unreviewed'
      if (bucket in bucketCounts) {
        bucketCounts[bucket]++
      } else {
        // Handle any unexpected bucket values
        console.warn('Unknown bucket:', bucket)
      }
    })
    
    // Define bucket metadata
    const bucketMetadata = {
      high_quality: {
        label: 'Hohe Qualität',
        color: '#28a745',
        description: 'Ähnliche Länge und Interpunktion'
      },
      good_quality: {
        label: 'Gute Qualität',
        color: '#90EE90',
        description: 'Entweder ähnliche Länge oder Interpunktion'
      },
      needs_review: {
        label: 'Überprüfung erforderlich',
        color: '#ffc107',
        description: 'Moderate Unterschiede'
      },
      poor_quality: {
        label: 'Schlechte Qualität',
        color: '#dc3545',
        description: 'Große Unterschiede in Länge und Interpunktion'
      },
      unreviewed: {
        label: 'Unbewertet',
        color: '#6c757d',
        description: 'Noch nicht bewertet'
      },
      approved: {
        label: 'Genehmigt',
        color: '#17a2b8',
        description: 'Manuell überprüft und genehmigt'
      },
      rejected: {
        label: 'Abgelehnt',
        color: '#343a40',
        description: 'Manuell überprüft und abgelehnt'
      }
    }
    
    // Build response with counts and metadata
    const buckets = Object.entries(bucketMetadata).map(([key, meta]) => ({
      key,
      ...meta,
      count: bucketCounts[key]
    }))
    
    // Calculate total
    const totalCount = Object.values(bucketCounts).reduce((sum, count) => sum + count, 0)
    
    console.log('Bucket distribution:', bucketCounts)
    console.log('Total sentences:', totalCount)
    
    return Response.json({
      buckets,
      totalCount,
      bucketCounts
    }, { status: 200 })
    
  } catch (error) {
    console.error('Error in buckets endpoint:', error)
    return Response.json({ 
      error: error.message || 'Failed to fetch bucket data' 
    }, { status: 500 })
  }
}
