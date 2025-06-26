import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Function to fetch all rows bypassing the 1000 row limit
async function fetchAllRows(query, pageSize = 1000) {
  let allData = []
  let rangeStart = 0
  let hasMore = true
  
  while (hasMore) {
    const { data, error } = await query
      .range(rangeStart, rangeStart + pageSize - 1)
      
    if (error) {
      console.error('Error fetching batch:', error)
      throw error
    }
    
    if (data && data.length > 0) {
      allData = allData.concat(data)
      rangeStart += pageSize
      hasMore = data.length === pageSize
    } else {
      hasMore = false
    }
  }
  
  return allData
}

export async function GET(request) {
  try {
    // For bucket counts, we can use Supabase's count functionality
    const bucketNames = ['high_quality', 'good_quality', 'needs_review', 'poor_quality', 'unreviewed', 'approved', 'rejected']
    const bucketCounts = {}
    
    // Get count for each bucket
    for (const bucketName of bucketNames) {
      let countQuery = supabase
        .from('parallel_corpus')
        .select('*', { count: 'exact', head: true })
      
      if (bucketName === 'unreviewed') {
        countQuery = countQuery.or('quality_bucket.is.null,quality_bucket.eq.unreviewed')
      } else {
        countQuery = countQuery.eq('quality_bucket', bucketName)
      }
      
      const { count } = await countQuery
      bucketCounts[bucketName] = count || 0
    }
    
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
