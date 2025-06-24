import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { action, sentenceIds, targetBucket, reviewNotes } = await request.json()
    
    if (!action || !sentenceIds || sentenceIds.length === 0) {
      return Response.json(
        { error: 'Action and sentence IDs are required' },
        { status: 400 }
      )
    }
    
    console.log(`Performing bulk action: ${action} on ${sentenceIds.length} sentences`)
    
    let updates = {
      updated_at: new Date().toISOString()
    }
    
    switch (action) {
      case 'move_to_bucket':
        if (!targetBucket) {
          return Response.json(
            { error: 'Target bucket is required for move action' },
            { status: 400 }
          )
        }
        updates.quality_bucket = targetBucket
        break
        
      case 'mark_reviewed':
        updates.quality_reviewed = true
        if (reviewNotes) {
          updates.quality_reviewer_notes = reviewNotes
        }
        break
        
      case 'mark_unreviewed':
        updates.quality_reviewed = false
        updates.quality_reviewer_notes = null
        break
        
      case 'approve':
        updates.quality_bucket = 'high_quality'
        updates.quality_reviewed = true
        if (reviewNotes) {
          updates.quality_reviewer_notes = reviewNotes
        }
        break
        
      case 'reject':
        updates.quality_bucket = 'poor_quality'
        updates.quality_reviewed = true
        if (reviewNotes) {
          updates.quality_reviewer_notes = reviewNotes
        }
        break
        
      default:
        return Response.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }
    
    // Perform bulk update
    let successCount = 0
    let errorCount = 0
    const errors = []
    
    // Update in batches of 50
    const batchSize = 50
    for (let i = 0; i < sentenceIds.length; i += batchSize) {
      const batch = sentenceIds.slice(i, i + batchSize)
      
      const { error } = await supabase
        .from('parallel_corpus')
        .update(updates)
        .in('id', batch)
      
      if (error) {
        console.error('Batch update error:', error)
        errorCount += batch.length
        errors.push(error.message)
      } else {
        successCount += batch.length
      }
    }
    
    // If action is delete, handle separately
    if (action === 'delete') {
      const { error: deleteError } = await supabase
        .from('parallel_corpus')
        .delete()
        .in('id', sentenceIds)
      
      if (deleteError) {
        console.error('Bulk delete error:', deleteError)
        return Response.json({ error: deleteError.message }, { status: 500 })
      }
      
      return Response.json({
        message: `Successfully deleted ${sentenceIds.length} sentences`,
        deleted: sentenceIds.length
      })
    }
    
    return Response.json({
      message: `Bulk action completed`,
      action,
      totalSentences: sentenceIds.length,
      successCount,
      errorCount,
      errors: errors.length > 0 ? errors : undefined
    })
    
  } catch (error) {
    console.error('Error performing bulk action:', error)
    return Response.json(
      { error: 'Failed to perform bulk action' },
      { status: 500 }
    )
  }
}
