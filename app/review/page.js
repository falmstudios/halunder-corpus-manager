'use client'

import { useState, useEffect, useRef } from 'react'

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
  
  // Use refs to maintain state during refreshes
  const currentTextRef = useRef(null)
  const selectedBucketRef = useRef('pending')
  
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

  // Helper function to check if text has translation indicators
  const getTextTags = (text) => {
    const tags = []
    
    // Only show tags for pending bucket
    if (selectedBucket !== 'pending') return tags
    
    // Check if translator field has input
    if (text.translator && text.translator.trim() !== '') {
      tags.push({ label: 'Translator', color: '#007bff' })
    }
    
    // Check if German translation is roughly similar in length to Halunder text
    const halunderLength = text.complete_helgolandic_text?.length || 0
    const germanLength = text.german_translation_text?.length || 0
    
    if (germanLength > 70 && Math.abs(halunderLength - germanLength) <= 300) {
      tags.push({ label: 'Similar Length', color: '#17a2b8' })
    }
    
    // Check for translation keywords
    const searchText = `${text.editorial_introduction || ''} ${text.subtitle || ''}`.toLowerCase()
    if (searchText.includes('übersetzt') || 
        searchText.includes('übersetzung') || 
        searchText.includes('übersetzer') || 
        searchText.includes('oawersat')) {
      tags.push({ label: 'Translation Ref', color: '#6f42c1' })
    }
    
    return tags
  }

  // Update refs when state changes
  useEffect(() => {
    currentTextRef.current = currentText
  }, [currentText])

  useEffect(() => {
    selectedBucketRef.current = selectedBucket
  }, [selectedBucket])

  useEffect(() => {
    loadCustomBuckets()
    loadTexts()
    loadProcessedTexts()
    loadBucketCounts()
  }, [selectedBucket])

  // Set up periodic refresh of bucket counts every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadBucketCounts(true) // true = silent refresh
      loadProcessedTexts(true) // true = silent refresh
    }, 5000)

    return () => clearInterval(interval)
  }, [])

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

  // Load custom buckets from database
  const loadCustomBuckets = async () => {
    try {
      const response = await fetch('/api/custom-buckets')
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
      
      // Refresh both custom buckets and counts
      await Promise.all([
        loadCustomBuckets(),
        loadBucketCounts()
      ])
      
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
        
        // Refresh both custom buckets and counts
        await Promise.all([
          loadCustomBuckets(),
          loadBucketCounts()
        ])
        
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

  const loadBucketCounts = async (silent = false) => {
    try {
      // Add cache busting parameter to ensure fresh data
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/bucket-counts?_t=${timestamp}`)
      const result = await response.json()
      
      if (response.ok) {
        setBucketCounts(result.counts)
        if (!silent) {
          console.log('Bucket counts updated:', result.counts)
        }
      } else {
        console.error('Failed to load bucket counts:', result.error)
      }
    } catch (err) {
      console.error('Failed to load bucket counts:', err)
    }
  }

  const loadProcessedTexts = async (silent = false) => {
    try {
      const response = await fetch('/api/corpus-texts')
      const result = await response.json()
      
      if (response.ok) {
        const processedIds = new Set(result.texts.map(text => text.id))
        setProcessedTextIds(processedIds)
      }
    } catch (err) {
      if (!silent) {
        console.error('Failed to load processed texts:', err)
      }
    }
  }

  const loadTexts = async (preserveSelection = false) => {
    if (!preserveSelection) {
      setLoading(true)
    }
    setError('')
    
    try {
      const params = new URLSearchParams({
        bucket: selectedBucket,
        search: searchTerm
      })
      
      const response = await fetch(`/api/review-texts?${params}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to load texts')
      }
      
      setTexts(result.texts)
      
      // Preserve current text selection if it still exists in the new results
      if (preserveSelection && currentTextRef.current) {
        const stillExists = result.texts.find(t => t.id === currentTextRef.current.id)
        if (stillExists) {
          setCurrentText(stillExists)
        } else {
          setCurrentText(result.texts[0] || null)
        }
      } else if (!preserveSelection) {
        // Only change selection if not preserving
        if (!currentText || !result.texts.find(t => t.id === currentText.id)) {
          setCurrentText(result.texts[0] || null)
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      if (!preserveSelection) {
        setLoading(false)
      }
    }
  }

  const loadTranslationAids = async (textId) => {
    try {
      const response = await fetch(`/api/translation-aids?textId=${textId}`)
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
        fetch(`/api/corpus-data?textId=${textId}&type=parallel`),
        fetch(`/api/corpus-data?textId=${textId}&type=features`)
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

      // Add a small delay to ensure database consistency
      await new Promise(resolve => setTimeout(resolve, 100))

      // Refresh bucket counts first, then texts sequentially (not in parallel)
      await loadBucketCounts()
      await loadTexts(true) // true = preserve selection
      
      console.log('Text moved successfully, counts updated')
      
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

    // Clean quotation marks in the texts before including them
    const cleanHalunderText = textFields.complete_helgolandic_text
      .replace(/[„""«»]/g, '"')
      .replace(/['']/g, "'")
    
    const cleanGermanText = textFields.german_translation_text
      .replace(/[„""«»]/g, '"')
      .replace(/['']/g, "'")
    
    const cleanEditorialIntroduction = (textFields.editorial_introduction || '')
      .replace(/[„""«»]/g, '"')
      .replace(/['']/g, "'")

    const prompt = `**TASK: Create High-Quality Parallel Corpus for Halunder-German Neural Translation Model Training**

**PURPOSE**: Generate aligned sentence pairs suitable for fine-tuning transformer models, with rich linguistic annotations for improved translation quality.

**CRITICAL REQUIREMENTS FOR ML TRAINING DATA**:

1. **EXACT ALIGNMENT**: Each sentence pair must be semantically equivalent
2. **COMPLETE COVERAGE**: Every sentence must be included (missing data reduces model performance)
3. **CONSISTENT FORMATTING**: Maintain identical punctuation and capitalization across pairs
4. **CLEAN DATA**: Fix obvious OCR errors and normalize characters to prevent training noise
5. **VALID JSON**: Ensure all output is valid JSON with proper escaping

**CHARACTER NORMALIZATION RULES**:
- Replace ALL non-ASCII quotation marks with standard ASCII double quotes ("):
  - German quotes: „" → ""
  - French quotes: « » → ""
  - Angled quotes: ‹ › → ""
  - Single quotes: ‚' → '
  - Other variants: " " ' ' → "" or ''
- Replace special dashes:
  - Em dash (—) → --
  - En dash (–) → -
- Replace special spaces (non-breaking, etc.) with regular spaces
- Escape special JSON characters:
  - Backslash \ → \\
  - Newline → \n
  - Tab → \t
  - Already normalized quotes don't need escaping
- Fix obvious OCR errors:
  - Common substitutions: 1→l, 0→o, rn→m
  - Broken umlauts: a"→ä, o"→ö, u"→ü
  - Broken ß: B→ß (in context)

**ALIGNMENT STRATEGY**:
1. Identify sentence boundaries using: . ! ? ... ;
2. Match sentences by semantic content, not position
3. Include ALL Halunder sentences (even without German parallels)
4. Process ALL text sections: titles, editorial notes, translation aids, main text
5. For multiple valid translations, create separate sentence pair entries
6. If full sentences are included in editorial notes or elsewhere also include them in the parallel corpus "sentencePairs"
7. Make sure to read the editorial notes and translation aids in order to understand the context better and try to understand what the halunder sentences mean. Halunder is a north-frisian language you don't know.

**TEXT METADATA**:
Title: ${textFields.title || 'N/A'}
Author: ${textFields.author || 'N/A'}
Translator: ${textFields.translator || 'N/A'}
Source: ${documentFields.publication || 'N/A'} (${documentFields.year || 'N/A'})

**INPUT TEXTS**:

[HALUNDER TEXT START]
${cleanHalunderText}
[HALUNDER TEXT END]

[GERMAN TEXT START]
${cleanGermanText}
[GERMAN TEXT END]

[EDITORIAL INTRODUCTION START]
${cleanEditorialIntroduction || 'N/A'}
[EDITORIAL INTRODUCTION END]

[TRANSLATION AIDS START]
${translationAidsText || 'N/A'}
[TRANSLATION AIDS END]

*LINGUISTIC ANNOTATION GUIDELINES (For hover-tooltip style digital tool)*:
Extract linguistic annotations ONLY for particularly notable features (maximum 40 per text):

Unique cultural terms specific to Helgoland (customs, places, institutions)
Idioms and expressions with non-literal meanings explained
Words with interesting etymologies worth highlighting
Grammatical features unique to Halunder that would help a translator
Terms whose usage or meaning is explained in the editorial introduction or translation aids
Words requiring cultural context to understand properly
Names of relevant people and their background
Names of places that were present in the past (e.g. giving context on a certain restaurant where you have the name)

For each selected term, idiom or phrase (single word to sentence parts), provide concise German explanations covering relevant aspects:

Etymology: Origin and development (if notable)
Literal vs. figurative meaning (for idioms)
Cultural/historical context (where needed)
Grammatical peculiarities (if applicable)
Comparisons to English where helpful (e.g., halunder "Al" = german "schon", but comparable to English "already")

ALLOWED TYPES (use ONLY these):

"idiom": Idiomatic expressions with non-literal meanings
"phrase": Multi-word expressions or collocations
"cultural": Culture-specific terms, customs, places, institutions
"etymology": Word origins and historical development
"grammar": Grammatical features unique to Halunder
"other": Any linguistic feature not fitting above categories

Prioritize terms that would genuinely help someone understand the cultural and linguistic uniqueness of Halunder, not common Germanic cognates or straightforward vocabulary differences.

For each selected term, provide concise German explanations covering relevant aspects:

Etymology: Origin and development (if notable)
Literal vs. figurative meaning (for idioms)
Cultural/historical context (where needed)
Grammatical peculiarities (if applicable)
Comparisons to English where helpful (e.g., "Al" = "schon", cf. English "already")

ALLOWED TYPES (use ONLY these):

"idiom": Idiomatic expressions with non-literal meanings
"phrase": Multi-word expressions or collocations
"cultural": Culture-specific terms, customs, places, institutions
"etymology": Word origins and historical development
"grammar": Grammatical features unique to Halunder
"other": Any linguistic feature not fitting above categories

Prioritize terms that would genuinely help someone understand the cultural and linguistic uniqueness of Halunder, not common Germanic cognates or straightforward vocabulary differences.

**JSON SAFETY RULES**:
- Use ONLY straight double quotes (") for JSON strings
- Escape any quotes WITHIN strings as \"
- Replace newlines in text with \n
- Ensure all strings are properly closed
- No trailing commas in arrays or objects
- Validate special characters are escaped

**JSON OUTPUT FORMAT** (straight quotes only, properly escaped):
{
  "sentencePairs": [
    {
      "halunder": "Complete Halunder sentence with exact punctuation",
      "german": "Semantically equivalent German sentence with matching punctuation"
    }
  ],
  "additionalSentences": [
    {
      "language": "halunder",
      "sentence": "Halunder sentence without German parallel",
      "context": "Explanation of why this has no German equivalent"
    }
  ],
  "linguisticFeatures": [
    {
      "halunder_term": "word/phrase/expression",
      "german_equivalent": "German translation or N/A",
      "explanation": "Etymologie: [origin]. Bedeutung: [meaning]. Kultureller Kontext: [if applicable]. Vergleich: [if applicable]",
      "type": "idiom|phrase|cultural|etymology|grammar|other",
    }
  ]
}

**SPECIAL INSTRUCTIONS FOR MULTIPLE TRANSLATIONS**:
- If a Halunder sentence has multiple valid German translations, include ALL of them as separate sentence pairs
- Simply list them one after another in the sentencePairs array
- Example: If "Halunder sentence X" can be translated as both "German A" and "German B", include both:
  { "halunder": "X", "german": "A" },
  { "halunder": "X", "german": "B" }

**PROCESSING CHECKLIST**:
□ All quotation marks normalized to ASCII
□ Special characters properly escaped for JSON
□ All sentences from first to last word processed
□ Punctuation and capitalization matched exactly
□ OCR errors corrected
□ Multi-line sentences properly joined
□ All text sections included
□ Linguistic features extracted with tooltip-friendly explanations
□ Alternative translations included as regular sentence pairs
□ JSON validity verified (no syntax errors)
□ Character normalization documented
□ Only allowed types used (idiom, phrase, cultural, etymology, grammar, other)

**JSON VALIDATION CHECK**:
Before finalizing, ensure:
- All strings use straight quotes (")
- No unescaped quotes within strings
- No unescaped newlines (use \n)
- No trailing commas
- All brackets/braces properly paired
- Numbers are not quoted
- Type field contains ONLY: idiom, phrase, cultural, etymology, grammar, other

**REMEMBER**: 
- This data will train a neural model - consistency is critical!
- Invalid JSON will break the training pipeline
- Character normalization ensures consistent model input
- Use ONLY the six allowed type categories.
- Multiple translations go in sentencePairs as separate entries, not in a special section`

    try {
      navigator.clipboard.writeText(prompt)
      alert('Clean prompt copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
      const textarea = document.createElement('textarea')
      textarea.value = prompt
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      alert('Clean prompt copied to clipboard!')
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
      
      // Reload processed sentences and update processed texts list
      await Promise.all([
        loadProcessedSentences(currentText.id),
        loadProcessedTexts(),
        loadBucketCounts()
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
          <h2 style={{ margin: '0 0 10px 0' }}>Text Review</h2>
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
            onClick={loadTexts}
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
            texts.map(text => {
              const tags = getTextTags(text)
              
              return (
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
                    
                    {/* Tags for pending bucket */}
                    {tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                        {tags.map((tag, index) => (
                          <span
                            key={index}
                            style={{
                              padding: '2px 6px',
                              backgroundColor: tag.color,
                              color: 'white',
                              borderRadius: '3px',
                              fontSize: '10px',
                              fontWeight: 'bold'
                            }}
                          >
                            {tag.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
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
                Create custom buckets with the "+ New" button.
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
