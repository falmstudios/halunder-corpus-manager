import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { textId, jsonData } = await request.json()
    
    if (!textId) {
      return Response.json({ error: 'Text ID is required' }, { status: 400 })
    }

    if (!jsonData) {
      return Response.json({ error: 'JSON data is required' }, { status: 400 })
    }

    let parsedData
    try {
      parsedData = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      return Response.json({ error: 'Invalid JSON format: ' + parseError.message }, { status: 400 })
    }

    console.log('Processing data for textId:', textId)
    console.log('Parsed data keys:', Object.keys(parsedData))

    // Test database connection first
    const { data: testQuery, error: testError } = await supabase
      .from('parallel_corpus')
      .select('count')
      .limit(1)

    if (testError) {
      console.error('Database connection test failed:', testError)
      return Response.json({ error: 'Database connection failed: ' + testError.message }, { status: 500 })
    }

    const processed = {
      parallelSentences: 0,
      monolingualSentences: 0,
      linguisticFeatures: 0
    }

    // Clear existing data for this text first
    await clearExistingData(textId)

    // Process parallel sentences
    if (parsedData.sentencePairs && Array.isArray(parsedData.sentencePairs)) {
      console.log('Processing', parsedData.sentencePairs.length, 'sentence pairs')
      
      const parallelData = parsedData.sentencePairs
        .filter(pair => pair.halunder && pair.german) // Only include pairs with both sentences
        .map((pair, index) => ({
          source_text_id: textId,
          halunder_sentence: pair.halunder.trim(),
          german_sentence: pair.german.trim(),
          sentence_order: index + 1,
          source_type: 'manual'
        }))

      if (parallelData.length > 0) {
        console.log('Inserting', parallelData.length, 'parallel sentences')
        console.log('Sample data:', JSON.stringify(parallelData[0], null, 2))
        
        const { data: insertedData, error: parallelError } = await supabase
          .from('parallel_corpus')
          .insert(parallelData)
          .select()

        if (parallelError) {
          console.error('Parallel corpus error details:', {
            message: parallelError.message,
            details: parallelError.details,
            hint: parallelError.hint,
            code: parallelError.code
          })
          throw new Error(`Failed to save parallel sentences: ${parallelError.message || parallelError.code || 'Unknown error'}`)
        }

        processed.parallelSentences = parallelData.length
        console.log('Successfully inserted', insertedData?.length || parallelData.length, 'parallel sentences')
      }
    }

    // Process monolingual sentences (additional sentences)
    if (parsedData.additionalSentences && Array.isArray(parsedData.additionalSentences)) {
      console.log('Processing', parsedData.additionalSentences.length, 'additional sentences')
      
      const monolingualData = parsedData.additionalSentences
        .filter(sentence => 
          sentence.language?.toLowerCase() === 'halunder' && 
          sentence.sentence && 
          sentence.sentence.trim()
        )
        .map((sentence, index) => ({
          source_text_id: textId,
          halunder_sentence: sentence.sentence.trim(),
          context_note: sentence.context || null,
          sentence_order: index + 1,
          translation_status: 'pending'
        }))

      if (monolingualData.length > 0) {
        console.log('Inserting', monolingualData.length, 'monolingual sentences')
        
        const { error: monoError } = await supabase
          .from('monolingual_corpus')
          .insert(monolingualData)

        if (monoError) {
          console.error('Monolingual corpus error:', monoError)
          throw new Error(`Failed to save monolingual sentences: ${monoError.message || monoError.code || 'Unknown error'}`)
        }

        processed.monolingualSentences = monolingualData.length
        console.log('Successfully inserted monolingual sentences')
      }
    }

    // Process linguistic features
    if (parsedData.linguisticFeatures && Array.isArray(parsedData.linguisticFeatures)) {
      console.log('Processing', parsedData.linguisticFeatures.length, 'linguistic features')
      
      const featuresData = parsedData.linguisticFeatures
        .filter(feature => feature.halunder_term && feature.explanation) // Only include features with required fields
        .map(feature => ({
          source_text_id: textId,
          halunder_term: feature.halunder_term.trim(),
          german_equivalent: feature.german_equivalent ? feature.german_equivalent.trim() : null,
          explanation: feature.explanation.trim(),
          feature_type: feature.type ? feature.type.toLowerCase() : 'other'
        }))

      if (featuresData.length > 0) {
        console.log('Inserting', featuresData.length, 'linguistic features')
        
        const { error: featuresError } = await supabase
          .from('linguistic_features')
          .insert(featuresData)

        if (featuresError) {
          console.error('Linguistic features error:', featuresError)
          throw new Error(`Failed to save linguistic features: ${featuresError.message || featuresError.code || 'Unknown error'}`)
        }

        processed.linguisticFeatures = featuresData.length
        console.log('Successfully inserted linguistic features')

        // Update vocabulary tracker
        for (const feature of featuresData) {
          await updateVocabularyTracker(feature.halunder_term, feature.german_equivalent)
        }
      }
    }

    console.log('Processing completed successfully:', processed)

    return Response.json({ 
      success: true, 
      processed,
      message: 'Sentence data processed successfully'
    })

  } catch (error) {
    console.error('Process sentences error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

async function clearExistingData(textId) {
  try {
    console.log('Clearing existing data for textId:', textId)
    
    // Delete existing records for this text
    const { error: parallelDeleteError } = await supabase
      .from('parallel_corpus')
      .delete()
      .eq('source_text_id', textId)
    
    if (parallelDeleteError) {
      console.log('Parallel delete error (may be normal if no existing data):', parallelDeleteError.message)
    }

    const { error: monoDeleteError } = await supabase
      .from('monolingual_corpus')
      .delete()
      .eq('source_text_id', textId)
    
    if (monoDeleteError) {
      console.log('Monolingual delete error (may be normal if no existing data):', monoDeleteError.message)
    }

    const { error: featuresDeleteError } = await supabase
      .from('linguistic_features')
      .delete()
      .eq('source_text_id', textId)
    
    if (featuresDeleteError) {
      console.log('Features delete error (may be normal if no existing data):', featuresDeleteError.message)
    }
    
    console.log('Existing data cleared')
  } catch (error) {
    console.error('Error clearing existing data:', error)
    // Don't fail the operation for cleanup errors
  }
}

async function updateVocabularyTracker(halunderWord, germanTranslation) {
  try {
    if (!halunderWord || !halunderWord.trim()) return
    
    const word = halunderWord.trim().toLowerCase()
    
    // Check if word exists
    const { data: existing, error: selectError } = await supabase
      .from('vocabulary_tracker')
      .select('*')
      .eq('halunder_word', word)
      .single()

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Vocabulary select error:', selectError)
      return
    }

    if (existing) {
      // Update frequency and add German translation if new
      const translations = existing.german_translations || []
      if (germanTranslation && !translations.includes(germanTranslation)) {
        translations.push(germanTranslation)
      }

      const { error: updateError } = await supabase
        .from('vocabulary_tracker')
        .update({
          frequency_count: existing.frequency_count + 1,
          german_translations: translations,
          last_seen_at: new Date().toISOString()
        })
        .eq('halunder_word', word)

      if (updateError) {
        console.error('Vocabulary update error:', updateError)
      }
    } else {
      // Create new entry
      const { error: insertError } = await supabase
        .from('vocabulary_tracker')
        .insert({
          halunder_word: word,
          german_translations: germanTranslation ? [germanTranslation] : [],
          frequency_count: 1
        })

      if (insertError) {
        console.error('Vocabulary insert error:', insertError)
      }
    }
  } catch (error) {
    console.error('Vocabulary tracker error:', error)
    // Don't fail the main operation for vocabulary tracking errors
  }
}
