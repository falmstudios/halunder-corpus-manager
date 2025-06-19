import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    const { data, error } = await supabase
      .from('custom_buckets')
      .select('*')
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error('Database error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }
    
    return Response.json({ buckets: data || [] })
    
  } catch (error) {
    console.error('API error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { name, color } = await request.json()
    
    if (!name || !name.trim()) {
      return Response.json({ error: 'Bucket name is required' }, { status: 400 })
    }
    
    const bucketKey = name.toLowerCase().replace(/\s+/g, '_')
    
    // Check if bucket already exists
    const { data: existing } = await supabase
      .from('custom_buckets')
      .select('id')
      .eq('bucket_key', bucketKey)
      .single()
    
    if (existing) {
      return Response.json({ error: 'Bucket name already exists' }, { status: 400 })
    }
    
    const { data, error } = await supabase
      .from('custom_buckets')
      .insert({
        bucket_key: bucketKey,
        label: name.trim(),
        color: color || '#6c757d'
      })
      .select()
      .single()
    
    if (error) {
      console.error('Database error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }
    
    return Response.json({ bucket: data })
    
  } catch (error) {
    console.error('API error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const bucketKey = searchParams.get('bucketKey')
    
    if (!bucketKey) {
      return Response.json({ error: 'Bucket key is required' }, { status: 400 })
    }
    
    const { error } = await supabase
      .from('custom_buckets')
      .delete()
      .eq('bucket_key', bucketKey)
    
    if (error) {
      console.error('Database error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }
    
    return Response.json({ success: true })
    
  } catch (error) {
    console.error('API error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
