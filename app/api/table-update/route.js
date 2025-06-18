import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { table, id, column, value } = await request.json()
    
    if (!table || !id || !column) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Convert value to appropriate type
    let processedValue = value
    
    // Handle special values
    if (value === '' || value === null || value === 'null') {
      processedValue = null
    } else if (value === 'true' || value === 'false') {
      processedValue = value === 'true'
    } else if (!isNaN(value) && value !== '') {
      // Try to convert to number if it looks like a number
      const numValue = parseFloat(value)
      if (!isNaN(numValue)) {
        processedValue = numValue
      }
    }
    
    const { data, error } = await supabase
      .from(table)
      .update({ [column]: processedValue })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Update error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }
    
    return Response.json({ success: true, data })
    
  } catch (error) {
    console.error('API error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
