import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { 
      id, 
      // Text fields
      title,
      subtitle,
      author,
      translator,
      editor_corrector,
      series_info,
      text_quality,
      complete_helgolandic_text, 
      german_translation_text, 
      editorial_introduction,
      german_translation_location,
      original_source_title,
      original_source_author,
      original_source_publication_info,
      translation_aids,
      // Document fields
      document_metadata
    } = await request.json()
    
    if (!id) {
      return Response.json({ error: 'Text ID is required' }, { status: 400 })
    }

    // Helper function to convert empty strings to null
    const nullifyEmpty = (value) => {
      if (value === '' || value === 'null' || value === undefined) {
        return null
      }
      return value
    }

    // Update the main text
    const { data: textData, error: textError } = await supabase
      .from('texts')
      .update({
        title: nullifyEmpty(title),
        subtitle: nullifyEmpty(subtitle),
        author: nullifyEmpty(author),
        translator: nullifyEmpty(translator),
        editor_corrector: nullifyEmpty(editor_corrector),
        series_info: nullifyEmpty(series_info),
        text_quality: nullifyEmpty(text_quality),
        complete_helgolandic_text: complete_helgolandic_text || '',
        german_translation_text: nullifyEmpty(german_translation_text),
        editorial_introduction: nullifyEmpty(editorial_introduction),
        german_translation_location: nullifyEmpty(german_translation_location),
        original_source_title: nullifyEmpty(original_source_title),
        original_source_author: nullifyEmpty(original_source_author),
        original_source_publication_info: nullifyEmpty(original_source_publication_info),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('document_id')
      .single()
    
    if (textError) {
      console.error('Text update error:', textError)
      return Response.json({ error: textError.message }, { status: 500 })
    }

    // Update document metadata if provided
    if (document_metadata && textData.document_id) {
      const { error: docError } = await supabase
        .from('documents')
        .update({
          publication: nullifyEmpty(document_metadata.publication),
          date: nullifyEmpty(document_metadata.date),
          year: document_metadata.year ? parseInt(document_metadata.year) : null,
          month: nullifyEmpty(document_metadata.month),
          edition: nullifyEmpty(document_metadata.edition),
          issue_number: document_metadata.issue_number ? parseInt(document_metadata.issue_number) : null,
          page_numbers: nullifyEmpty(document_metadata.page_numbers),
          source_file: nullifyEmpty(document_metadata.source_file),
          halunder_sentence_count: document_metadata.halunder_sentence_count ? parseInt(document_metadata.halunder_sentence_count) : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', textData.document_id)
      
      if (docError) {
        console.error('Document update error:', docError)
        // Don't fail the whole request for document errors
      }
    }

    // Update translation aids
    if (translation_aids && Array.isArray(translation_aids)) {
      // First, delete existing translation aids
      await supabase
        .from('translation_aids')
        .delete()
        .eq('text_id', id)
      
      // Insert new translation aids (only if they have content)
      const validAids = translation_aids.filter(aid => 
        aid.term && aid.term.trim() !== '' && aid.explanation && aid.explanation.trim() !== ''
      )
      
      if (validAids.length > 0) {
        const aidsToInsert = validAids.map(aid => ({
          text_id: id,
          number: nullifyEmpty(aid.number),
          term: aid.term.trim(),
          explanation: aid.explanation.trim()
        }))
        
        const { error: aidsError } = await supabase
          .from('translation_aids')
          .insert(aidsToInsert)
        
        if (aidsError) {
          console.error('Translation aids error:', aidsError)
          // Don't fail the whole request for translation aids errors
        }
      }
    }
    
    return Response.json({ success: true })
    
  } catch (error) {
    console.error('API error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
