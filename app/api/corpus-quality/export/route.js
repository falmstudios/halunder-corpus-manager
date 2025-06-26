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
    const { searchParams } = new URL(request.url)
    const bucket = searchParams.get('bucket')
    const format = searchParams.get('format') || 'json'
    
    if (!bucket) {
      return Response.json({ 
        error: 'Bucket parameter is required' 
      }, { status: 400 })
    }
    
    console.log(`Exporting sentences from bucket: ${bucket}, format: ${format}`)
    
    // Build query
    const query = supabase
      .from('parallel_corpus')
      .select(`
        id,
        halunder_sentence,
        german_sentence,
        quality_bucket,
        confidence_score,
        source_text_id,
        texts!source_text_id (
          title,
          author
        )
      `)
      .eq('quality_bucket', bucket)
      .order('created_at', { ascending: true })
    
    // Fetch ALL sentences from the bucket
    const sentences = await fetchAllRows(query)
    
    console.log(`Found ${sentences.length} sentences to export`)
    
    if (sentences.length === 0) {
      return Response.json({ 
        error: 'No sentences found in this bucket' 
      }, { status: 404 })
    }
    
    // Format the data based on requested format
    let responseData
    let contentType
    let filename
    
    switch (format) {
      case 'json':
        // JSON format for general use
        responseData = JSON.stringify({
          bucket,
          exportDate: new Date().toISOString(),
          totalSentences: sentences.length,
          sentences: sentences.map(s => ({
            id: s.id,
            halunder: s.halunder_sentence,
            german: s.german_sentence,
            confidence: s.confidence_score,
            source: s.texts?.title || 'Unknown',
            author: s.texts?.author || 'Unknown'
          }))
        }, null, 2)
        contentType = 'application/json'
        filename = `halunder_corpus_${bucket}_${new Date().toISOString().split('T')[0]}.json`
        break
        
      case 'jsonl':
        // JSONL format - one JSON object per line (good for training)
        responseData = sentences.map(s => 
          JSON.stringify({
            halunder: s.halunder_sentence,
            german: s.german_sentence,
            confidence: s.confidence_score || 1.0
          })
        ).join('\n')
        contentType = 'application/x-jsonlines'
        filename = `halunder_corpus_${bucket}_${new Date().toISOString().split('T')[0]}.jsonl`
        break
        
      case 'tsv':
        // TSV format - Tab-separated values
        const header = 'halunder\tgerman\tconfidence\tsource\n'
        responseData = header + sentences.map(s => 
          `${s.halunder_sentence.replace(/\t/g, ' ')}\t${s.german_sentence.replace(/\t/g, ' ')}\t${s.confidence_score || 1.0}\t${s.texts?.title || 'Unknown'}`
        ).join('\n')
        contentType = 'text/tab-separated-values'
        filename = `halunder_corpus_${bucket}_${new Date().toISOString().split('T')[0]}.tsv`
        break
        
      case 'csv':
        // CSV format
        const csvHeader = 'halunder,german,confidence,source\n'
        responseData = csvHeader + sentences.map(s => {
          const halunder = `"${s.halunder_sentence.replace(/"/g, '""')}"`
          const german = `"${s.german_sentence.replace(/"/g, '""')}"`
          const confidence = s.confidence_score || 1.0
          const source = `"${(s.texts?.title || 'Unknown').replace(/"/g, '""')}"`
          return `${halunder},${german},${confidence},${source}`
        }).join('\n')
        contentType = 'text/csv'
        filename = `halunder_corpus_${bucket}_${new Date().toISOString().split('T')[0]}.csv`
        break
        
      case 'txt':
        // Simple text format - parallel lines
        responseData = sentences.map(s => 
          `${s.halunder_sentence}\n${s.german_sentence}\n`
        ).join('\n')
        contentType = 'text/plain'
        filename = `halunder_corpus_${bucket}_${new Date().toISOString().split('T')[0]}.txt`
        break
        
      default:
        return Response.json({ 
          error: 'Invalid format. Supported formats: json, jsonl, tsv, csv, txt' 
        }, { status: 400 })
    }
    
    // Return the file as a download
    return new Response(responseData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Total-Sentences': sentences.length.toString()
      }
    })
    
  } catch (error) {
    console.error('Error in export endpoint:', error)
    return Response.json({ 
      error: error.message || 'Failed to export sentences' 
    }, { status: 500 })
  }
}
