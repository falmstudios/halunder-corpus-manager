import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const table = searchParams.get('table')
    const page = parseInt(searchParams.get('page')) || 1
    const pageSize = parseInt(searchParams.get('pageSize')) || 50
    const sortColumn = searchParams.get('sortColumn')
    const sortDirection = searchParams.get('sortDirection') || 'asc'
    
    if (!table) {
      return Response.json({ error: 'Table parameter is required' }, { status: 400 })
    }

    // Build the query
    let query = supabase.from(table).select('*', { count: 'exact' })
    
    // Apply filters
    for (const [key, value] of searchParams.entries()) {
      if (key.startsWith('filter_') || (!['table', 'page', 'pageSize', 'sortColumn', 'sortDirection'].includes(key) && value)) {
        const column = key.startsWith('filter_') ? key.replace('filter_', '') : key
        if (value && value.trim() !== '') {
          // Handle different filter types
          if (value === 'NULL' || value === 'null') {
            query = query.is(column, null)
          } else if (value === 'NOT_NULL' || value === 'not_null') {
            query = query.not(column, 'is', null)
          } else if (value === 'EMPTY' || value === 'empty') {
            query = query.eq(column, '')
          } else if (value === 'NOT_EMPTY' || value === 'not_empty') {
            query = query.neq(column, '')
          } else {
            // Text search (case insensitive)
            query = query.ilike(column, `%${value}%`)
          }
        }
      }
    }
    
    // Apply sorting
    if (sortColumn) {
      query = query.order(sortColumn, { ascending: sortDirection === 'asc' })
    } else {
      // Default sort by id
      query = query.order('id', { ascending: true })
    }
    
    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)
    
    const { data, error, count } = await query
    
    if (error) {
      console.error('Database error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }
    
    return Response.json({
      data: data || [],
      totalCount: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    })
    
  } catch (error) {
    console.error('API error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
