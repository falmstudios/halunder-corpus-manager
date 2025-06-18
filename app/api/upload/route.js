import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    
    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }

    // Read the JSON file
    const text = await file.text()
    const jsonData = JSON.parse(text)
    
    // Process the JSON data
    const result = await processJsonData(jsonData)
    
    return Response.json({ 
      message: 'File processed successfully',
      ...result
    })
    
  } catch (error) {
    console.error('Upload error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

async function processJsonData(data) {
  if (!Array.isArray(data)) {
    throw new Error('JSON file must contain an array of documents')
  }
  
  console.log(`Processing ${data.length} documents...`)
  
  let processed = 0
  let skipped = 0
  let errors = 0
  const errorDetails = []
  
  for (let i = 0; i < data.length; i++) {
    const item = data[i]
    try {
      const result = await processDocument(item, i + 1)
      if (result.skipped) {
        skipped++
        console.log(`Document ${i + 1} skipped: ${result.reason}`)
      } else {
        processed++
        console.log(`Document ${i + 1} processed successfully`)
      }
    } catch (error) {
      console.error(`Error processing document ${i + 1} (${item.filename || 'unnamed'}):`, error.message)
      errors++
      errorDetails.push({
        documentIndex: i + 1,
        filename: item.filename,
        error: error.message
      })
      // Continue processing other documents
    }
  }
  
  console.log(`Processing complete: ${processed} processed, ${skipped} skipped, ${errors} errors`)
  
  return {
    total: data.length,
    processed,
    skipped,
    errors,
    errorDetails: errorDetails.slice(0, 10)
  }
}

async function processDocument(item, documentIndex) {
  if (!item.data) {
    return { skipped: true, reason: 'Missing data field' }
  }
  
  const docData = item.data
  const metadata = docData.documentMetadata || {}
  
  // Check if document already exists
  const { data: existingDoc } = await supabase
    .from('documents')
    .select('id')
    .eq('filename', item.filename || `document_${documentIndex}`)
    .single()
  
  if (existingDoc) {
    return { skipped: true, reason: 'Document already exists' }
  }
  
  // Insert document - keep empty fields as NULL
  const { data: document, error: docError } = await supabase
    .from('documents')
    .insert({
      publication: metadata.publication || null,
      date: metadata.date || null,
      year: metadata.year || null,
      month: metadata.month || null,
      edition: metadata.edition || null,
      issue_number: metadata.issueNumber || null,
      page_numbers: metadata.pageNumbers || null,
      source_file: metadata.sourceFile || null,
      halunder_sentence_count: metadata.halunderSentenceCount || null,
      filename: item.filename || `document_${documentIndex}`
    })
    .select()
    .single()
    
  if (docError) {
    throw new Error(`Failed to insert document: ${docError.message}`)
  }
  
  // Process Helgolandic texts - always process, even if some fields are missing
  const texts = docData.helgolandicTexts || []
  for (let j = 0; j < texts.length; j++) {
    const textData = texts[j]
    try {
      await processText(document.id, textData, j + 1)
    } catch (textError) {
      console.error(`Error processing text ${j + 1} in document ${documentIndex}:`, textError.message)
      // Continue with other texts
    }
  }
  
  // Process standalone German texts
  const germanTexts = docData.standaloneGermanTexts || []
  for (const germanText of germanTexts) {
    try {
      await processStandaloneGermanText(document.id, germanText)
    } catch (germanError) {
      console.error(`Error processing German text in document ${documentIndex}:`, germanError.message)
    }
  }
  
  return { skipped: false }
}

async function processText(documentId, textData, textIndex) {
  const header = textData.headerInformation || {}
  const germanTrans = textData.germanTranslation || {}
  const originalRef = textData.originalSourceReference || {}
  
  // Determine processing status
  let processingStatus = 'needs_ai'
  if (germanTrans.fullText) {
    processingStatus = 'direct_parallel'
  } else if (originalRef.title || originalRef.author || originalRef.publicationInfo) {
    processingStatus = 'needs_manual'
  }
  
  // Insert text - keep ALL fields, use empty string for required field if missing
  const { data: text, error: textError } = await supabase
    .from('texts')
    .insert({
      document_id: documentId,
      title: header.title || null,
      subtitle: header.subtitle || null,
      author: header.author || null,
      translator: header.translator || null,
      editor_corrector: header.editorCorrector || null,
      series_info: header.seriesInfo || null,
      translation_available: header.translationAvailable || null,
      text_quality: header.textQuality || null,
      editorial_introduction: textData.editorialIntroduction || null,
      // Use empty string if completeHelgolandicText is missing (since it's required)
      complete_helgolandic_text: textData.completeHelgolandicText || '',
      german_translation_location: germanTrans.location || null,
      german_translation_text: germanTrans.fullText || null,
      german_translation_source_publication: germanTrans.sourcePublication || null,
      original_source_title: originalRef.title || null,
      original_source_author: originalRef.author || null,
      original_source_publication_info: originalRef.publicationInfo || null,
      processing_status: processingStatus,
      continuation_note: textData.crossReferences?.continuation || null,
      previous_episode: textData.crossReferences?.previousEpisode || null,
      page_break_notes: textData.pageBreakNotes || []
    })
    .select()
    .single()
    
  if (textError) {
    throw new Error(`Failed to insert text: ${textError.message}`)
  }
  
  // Insert translation aids - keep empty fields as NULL
  const aids = textData.uebersetzungshilfen || []
  for (const aid of aids) {
    try {
      await supabase
        .from('translation_aids')
        .insert({
          text_id: text.id,
          number: aid.number || null,
          term: aid.term || null,
          explanation: aid.explanation || null
        })
    } catch (aidError) {
      console.error('Error inserting translation aid:', aidError.message)
    }
  }
  
  // Add to processing queue
  const queueTypeMap = {
    'direct_parallel': 'sentence_alignment',
    'needs_manual': 'manual_translation',
    'needs_ai': 'ai_translation'
  }
  
  const queueType = queueTypeMap[processingStatus]
  if (queueType) {
    try {
      await supabase
        .from('processing_queue')
        .insert({
          text_id: text.id,
          queue_type: queueType,
          priority: 1
        })
    } catch (queueError) {
      console.error('Error adding to queue:', queueError.message)
    }
  }
}

async function processStandaloneGermanText(documentId, germanText) {
  try {
    await supabase
      .from('standalone_german_texts')
      .insert({
        document_id: documentId,
        title: germanText.title || null,
        full_text: germanText.fullText || null,
        helgolandic_source_note: germanText.helgolandicSourceNote || null
      })
  } catch (error) {
    console.error('Error inserting standalone German text:', error.message)
  }
}
