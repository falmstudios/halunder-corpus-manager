import { createClient } from '@supabase/supabase-js'

// You'll need to add your Supabase credentials here
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
    
    // Process the JSON data (this is where we'll add the database insertion logic)
    await processJsonData(jsonData)
    
    return Response.json({ message: 'File uploaded successfully' })
    
  } catch (error) {
    console.error('Upload error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

async function processJsonData(data) {
  // For now, just validate that it's an array
  if (!Array.isArray(data)) {
    throw new Error('JSON file must contain an array of documents')
  }
  
  // We'll add the database insertion logic here in the next step
  console.log(`Processing ${data.length} documents...`)
  
  for (const item of data) {
    await processDocument(item)
  }
}

async function processDocument(item) {
  // Extract document metadata
  const docData = item.data
  const metadata = docData.documentMetadata
  
  // Insert document
  const { data: document, error: docError } = await supabase
    .from('documents')
    .insert({
      publication: metadata.publication,
      date: metadata.date,
      year: metadata.year,
      month: metadata.month,
      edition: metadata.edition,
      issue_number: metadata.issueNumber,
      page_numbers: metadata.pageNumbers,
      source_file: metadata.sourceFile,
      halunder_sentence_count: metadata.halunderSentenceCount,
      filename: item.filename
    })
    .select()
    .single()
    
  if (docError) {
    throw new Error(`Failed to insert document: ${docError.message}`)
  }
  
  // Process Helgolandic texts
  for (const textData of docData.helgolandicTexts || []) {
    await processText(document.id, textData)
  }
  
  // Process standalone German texts
  for (const germanText of docData.standaloneGermanTexts || []) {
    await processStandaloneGermanText(document.id, germanText)
  }
}

async function processText(documentId, textData) {
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
  
  // Insert text
  const { data: text, error: textError } = await supabase
    .from('texts')
    .insert({
      document_id: documentId,
      title: header.title,
      subtitle: header.subtitle,
      author: header.author,
      translator: header.translator,
      editor_corrector: header.editorCorrector,
      series_info: header.seriesInfo,
      translation_available: header.translationAvailable,
      text_quality: header.textQuality,
      editorial_introduction: textData.editorialIntroduction,
      complete_helgolandic_text: textData.completeHelgolandicText,
      german_translation_location: germanTrans.location,
      german_translation_text: germanTrans.fullText,
      german_translation_source_publication: germanTrans.sourcePublication,
      original_source_title: originalRef.title,
      original_source_author: originalRef.author,
      original_source_publication_info: originalRef.publicationInfo,
      processing_status: processingStatus,
      continuation_note: textData.crossReferences?.continuation,
      previous_episode: textData.crossReferences?.previousEpisode,
      page_break_notes: textData.pageBreakNotes || []
    })
    .select()
    .single()
    
  if (textError) {
    throw new Error(`Failed to insert text: ${textError.message}`)
  }
  
  // Insert translation aids
  for (const aid of textData.uebersetzungshilfen || []) {
    await supabase
      .from('translation_aids')
      .insert({
        text_id: text.id,
        number: aid.number,
        term: aid.term,
        explanation: aid.explanation
      })
  }
  
  // Add to processing queue
  const queueTypeMap = {
    'direct_parallel': 'sentence_alignment',
    'needs_manual': 'manual_translation',
    'needs_ai': 'ai_translation'
  }
  
  const queueType = queueTypeMap[processingStatus]
  if (queueType) {
    await supabase
      .from('processing_queue')
      .insert({
        text_id: text.id,
        queue_type: queueType,
        priority: 1
      })
  }
}

async function processStandaloneGermanText(documentId, germanText) {
  await supabase
    .from('standalone_german_texts')
    .insert({
      document_id: documentId,
      title: germanText.title,
      full_text: germanText.fullText,
      helgolandic_source_note: germanText.helgolandicSourceNote
    })
}
