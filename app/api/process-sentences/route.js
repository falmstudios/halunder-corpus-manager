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
      return Response.json({ error: 'Invalid JSON format' }, { status: 400 })
    }

    const processed = {
      parallelSentences: 0,
      monolingualSentences: 0,
      linguisticFeatures: 0
    }

    // Process parallel sentences
    if (parsedData.sentencePairs && Array.isArray(parsedData.sentencePairs)) {
      const parallelData = parsedData.sentencePairs.map((pair, index) => ({
        source_text_id: textId,
        halunder_sentence: pair.halunder,
        german_sentence: pair.german,
        sentence_order: index + 1,
        source_type: 'manual'
      }))

      if (parallelData.length > 0) {
        const { error: parallelError } = await supabase
          .from('parallel_corpus')
          .upsert(parallelData, { 
            onConflict: 'source_text_id,sentence_order',
            ignoreDuplicates: false 
          })

        if (parallelError) {
          console.error('Parallel corpus error:', parallelError)
          throw new Error(`Failed to save parallel sentences: ${parallelError.message}`)
        }

        processed.parallelSentences = parallelData.length
      }
    }

    // Process monolingual sentences (additional sentences)
    if (parsedData.additionalSentences && Array.isArray(parsedData.additionalSentences)) {
      const monolingualData = parsedData.additionalSentences
        .filter(sentence => sentence.language?.toLowerCase() === 'halunder')
        .map((sentence, index) => ({
          source_text_id: textId,
          halunder_sentence: sentence.sentence,
          context_note: sentence.context || null,
          sentence_order: index + 1,
          translation_status: 'pending'
        }))

      if (monolingualData.length > 0) {
        const { error: monoError } = await supabase
          .from('monolingual_corpus')
          .upsert(monolingualData, { 
            onConflict: 'source_text_id,sentence_order',
            ignoreDuplicates: false 
          })

        if (monoError) {
          console.error('Monolingual corpus error:', monoError)
          throw new Error(`Failed to save monolingual sentences: ${monoError.message}`)
        }

        processed.monolingualSentences = monolingualData.length
      }
    }

    // Process linguistic features
    if (parsedData.linguisticFeatures && Array.isArray(parsedData.linguisticFeatures)) {
      const featuresData = parsedData.linguisticFeatures.map(feature => ({
        source_text_id: textId,
        halunder_term: feature.halunder_term,
        german_equivalent: feature.german_equivalent || null,
        explanation: feature.explanation,
        feature_type: feature.type ? feature.type.toLowerCase() : 'other'
      }))

      if (featuresData.length > 0) {
        const { error: featuresError } = await supabase
          .from('linguistic_features')
          .upsert(featuresData, { 
            onConflict: 'source_text_id,halunder_term',
            ignoreDuplicates: false 
          })

        if (featuresError) {
          console.error('Linguistic features error:', featuresError)
          throw new Error(`Failed to save linguistic features: ${featuresError.message}`)
        }

        processed.linguisticFeatures = featuresData.length

        // Update vocabulary tracker
        for (const feature of featuresData) {
          await updateVocabularyTracker(feature.halunder_term, feature.german_equivalent)
        }
      }
    }

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

async function updateVocabularyTracker(halunderWord, germanTranslation) {
  try {
    // Check if word exists
    const { data: existing } = await supabase
      .from('vocabulary_tracker')
      .select('*')
      .eq('halunder_word', halunderWord)
      .single()

    if (existing) {
      // Update frequency and add German translation if new
      const translations = existing.german_translations || []
      if (germanTranslation && !translations.includes(germanTranslation)) {
        translations.push(germanTranslation)
      }

      await supabase
        .from('vocabulary_tracker')
        .update({
          frequency_count: existing.frequency_count + 1,
          german_translations: translations,
          last_seen_at: new Date().toISOString()
        })
        .eq('halunder_word', halunderWord)
    } else {
      // Create new entry
      await supabase
        .from('vocabulary_tracker')
        .insert({
          halunder_word: halunderWord,
          german_translations: germanTranslation ? [germanTranslation] : [],
          frequency_count: 1
        })
    }
  } catch (error) {
    console.error('Vocabulary tracker error:', error)
    // Don't fail the main operation for vocabulary tracking errors
  }
}
