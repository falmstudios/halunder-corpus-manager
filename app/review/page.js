'use client'

import { useState, useEffect } from 'react'

export default function TextReview() {
  const [texts, setTexts] = useState([])
  const [currentText, setCurrentText] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [selectedBucket, setSelectedBucket] = useState('pending')
  const [searchTerm, setSearchTerm] = useState('')
  const [bucketCounts, setBucketCounts] = useState({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  // Smart refresh - only show loading when user-initiated
  const [backgroundRefreshing, setBackgroundRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(Date.now())
  const [isVisible, setIsVisible] = useState(true)
  
  // Bucket management
  const [customBuckets, setCustomBuckets] = useState({})
  const [showNewBucketForm, setShowNewBucketForm] = useState(false)
  const [newBucketName, setNewBucketName] = useState('')
  const [newBucketColor, setNewBucketColor] = useState('#6c757d')
  
  // Drag and drop
  const [draggedText, setDraggedText] = useState(null)
  const [dragOverBucket, setDragOverBucket] = useState(null)
  
  // Sentence processing
  const [showSentenceProcessor, setShowSentenceProcessor] = useState(false)
  const [sentenceProcessing, setSentenceProcessing] = useState(false)
  const [jsonInput, setJsonInput] = useState('')
  const [processResult, setProcessResult] = useState(null)
  
  // Processed sentences display
  const [showProcessedSentences, setShowProcessedSentences] = useState(false)
  const [parallelSentences, setParallelSentences] = useState([])
  const [linguisticFeatures, setLinguisticFeatures] = useState([])
  const [sentencesLoading, setSentencesLoading] = useState(false)
  
  // Track which texts have processed sentences
  const [processedTextIds, setProcessedTextIds] = useState(new Set())
  
  // Editable text fields
  const [textFields, setTextFields] = useState({
    title: '',
    subtitle: '',
    author: '',
    translator: '',
    editor_corrector: '',
    series_info: '',
    text_quality: '',
    complete_helgolandic_text: '',
    german_translation_text: '',
    editorial_introduction: '',
    german_translation_location: '',
    original_source_title: '',
    original_source_author: '',
    original_source_publication_info: ''
  })
  
  // Editable document metadata
  const [documentFields, setDocumentFields] = useState({
    publication: '',
    date: '',
    year: '',
    month: '',
    edition: '',
    issue_number: '',
    page_numbers: '',
    source_file: '',
    halunder_sentence_count: ''
  })
  
  const [translationAids, setTranslationAids] = useState([])

  const defaultBuckets = {
    pending: { label: 'Pending Review', color: '#ffc107' },
    parallel_confirmed: { label: 'Parallel Confirmed', color: '#28a745' },
    german_available: { label: 'German Available', color: '#17a2b8' },
    halunder_only: { label: 'Halunder Only', color: '#fd7e14' },
    deleted: { label: 'Deleted', color: '#dc3545' }
  }

  // Combine default and custom buckets
  const allBuckets = { ...defaultBuckets, ...customBuckets }

  // Track page visibility for smart refreshing
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden)
      if (!document.hidden) {
        // Page became visible, do a background refresh
        backgroundRefreshAllData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // Initial load
  useEffect(() => {
    loadCustomBuckets()
    loadTexts()
    loadProcessedTexts()
    loadBucketCounts()
  }, [selectedBucket])

  // Background refresh every 30 seconds when page is visible (much less aggressive)
  useEffect(() => {
    if (!isVisible) return

    const interval = setInterval(() => {
      backgroundRefreshCriticalData()
    }, 30000) // 30 seconds instead of 10

    return () => clearInterval(interval)
  }, [isVisible])

  useEffect(() => {
    if (currentText) {
      // Set text fields
      const newTextFields = {
        title: currentText.title || '',
        subtitle: currentText.subtitle || '',
        author: currentText.author || '',
        translator: currentText.translator || '',
        editor_corrector: currentText.editor_corrector || '',
        series_info: currentText.series_info || '',
        text_quality: currentText.text_quality || '',
        complete_helgolandic_text: currentText.complete_helgolandic_text || '',
        german_translation_text: currentText.german_translation_text || '',
        editorial_introduction: currentText.editorial_introduction || '',
        german_translation_location: currentText.german_translation_location || '',
        original_source_title: currentText.original_source_title || '',
        original_source_author: currentText.original_source_author || '',
        original_source_publication_info: currentText.original_source_publication_info || ''
      }
      setTextFields(newTextFields)
      
      // Set document fields
      if (currentText.documents) {
        const newDocumentFields = {
          publication: currentText.documents.publication || '',
          date: currentText.documents.date || '',
          year: currentText.documents.year || '',
          month: currentText.documents.month || '',
          edition: currentText.documents.edition || '',
          issue_number: currentText.documents.issue_number || '',
          page_numbers: currentText.documents.page_numbers || '',
          source_file: currentText.documents.source_file || '',
          halunder_sentence_count: currentText.documents.halunder_sentence_count || ''
        }
        setDocumentFields(newDocumentFields)
      }
      
      loadTranslationAids(currentText.id)
      loadProcessedSentences(currentText.id)
      setHasUnsavedChanges(false)
      setShowSentenceProcessor(false)
      setJsonInput('')
      setProcessResult(null)
    }
  }, [currentText])

  // Background refresh functions (no loading states)
  const backgroundRefreshAllData = async () => {
    setBackgroundRefreshing(true)
    try {
      await Promise.all([
        loadCustomBuckets(true),
        loadBucketCounts(true),
        loadTexts(true),
        loadProcessedTexts(true)
      ])
      setLastRefresh(Date.now())
    } catch (err) {
      console.error('Background refresh failed:', err)
    } finally {
      setBackgroundRefreshing(false)
    }
  }

  const backgroundRefreshCriticalData = async () => {
    try {
      await Promise.all([
        loadBucketCounts(true),
        loadProcessedTexts(true)
      ])
      setLastRefresh(Date.now())
    } catch (err) {
      console.error('Background refresh failed:', err)
    }
  }

  // Manual refresh function (shows loading states)
  const manualRefreshAllData = async () => {
    try {
      await Promise.all([
        loadCustomBuckets(),
        loadBucketCounts(),
        loadTexts(),
        loadProcessedTexts()
      ])
      setLastRefresh(Date.now())
    } catch (err) {
      console.error('Failed to refresh all data:', err)
    }
  }

  // Cache-busting fetch function
  const fetchWithCacheBust = (url) => {
    const cacheBuster = `_cb=${Date.now()}`
    const separator = url.includes('?') ? '&' : '?'
    return fetch(`${url}${separator}${cacheBuster}`)
  }

  // Load custom buckets from database
  const loadCustomBuckets = async (background = false) => {
    try {
      const response = await fetchWithCacheBust('/api/custom-buckets')
      const result = await response.json()
      
      if (response.ok) {
        const buckets = {}
        result.buckets.forEach(bucket => {
          buckets[bucket.bucket_key] = {
            label: bucket.label,
            color: bucket.color
          }
        })
        setCustomBuckets(buckets)
      }
    } catch (err) {
      console.error('Failed to load custom buckets:', err)
    }
  }

  // Create new bucket
  const createNewBucket = async () => {
    if (!newBucketName.trim()) {
      setError('Bucket name is required')
      return
    }
    
    try {
      const response = await fetch('/api/custom-buckets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newBucketName.trim(),
          color: newBucketColor
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create bucket')
      }
      
      // Immediate refresh
      await manualRefreshAllData()
      
      setNewBucketName('')
      setNewBucketColor('#6c757d')
      setShowNewBucketForm(false)
      setError('')
      
    } catch (err) {
      setError(err.message)
    }
  }

  // Delete custom bucket
  const deleteCustomBucket = async (bucketKey) => {
    if (defaultBuckets[bucketKey]) {
      setError('Cannot delete default buckets')
      return
    }
    
    if (confirm(`Are you sure you want to delete the "${customBuckets[bucketKey].label}" bucket?`)) {
      try {
        const response = await fetch(`/api/custom-buckets?bucketKey=${bucketKey}`, {
          method: 'DELETE'
        })
        
        if (!response.ok) {
          const result = await response.json()
          throw new Error(result.error || 'Failed to delete bucket')
        }
        
        // Immediate refresh
        await manualRefreshAllData()
        
        // Switch to pending bucket if deleting current bucket
        if (selectedBucket === bucketKey) {
          setSelectedBucket('pending')
        }
        
      } catch (err) {
        setError(err.message)
      }
    }
  }

  // Drag and drop handlers
  const handleDragStart = (e, text) => {
    setDraggedText(text)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, bucketKey) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverBucket(bucketKey)
  }

  const handleDragLeave = () => {
    setDragOverBucket(null)
  }

  const handleDrop = async (e, bucketKey) => {
    e.preventDefault()
    setDragOverBucket(null)
    
    if (!draggedText || bucketKey === selectedBucket) {
      setDraggedText(null)
      return
    }
    
    try {
      await moveTextToBucket(bucketKey, draggedText.id)
      setDraggedText(null)
    } catch (err) {
      setError(`Failed to move text: ${err.message}`)
      setDraggedText(null)
    }
  }

  const loadBucketCounts = async (background = false) => {
    try {
      const response = await fetchWithCacheBust('/api/bucket-counts')
      const result = await response.json()
      
      if (response.ok) {
        setBucketCounts(result.counts)
        if (!background) {
          console.log('Bucket counts updated:', result.counts)
        }
      } else {
        console.error('Failed to load bucket counts:', result.error)
      }
    } catch (err) {
      console.error('Failed to load bucket counts:', err)
    }
  }

  const loadProcessedTexts = async (background = false) => {
    try {
      const response = await fetchWithCacheBust('/api/corpus-texts')
      const result = await response.json()
      
      if (response.ok) {
        const processedIds = new Set(result.texts.map(text => text.id))
        setProcessedTextIds(processedIds)
        if (!background) {
          console.log('Processed texts updated:', processedIds.size, 'texts')
        }
      }
    } catch (err) {
      console.error('Failed to load processed texts:', err)
    }
  }

  const loadTexts = async (background = false) => {
    if (!background) {
      setLoading(true)
    }
    setError('')
    
    try {
      const params = new URLSearchParams({
        bucket: selectedBucket,
        search: searchTerm,
        _cb: Date.now() // Cache buster
      })
      
      const response = await fetch(`/api/review-texts?${params}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to load texts')
      }
      
      setTexts(result.texts)
      
      // Select first text if none selected or current text not in list
      if (!currentText || !result.texts.find(t => t.id === currentText.id)) {
        setCurrentText(result.texts[0] || null)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      if (!background) {
        setLoading(false)
      }
    }
  }

  const loadTranslationAids = async (textId) => {
    try {
      const response = await fetchWithCacheBust(`/api/translation-aids?textId=${textId}`)
      const result = await response.json()
      
      if (response.ok) {
        setTranslationAids(result.aids || [])
      }
    } catch (err) {
      console.error('Failed to load translation aids:', err)
    }
  }

  const loadProcessedSentences = async (textId) => {
    setSentencesLoading(true)
    try {
      const [parallelResponse, featuresResponse] = await Promise.all([
        fetchWithCacheBust(`/api/corpus-data?textId=${textId}&type=parallel`),
        fetchWithCacheBust(`/api/corpus-data?textId=${textId}&type=features`)
      ])

      const [parallelResult, featuresResult] = await Promise.all([
        parallelResponse.json(),
        featuresResponse.json()
      ])

      if (parallelResponse.ok) setParallelSentences(parallelResult.data || [])
      if (featuresResponse.ok) setLinguisticFeatures(featuresResult.data || [])

    } catch (err) {
      console.error('Failed to load processed sentences:', err)
    } finally {
      setSentencesLoading(false)
    }
  }

  const updateTextField = (field, value) => {
    setTextFields(prev => ({ ...prev, [field]: value }))
    setHasUnsavedChanges(true)
  }

  const updateDocumentField = (field, value) => {
    setDocumentFields(prev => ({ ...prev, [field]: value }))
    setHasUnsavedChanges(true)
  }

  const selectText = (text) => {
    setCurrentText(text)
  }

  const moveTextToBucket = async (bucketName, textId = null) => {
    const targetTextId = textId || currentText?.id
    if (!targetTextId) return
    
    if (!textId && hasUnsavedChanges) {
      await saveChanges()
    }
    
    try {
      const response = await fetch('/api/update-text-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: targetTextId,
          status: bucketName
        })
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to move text')
      }

      // Immediate refresh after move
      await manualRefreshAllData()
      
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const saveChanges = async () => {
    if (!currentText) return
    
    setSaving(true)
    setError('')
    
    try {
      console.log('Saving changes...', {
        textId: currentText.id,
        textFields,
        documentFields
      })
      
      const response = await fetch('/api/save-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentText.id,
          ...textFields,
          translation_aids: translationAids,
          document_metadata: documentFields
        })
      })

      const result = await response.json()
      console.log('Save response:', result)

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save changes')
      }

      setHasUnsavedChanges(false)
      console.log('Save successful')
      
    } catch (err) {
      console.error('Save error:', err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const copyJsonPrompt = () => {
    if (!currentText) return

    const translationAidsText = translationAids
      .map(aid => `${aid.number} ${aid.term}: ${aid.explanation}`)
      .join('\n')

    const prompt = `Please analyze this Halunder text and create parallel sentence pairs. Extract all sentence pairs between Halunder and German, identify additional Halunder-only sentences, and note linguistic features like idioms, cultural terms, and etymological information.

Text Information: Title: ${textFields.title || 'N/A'} Author: ${textFields.author || 'N/A'} Translator: ${textFields.translator || 'N/A'} Source: ${documentFields.publication || 'N/A'} (${documentFields.year || 'N/A'})

Halunder Text: ${textFields.complete_helgolandic_text}

German Translation: ${textFields.german_translation_text}

Editorial Introduction: ${textFields.editorial_introduction || 'N/A'}

Translation Aids: ${translationAidsText || 'N/A'}

Instructions:

Align sentences as accurately as possible based on semantic content, not just word order

Include ALL Halunder sentences, even if they don't have direct German parallels

Process ALL sections of the text (titles, editorial notes, translation aids, main text)

Match German sentence punctuation and capitalization to the Halunder sentence exactly (if Halunder starts with capital letter, German should too; if Halunder ends with "!" or ".", German should match)

Replace any German quotation marks („") with regular ASCII quotation marks ("") for JSON compatibility

Correct 100% obvious OCR errors

Mark any untranslatable or culturally specific terms with detailed explanations

Include etymology or cultural context where relevant (especially for unique Halunder developments)

Identify idiomatic expressions and provide both literal and figurative meanings

If persons or places are mentioned and additional information about them exists, add them to the linguistic features

Include pedagogical notes that would help language learners (common confusions, false friends, pronunciation guides)

If multiple translation interpretations exist as indicated by the text, provide separate entries for each alternative

Don't over-elaborate - only write down information you are certain about, don't make up meanings unless specified by the text or editorial content

For linguistic features, write hover-tooltip style explanations in German for a digital translation tool. These should provide quick, precise information about Halunder words, phrases, idioms, names, places and cultural terms. Structure as follows:
* Begin with etymological information (origin, language family, development)
* Explain semantic changes briefly and factually
* Add cultural/ritual contexts when relevant
* Use concrete examples from the text (phrases, expressions)
* Avoid interpretative or judgmental statements
* Keep tone factual and informative
* All explanations in German
* Focus on the word/phrase/idiom itself, not its use in the specific text context
* For compounds: explain the word parts
* For loanwords: name the source language
* For cultural terms: brief factual info without interpretation
* For names and places: geographical/historical classification
* For buildings, restaurants, families: relevant background information
* For idioms and expressions: literal and figurative meaning
* Include single words up to multi-word expressions
* Perfect for quick understanding when hovering with mouse
* Feel free to include comparisons to English (e.g. "Al" ("schon" auf Helgoländisch) - compare with English: "already")

Type categories: idiom, phrase, cultural, etymology, grammar, other

Please provide your response as JSON in this exact format:

\`\`\`json
{
  "sentencePairs": [
    {
      "halunder": "First Halunder sentence",
      "german": "First German sentence"
    },
    {
      "halunder": "Second Halunder sentence", 
      "german": "Second German sentence"
    }
  ],
  "additionalSentences": [
    {
      "language": "halunder",
      "sentence": "Halunder-only sentence",
      "context": "Explanation of why this has no German equivalent"
    }
  ],
  "linguisticFeatures": [
    {
      "halunder_term": "specific word or phrase",
      "german_equivalent": "German translation",
      "explanation": "Detailed German explanation including etymology/cultural context/pedagogical notes following the hover-tooltip style guidelines above",
      "type": "idiom"
    }
  ]
}
\`\`\``

    try {
      navigator.clipboard.writeText(prompt)
      alert('JSON prompt copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
      // Fallback
      const textarea = document.createElement('textarea')
      textarea.value = prompt
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      alert('JSON prompt copied to clipboard!')
    }
  }

  const processSentenceJson = async () => {
    if (!currentText || !jsonInput.trim()) {
      setError('Please provide JSON data')
      return
    }

    setSentenceProcessing(true)
    setError('')
    
    try {
      const response = await fetch('/api/process-sentences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textId: currentText.id,
          jsonData: jsonInput
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process sentences')
      }

      setProcessResult(result)
      setJsonInput('')
      setShowSentenceProcessor(false)
      
      // Immediate refresh after processing
      await Promise.all([
        loadProcessedSentences(currentText.id),
        loadProcessedTexts()
      ])

    } catch (err) {
      setError(err.message)
    } finally {
      setSentenceProcessing(false)
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ 
        width: '300px', 
        backgroundColor: '#f8f9fa', 
        borderRight: '1px solid #ddd',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid #ddd' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: '0' }}>Text Review</h2>
            <button
              onClick={manualRefreshAllData}
              style={{
                padding: '4px 8px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                opacity: backgroundRefreshing ? 0.6 : 1
              }}
              disabled={backgroundRefreshing}
              title="Manual refresh"
            >
              {backgroundRefreshing ? '⟳' : '↻'}
            </button>
          </div>
          <div style={{ marginTop: '10px' }}>
            <a 
              href="/" 
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              ← Back to Upload
            </a>
          </div>
          <div style={{ marginTop: '8px', fontSize: '11px', color: '#666' }}>
            Last refresh: {new Date(lastRefresh).toLocaleTimeString()}
          </div>
        </div>

        {/* Bucket Selection */}
        <div style={{ padding: '15px', borderBottom: '1px solid #ddd' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Buckets</h3>
            <button
              onClick={() => setShowNewBucketForm(!showNewBucketForm)}
              style={{
                padding: '4px 8px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              + New
            </button>
          </div>
          
          {/* New Bucket Form */}
          {showNewBucketForm && (
            <div style={{ 
              padding: '10px', 
              backgroundColor: '#fff', 
              border: '1px solid #ddd', 
              borderRadius: '4px', 
              marginBottom: '10px' 
            }}>
              <input
                type="text"
                placeholder="Bucket name"
                value={newBucketName}
                onChange={(e) => setNewBucketName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '12px',
                  marginBottom: '8px'
                }}
              />
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="color"
                  value={newBucketColor}
                  onChange={(e) => setNewBucketColor(e.target.value)}
                  style={{ width: '30px', height: '24px', border: 'none', borderRadius: '4px' }}
                />
                <input
                  type="text"
                  value={newBucketColor}
                  onChange={(e) => setNewBucketColor(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '4px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '11px'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={createNewBucket}
                  style={{
                    flex: 1,
                    padding: '6px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowNewBucketForm(false)
                    setNewBucketName('')
                    setNewBucketColor('#6c757d')
                  }}
                  style={{
                    flex: 1,
                    padding: '6px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          {/* Bucket List */}
          {Object.entries(allBuckets).map(([key, bucket]) => (
            <div
              key={key}
              onDragOver={(e) => handleDragOver(e, key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, key)}
              style={{
                position: 'relative',
                margin: '4px 0',
                borderRadius: '4px',
                border: dragOverBucket === key ? '2px dashed #007bff' : '2px solid transparent'
              }}
            >
              <button
                onClick={() => setSelectedBucket(key)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: selectedBucket === key ? bucket.color : '#e9ecef',
                  color: selectedBucket === key ? 'white' : '#333',
                  cursor: 'pointer',
                  fontSize: '14px',
                  textAlign: 'left'
                }}
              >
                {bucket.label} ({bucketCounts[key] || 0})
              </button>
              
              {/* Delete button for custom buckets */}
              {customBuckets[key] && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteCustomBucket(key)
                  }}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '16px',
                    height: '16px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    fontSize: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Delete bucket"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ padding: '15px', borderBottom: '1px solid #ddd' }}>
          <input
            type="text"
            placeholder="Search texts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && loadTexts()}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
          <button
            onClick={() => loadTexts()}
            style={{
              width: '100%',
              marginTop: '8px',
              padding: '8px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Search
          </button>
        </div>

        {/* Text List */}
        <div style={{ flex: 1, overflow: 'auto', padding: '10px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
          ) : (
            texts.map(text => (
              <div
                key={text.id}
                draggable
                onDragStart={(e) => handleDragStart(e, text)}
                onClick={() => selectText(text)}
                style={{
                  padding: '10px',
                  margin: '5px 0',
                  backgroundColor: currentText?.id === text.id ? '#e3f2fd' : 
                                 processedTextIds.has(text.id) ? '#e8f5e9' : 'white',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'grab',
                  fontSize: '12px',
                  position: 'relative'
                }}
                onMouseDown={(e) => e.currentTarget.style.cursor = 'grabbing'}
                onMouseUp={(e) => e.currentTarget.style.cursor = 'grab'}
              >
                {/* Green dot indicator for processed texts */}
                {processedTextIds.has(text.id) && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#28a745',
                    borderRadius: '50%'
                  }} />
                )}
                
                {/* Drag handle */}
                <div style={{
                  position: 'absolute',
                  left: '4px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#ccc',
                  fontSize: '10px'
                }}>
                  ⋮⋮
                </div>
                
                <div style={{ marginLeft: '15px' }}>
                  <div style={{ fontWeight: 'bold' }}>
                    {text.title || 'Untitled'}
                  </div>
                  {text.author && (
                    <div style={{ color: '#666' }}>by {text.author}</div>
                  )}
                  <div style={{ color: '#999', fontSize: '11px' }}>
                    {text.documents?.publication} ({text.documents?.year})
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* Top Bar with Actions */}
        {currentText && (
          <div style={{ 
            padding: '15px 20px', 
            backgroundColor: '#fff', 
            borderBottom: '1px solid #ddd',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div>
              <h3 style={{ margin: 0 }}>
                {textFields.title || 'Untitled Text'}
              </h3>
              {textFields.author && (
                <div style={{ color: '#666', fontSize: '14px' }}>by {textFields.author}</div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowProcessedSentences(!showProcessedSentences)}
                disabled={parallelSentences.length === 0}
                style={{
                  padding: '8px 16px',
                  backgroundColor: parallelSentences.length > 0 ? '#6f42c1' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: parallelSentences.length > 0 ? 'pointer' : 'not-allowed',
                  fontSize: '14px'
                }}
              >
                {showProcessedSentences ? 'Hide' : 'Show'} Processed Sentences ({parallelSentences.length})
              </button>
              
              <button
                onClick={copyJsonPrompt}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#fd7e14',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Copy JSON Prompt
              </button>
              <button
                onClick={() => setShowSentenceProcessor(!showSentenceProcessor)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {showSentenceProcessor ? 'Hide' : 'Process'} Sentences
              </button>
              
              <button
                onClick={saveChanges}
                disabled={saving}
                style={{
                  padding: '8px 16px',
                  backgroundColor: saving ? '#ccc' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* Process Result Display */}
        {processResult && (
          <div style={{
            padding: '15px 20px',
            backgroundColor: '#e8f5e8',
            color: '#2e7d32',
            borderBottom: '1px solid #ddd'
          }}>
            <strong>✓ Sentences Processed Successfully!</strong><br />
            Parallel: {processResult.processed.parallelSentences}, 
            Monolingual: {processResult.processed.monolingualSentences}, 
            Features: {processResult.processed.linguisticFeatures}
          </div>
        )}
        
        {error && (
          <div style={{
            padding: '10px 20px',
            backgroundColor: '#ffebee',
            color: '#c62828',
            borderBottom: '1px solid #ddd'
          }}>
            {error}
          </div>
        )}

        {/* Sentence Processor Panel */}
        {showSentenceProcessor && (
          <div style={{
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderBottom: '1px solid #ddd'
          }}>
            <h3 style={{ margin: '0 0 15px 0' }}>Paste JSON Response from LLM</h3>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              style={{
                width: '100%',
                height: '150px',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '14px'
              }}
              placeholder="Paste the JSON response from Claude here..."
            />
            <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
              <button
                onClick={processSentenceJson}
                disabled={sentenceProcessing || !jsonInput.trim()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: sentenceProcessing ? '#ccc' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: sentenceProcessing ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {sentenceProcessing ? 'Processing...' : 'Process JSON'}
              </button>
              <button
                onClick={() => setJsonInput('')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Processed Sentences Display */}
        {showProcessedSentences && currentText && (
          <div style={{
            padding: '20px',
            backgroundColor: '#f0f8ff',
            borderBottom: '1px solid #ddd',
            maxHeight: '400px',
            overflow: 'auto'
          }}>
            <h3 style={{ margin: '0 0 15px 0' }}>
              Processed Sentences for "{textFields.title || 'Untitled'}"
            </h3>
            
            {sentencesLoading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>Loading processed sentences...</div>
            ) : parallelSentences.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                No processed sentences found. Use the "Process Sentences" button above to generate them.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '15px' }}>
                {parallelSentences.map((sentence, index) => (
                  <div key={sentence.id} style={{
                    padding: '15px',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    backgroundColor: 'white'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                      <div>
                        <strong style={{ color: '#007bff' }}>Halunder:</strong>
                        <p style={{ margin: '5px 0', fontFamily: 'Georgia, serif', fontSize: '14px' }}>
                          {sentence.halunder_sentence}
                        </p>
                      </div>
                      <div>
                        <strong style={{ color: '#28a745' }}>German:</strong>
                        <p style={{ margin: '5px 0', fontFamily: 'Georgia, serif', fontSize: '14px' }}>
                          {sentence.german_sentence}
                        </p>
                      </div>
                    </div>
                    <div style={{ marginTop: '10px', fontSize: '12px', color: '#666', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Order: {sentence.sentence_order} | Type: {sentence.source_type}</span>
                      {sentence.confidence_score && <span>Confidence: {sentence.confidence_score}</span>}
                    </div>
                  </div>
                ))}
                
                {linguisticFeatures.length > 0 && (
                  <div style={{ marginTop: '20px' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#6f42c1' }}>Linguistic Features ({linguisticFeatures.length})</h4>
                    <div style={{ display: 'grid', gap: '10px' }}>
                      {linguisticFeatures.map((feature, index) => (
                        <div key={feature.id} style={{
                          padding: '10px',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          backgroundColor: '#fafafa',
                          fontSize: '13px'
                        }}>
                          <div style={{ marginBottom: '5px' }}>
                            <strong style={{ color: '#007bff' }}>{feature.halunder_term}</strong>
                            {feature.german_equivalent && (
                              <span style={{ marginLeft: '10px', color: '#28a745' }}>
                                → {feature.german_equivalent}
                              </span>
                            )}
                          </div>
                          <div style={{ fontStyle: 'italic', color: '#555' }}>
                            {feature.explanation}
                          </div>
                          {feature.feature_type && (
                            <div style={{ marginTop: '5px', fontSize: '11px', color: '#888' }}>
                              Type: {feature.feature_type}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Main editing area */}
        <div style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
          
          {!currentText ? (
            <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
              <h3>Select a text to review</h3>
              <p>Choose a text from the sidebar to start reviewing.</p>
              <p style={{ fontSize: '12px', marginTop: '20px' }}>
                💡 <strong>Tip:</strong> Drag texts between buckets to organize them quickly!<br/>
                Data refreshes automatically every 30 seconds in the background.
              </p>
            </div>
          ) : (
            <>
              {/* Text Metadata */}
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '15px', color: '#333' }}>Text Metadata</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Title:</label>
                    <input
                      type="text"
                      value={textFields.title}
                      onChange={(e) => updateTextField('title', e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Subtitle:</label>
                    <input
                      type="text"
                      value={textFields.subtitle}
                      onChange={(e) => updateTextField('subtitle', e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Author:</label>
                    <input
                      type="text"
                      value={textFields.author}
                      onChange={(e) => updateTextField('author', e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Translator:</label>
                    <input
                      type="text"
                      value={textFields.translator}
                      onChange={(e) => updateTextField('translator', e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Editor/Corrector:</label>
                    <input
                      type="text"
                      value={textFields.editor_corrector}
                      onChange={(e) => updateTextField('editor_corrector', e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Text Quality:</label>
                    <select
                      value={textFields.text_quality}
                      onChange={(e) => updateTextField('text_quality', e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    >
                      <option value="">Select quality...</option>
                      <option value="professional">Professional</option>
                      <option value="colloquial">Colloquial</option>
                      <option value="scholarly">Scholarly</option>
                      <option value="literary">Literary</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Document Metadata */}
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '15px', color: '#333' }}>Document Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Publication:</label>
                    <input
                      type="text"
                      value={documentFields.publication}
                      onChange={(e) => updateDocumentField('publication', e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Year:</label>
                    <input
                      type="number"
                      value={documentFields.year}
                      onChange={(e) => updateDocumentField('year', e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Edition:</label>
                    <input
                      type="text"
                      value={documentFields.edition}
                      onChange={(e) => updateDocumentField('edition', e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Page Numbers:</label>
                    <input
                      type="text"
                      value={documentFields.page_numbers}
                      onChange={(e) => updateDocumentField('page_numbers', e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Main text fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px' }}>
                    Halunder Text:
                  </label>
                  <textarea
                    value={textFields.complete_helgolandic_text}
                    onChange={(e) => updateTextField('complete_helgolandic_text', e.target.value)}
                    style={{
                      width: '100%',
                      height: '400px',
                      padding: '15px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                    placeholder="Enter Halunder text here..."
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px' }}>
                    German Translation:
                  </label>
                  <textarea
                    value={textFields.german_translation_text}
                    onChange={(e) => updateTextField('german_translation_text', e.target.value)}
                    style={{
                      width: '100%',
                      height: '400px',
                      padding: '15px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                    placeholder="Enter German translation here..."
                  />
                </div>
              </div>

              {/* Editorial Introduction */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px' }}>
                  Editorial Introduction:
                </label>
                <textarea
                  value={textFields.editorial_introduction}
                  onChange={(e) => updateTextField('editorial_introduction', e.target.value)}
                  style={{
                    width: '100%',
                    height: '120px',
                    padding: '15px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                  placeholder="Editorial introduction or context..."
                />
              </div>

              {/* Translation Aids */}
              {translationAids.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ marginBottom: '15px', color: '#333' }}>Translation Aids</h3>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {translationAids.map((aid, index) => (
                      <div
                        key={aid.id}
                        style={{
                          padding: '15px',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          backgroundColor: '#f9f9f9'
                        }}
                      >
                        <div style={{ fontWeight: 'bold', color: '#007bff', marginBottom: '5px' }}>
                          {aid.number} {aid.term}
                        </div>
                        <div style={{ color: '#555' }}>
                          {aid.explanation}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Move to Bucket Buttons */}
              <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <h3 style={{ marginBottom: '15px', color: '#333' }}>Move to Bucket</h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {Object.entries(allBuckets).map(([key, bucket]) => {
                    if (key === selectedBucket) return null
                    return (
                      <button
                        key={key}
                        onClick={() => moveTextToBucket(key)}
                        style={{
                          padding: '10px 15px',
                          backgroundColor: bucket.color,
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Move to {bucket.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
