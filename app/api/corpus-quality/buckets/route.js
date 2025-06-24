import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    // Get all unique quality buckets and their counts
    const { data, error } = await supabase
      .from('parallel_corpus')
      .select('quality_bucket')
      .not('quality_bucket', 'is', null)
    
    if (error) {
      console.error('Error fetching buckets:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }
    
    // Count sentences in each bucket
    const bucketCounts = data.reduce((acc, item) => {
      const bucket = item.quality_bucket
      acc[bucket] = (acc[bucket] || 0) + 1
      return acc
    }, {})
    
    // Define bucket metadata
    const buckets = [
      {
        key: 'high_quality',
        label: 'High Quality',
        color: '#28a745',
        description: 'Similar length and punctuation',
        count: bucketCounts.high_quality || 0
      },
      {
        key: 'good_quality',
        label: 'Good Quality',
        color: '#90EE90',
        description: 'Similar length or punctuation',
        count: bucketCounts.good_quality || 0
      },
      {
        key: 'needs_review',
        label: 'Needs Review',
        color: '#ffc107',
        description: 'Some differences detected',
        count: bucketCounts.needs_review || 0
      },
      {
        key: 'poor_quality',
        label: 'Poor Quality',
        color: '#dc3545',
        description: 'Major differences in length and punctuation',
        count: bucketCounts.poor_quality || 0
      },
      {
        key: 'unreviewed',
        label: 'Unreviewed',
        color: '#6c757d',
        description: 'Not yet reviewed by human',
        count: bucketCounts.unreviewed || 0
      }
    ]
    
    // Get total count including null buckets
    const { count: totalCount, error: countError } = await supabase
      .from('parallel_corpus')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('Error getting total count:', countError)
    }
    
    // Get unprocessed count (null quality_bucket)
    const { count: unprocessedCount, error: unprocessedError } = await supabase
      .from('parallel_corpus')
      .select('*', { count: 'exact', head: true })
      .is('quality_bucket', null)
    
    if (unprocessedError) {
      console.error('Error getting unprocessed count:', unprocessedError)
    }
    
    return Response.json({
      buckets,
      totalProcessed: Object.values(bucketCounts).reduce((sum, count) => sum + count, 0),
      totalSentences: totalCount || 0,
      unprocessedCount: unprocessedCount || 0
    })
    
  } catch (error) {
    console.error('Error fetching bucket data:', error)
    return Response.json(
      { error: 'Failed to fetch bucket data' },
      { status: 500 }
    )
  }
}
