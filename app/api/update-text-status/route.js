import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { id, status } = await request.json()
    
    if (!id || !status) {
      return Response.json({ error: 'ID and status are required' }, { status: 400 })
    }

    // Validate status
    const validStatuses = ['pending', 'parallel_confirmed', 'german_available', 'halunder_only', 'deleted']
    if (!validStatuses.includes(status)) {
      return Response.json({ error: 'Invalid status' }, { status: 400 })
    }

    const { error } = await supabase
      .from('texts')
      .update({ 
        review_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
    
    if (error) {
      console.error('Status update error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }
    
    return Response.json({ success: true })
    
  } catch (error) {
    console.error('API error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
