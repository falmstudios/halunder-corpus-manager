'use client'

import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'

export default function TextReview() {
  const [texts, setTexts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedText, setSelectedText] = useState(null)
  const [selectedBucket, setSelectedBucket] = useState('pending')
  const [searchTerm, setSearchTerm] = useState('')
  const [showSentenceProcessor, setShowSentenceProcessor] = useState(false)
  const [sentenceJson, setSentenceJson] = useState('')
  const [processingSentences, setProcessingSentences] = useState(false)
  const [customBuckets, setCustomBuckets] = useState([])
  const [showAddBucket, setShowAddBucket] = useState(false)
  const [newBucketName, setNewBucketName] = useState('')
  const [newBucketKey, setNewBucketKey] = useState('')
  const [showProcessedSentences, setShowProcessedSentences] = useState(false)
  const [parallelSentences, setParallelSentences] = useState([])
  const [saving, setSaving] = useState(false)

  const defaultBuckets = [
    { key: 'pending', name: '📋 Pending Review' },
    { key: 'parallel_ready', name: '✅ Parallel Ready' },
    { key: 'needs_german', name: '📝 Needs German' },
    { key: 'ai_translation', name: '🤖 For AI Translation' },
    { key: 'dictionary', name: '📚 Dictionary/Reference' },
    { key: 'skip', name: '⏭️ Skip/Ignore' }
  ]

  useEffect(() => {
    loadTexts()
    loadCustomBuckets()
  }, [selectedBucket, searchTerm])

  useEffect(() => {
    if (selectedText) {
      loadParallelSentences(selectedText.id)
    } else {
      setParallelSentences([])
    }
  }, [selectedText])

  const loadParallelSentences = async (textId) => {
    try {
      const response = await fetch(`/api/corpus-data?textId=${textId}&type=parallel`)
      const data = await response.json()
      
      if (response.ok) {
        setParallelSentences(data.data || [])
      }
    } catch (error) {
      console.error('Failed to load parallel sentences:', error)
    }
  }

  const loadCustomBuckets = async () => {
    try {
      const response = await fetch('/api/custom-buckets')
      const data = await response.json()
      
      if (response.ok) {
        setCustomBuckets(data.buckets || [])
      }
    } catch (error) {
      console.error('Failed to load custom buckets:', error)
    }
  }

  const loadTexts = async () => {
    try {
      const params = new URLSearchParams({ 
        bucket: selectedBucket,
        ...(searchTerm && { search: searchTerm })
      })
      const response = await fetch(`/api/review-texts?${params}`)
      const data = await response.json()
      setTexts(data.texts || [])
    } catch (error) {
      console.error('Failed to load texts:', error)
    } finally {
      setLoading(false)
    }
  }

  const allBuckets = [...defaultBuckets, ...customBuckets.map(b => ({ key: b.bucket_key, name: b.name }))]

  const updateTextBucket = async (textId, newBucket) => {
    try {
      const response = await fetch('/api/update-text-bucket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textId, bucket: newBucket })
      })

      if (!response.ok) throw new Error('Failed to update bucket')

      await loadTexts()
      if (selectedText?.id === textId) {
        setSelectedText(null)
      }
    } catch (error) {
      console.error('Failed to update text bucket:', error)
      alert('Failed to update bucket')
    }
  }

  const saveChanges = async () => {
    if (!selectedText) return
    
    setSaving(true)
    try {
      const response = await fetch('/api/save-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedText.id,
          title: selectedText.title,
          subtitle: selectedText.subtitle,
          author: selectedText.author,
          translator: selectedText.translator,
          editor_corrector: selectedText.editor_corrector,
          series_info: selectedText.series_info,
          text_quality: selectedText.text_quality,
          complete_helgolandic_text: selectedText.complete_helgolandic_text,
          german_translation_text: selectedText.german_translation_text,
          editorial_introduction: selectedText.editorial_introduction,
          german_translation_location: selectedText.german_translation_location,
          original_source_title: selectedText.original_source_title,
          original_source_author: selectedText.original_source_author,
          original_source_publication_info: selectedText.original_source_publication_info,
          document_metadata: selectedText.documents
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save changes')
      }

      alert('Changes saved successfully!')
      await loadTexts()
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save changes: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const generateSentencePrompt = () => {
    if (!selectedText) return ''

    const prompt = `Please analyze this Halunder text and create a parallel corpus. Extract all sentences and their German translations.

Title: ${selectedText.title || 'Untitled'}
Author: ${selectedText.author || 'Unknown'}

HALUNDER TEXT:
${selectedText.complete_helgolandic_text || ''}

${selectedText.german_translation_text ? `GERMAN TRANSLATION:
${selectedText.german_translation_text}` : 'No German translation provided.'}

Please return a JSON object with this structure:
{
  "sentencePairs": [
    {
      "halunder": "Halunder sentence here",
      "german": "German translation here"
    }
  ],
  "additionalSentences": [
    {
      "language": "halunder",
      "sentence": "Sentences without direct translation",
      "context": "Optional context note"
    }
  ],
  "linguisticFeatures": [
    {
      "halunder_term": "term",
      "german_equivalent": "translation",
      "explanation": "linguistic explanation",
      "feature_type": "etymology/idiom/grammar/cultural"
    }
  ]
}

Match sentences carefully. If there's no direct German translation for a Halunder sentence, include it in additionalSentences.`

    return prompt
  }

  const copyJsonPrompt = () => {
    const prompt = generateSentencePrompt()
    navigator.clipboard.writeText(prompt)
    alert('Prompt copied to clipboard!')
  }

  const processSentences = async () => {
    if (!sentenceJson.trim() || !selectedText) return

    setProcessingSentences(true)
    try {
      const response = await fetch('/api/process-sentences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textId: selectedText.id,
          jsonData: sentenceJson
        })
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to process sentences')
      }

      alert(`Processed successfully!\n${result.parallelSentences} parallel sentences\n${result.monolingualSentences} monolingual sentences\n${result.linguisticFeatures} linguistic features`)
      
      setSentenceJson('')
      setShowSentenceProcessor(false)
      await loadParallelSentences(selectedText.id)
    } catch (error) {
      console.error('Processing error:', error)
      alert('Failed to process sentences: ' + error.message)
    } finally {
      setProcessingSentences(false)
    }
  }

  const addCustomBucket = async () => {
    if (!newBucketName.trim() || !newBucketKey.trim()) return

    try {
      const response = await fetch('/api/custom-buckets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newBucketName,
          bucket_key: newBucketKey.toLowerCase().replace(/\s+/g, '_')
        })
      })

      if (!response.ok) throw new Error('Failed to add bucket')

      await loadCustomBuckets()
      setNewBucketName('')
      setNewBucketKey('')
      setShowAddBucket(false)
    } catch (error) {
      console.error('Failed to add custom bucket:', error)
      alert('Failed to add bucket')
    }
  }

  const getColorForBucket = (bucketKey) => {
    const colors = {
      'pending': '#6c757d',
      'parallel_ready': '#28a745',
      'needs_german': '#ffc107',
      'ai_translation': '#17a2b8',
      'dictionary': '#6f42c1',
      'skip': '#dc3545'
    }
    return colors[bucketKey] || '#007bff'
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-content">
          <div style={{ marginBottom: '20px' }}>
            <h1>Text Review</h1>
            
            {/* Search Bar */}
            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="Search texts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '16px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            {/* Bucket Filter */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                {allBuckets.map(bucket => (
                  <button
                    key={bucket.key}
                    onClick={() => setSelectedBucket(bucket.key)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: selectedBucket === bucket.key ? getColorForBucket(bucket.key) : '#f8f9fa',
                      color: selectedBucket === bucket.key ? 'white' : '#333',
                      border: `1px solid ${selectedBucket === bucket.key ? getColorForBucket(bucket.key) : '#dee2e6'}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    {bucket.name}
                  </button>
                ))}
                <button
                  onClick={() => setShowAddBucket(!showAddBucket)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  + Add Bucket
                </button>
              </div>

              {showAddBucket && (
                <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                  <input
                    type="text"
                    placeholder="Bucket Name (e.g., '📖 Historical')"
                    value={newBucketName}
                    onChange={(e) => setNewBucketName(e.target.value)}
                    style={{
                      marginRight: '10px',
                      padding: '5px 10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Bucket Key (e.g., 'historical')"
                    value={newBucketKey}
                    onChange={(e) => setNewBucketKey(e.target.value)}
                    style={{
                      marginRight: '10px',
                      padding: '5px 10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                  <button
                    onClick={addCustomBucket}
                    style={{
                      padding: '5px 15px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowAddBucket(false)
                      setNewBucketName('')
                      setNewBucketKey('')
                    }}
                    style={{
                      marginLeft: '5px',
                      padding: '5px 15px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 300px)' }}>
            {/* Text List */}
            <div style={{ width: '400px', overflow: 'auto' }}>
              {loading ? (
                <p>Loading...</p>
              ) : texts.length === 0 ? (
                <p>No texts found in this bucket.</p>
              ) : (
                texts.map(text => (
                  <div
                    key={text.id}
                    onClick={() => setSelectedText(text)}
                    style={{
                      padding: '15px',
                      marginBottom: '10px',
                      backgroundColor: selectedText?.id === text.id ? '#e9ecef' : '#f8f9fa',
                      border: selectedText?.id === text.id ? '2px solid #007bff' : '1px solid #dee2e6',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <h4 style={{ margin: '0 0 5px 0' }}>{text.title || 'Untitled'}</h4>
                    <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>
                      {text.author || 'Unknown author'}
                    </p>
                    <p style={{ margin: '0', fontSize: '12px', color: '#999' }}>
                      {text.documents?.publication} - {text.documents?.year}
                    </p>
                    <select
                      value={text.review_status || 'pending'}
                      onChange={(e) => {
                        e.stopPropagation()
                        updateTextBucket(text.id, e.target.value)
                      }}
                      style={{
                        marginTop: '8px',
                        padding: '4px 8px',
                        fontSize: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        backgroundColor: 'white'
                      }}
                    >
                      {allBuckets.map(bucket => (
                        <option key={bucket.key} value={bucket.key}>{bucket.name}</option>
                      ))}
                    </select>
                  </div>
                ))
              )}
            </div>

            {/* Text Details */}
            {selectedText && (
              <div style={{ flex: 1, overflow: 'auto', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
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

                {showSentenceProcessor && (
                  <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
                    <h4>Process AI-Generated Sentences</h4>
                    <textarea
                      value={sentenceJson}
                      onChange={(e) => setSentenceJson(e.target.value)}
                      placeholder="Paste the JSON output from AI here..."
                      style={{
                        width: '100%',
                        height: '200px',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        fontSize: '12px'
                      }}
                    />
                    <button
                      onClick={processSentences}
                      disabled={processingSentences || !sentenceJson.trim()}
                      style={{
                        marginTop: '10px',
                        padding: '8px 16px',
                        backgroundColor: processingSentences || !sentenceJson.trim() ? '#ccc' : '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: processingSentences || !sentenceJson.trim() ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {processingSentences ? 'Processing...' : 'Process Sentences'}
                    </button>
                  </div>
                )}

                {showProcessedSentences && parallelSentences.length > 0 && (
                  <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
                    <h4>Processed Sentences ({parallelSentences.length})</h4>
                    <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                      {parallelSentences.map((sentence, index) => (
                        <div key={sentence.id} style={{ marginBottom: '10px', padding: '10px', backgroundColor: 'white', borderRadius: '4px' }}>
                          <div style={{ marginBottom: '5px' }}>
                            <strong>Halunder:</strong> {sentence.halunder_sentence}
                          </div>
                          <div>
                            <strong>German:</strong> {sentence.german_sentence}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <h2>{selectedText.title || 'Untitled'}</h2>
                
                {/* Metadata Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ fontWeight: 'bold' }}>Title:</label>
                    <input
                      type="text"
                      value={selectedText.title || ''}
                      onChange={(e) => setSelectedText({...selectedText, title: e.target.value})}
                      style={{ width: '100%', padding: '5px', marginTop: '5px' }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ fontWeight: 'bold' }}>Author:</label>
                    <input
                      type="text"
                      value={selectedText.author || ''}
                      onChange={(e) => setSelectedText({...selectedText, author: e.target.value})}
                      style={{ width: '100%', padding: '5px', marginTop: '5px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontWeight: 'bold' }}>Subtitle:</label>
                    <input
                      type="text"
                      value={selectedText.subtitle || ''}
                      onChange={(e) => setSelectedText({...selectedText, subtitle: e.target.value})}
                      style={{ width: '100%', padding: '5px', marginTop: '5px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontWeight: 'bold' }}>Translator:</label>
                    <input
                      type="text"
                      value={selectedText.translator || ''}
                      onChange={(e) => setSelectedText({...selectedText, translator: e.target.value})}
                      style={{ width: '100%', padding: '5px', marginTop: '5px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontWeight: 'bold' }}>Editor/Corrector:</label>
                    <input
                      type="text"
                      value={selectedText.editor_corrector || ''}
                      onChange={(e) => setSelectedText({...selectedText, editor_corrector: e.target.value})}
                      style={{ width: '100%', padding: '5px', marginTop: '5px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontWeight: 'bold' }}>Series Info:</label>
                    <input
                      type="text"
                      value={selectedText.series_info || ''}
                      onChange={(e) => setSelectedText({...selectedText, series_info: e.target.value})}
                      style={{ width: '100%', padding: '5px', marginTop: '5px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontWeight: 'bold' }}>Text Quality:</label>
                    <select
                      value={selectedText.text_quality || ''}
                      onChange={(e) => setSelectedText({...selectedText, text_quality: e.target.value})}
                      style={{ width: '100%', padding: '5px', marginTop: '5px' }}
                    >
                      <option value="">Not specified</option>
                      <option value="professional">Professional</option>
                      <option value="colloquial">Colloquial</option>
                      <option value="scholarly">Scholarly</option>
                      <option value="literary">Literary</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontWeight: 'bold' }}>German Translation Location:</label>
                    <select
                      value={selectedText.german_translation_location || ''}
                      onChange={(e) => setSelectedText({...selectedText, german_translation_location: e.target.value})}
                      style={{ width: '100%', padding: '5px', marginTop: '5px' }}
                    >
                      <option value="">Not specified</option>
                      <option value="Side-by-side with Helgolandic">Side-by-side with Helgolandic</option>
                      <option value="Following the Helgolandic text">Following the Helgolandic text</option>
                      <option value="On a different page">On a different page</option>
                      <option value="In a separate publication">In a separate publication</option>
                      <option value="Not present on this page">Not present on this page</option>
                    </select>
                  </div>
                </div>

                {/* Document Metadata */}
                {selectedText.documents && (
                  <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
                    <h4>Document Information</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontWeight: 'bold' }}>Publication:</label>
                        <input
                          type="text"
                          value={selectedText.documents.publication || ''}
                          onChange={(e) => setSelectedText({
                            ...selectedText, 
                            documents: {...selectedText.documents, publication: e.target.value}
                          })}
                          style={{ width: '100%', padding: '5px', marginTop: '5px' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontWeight: 'bold' }}>Year:</label>
                        <input
                          type="number"
                          value={selectedText.documents.year || ''}
                          onChange={(e) => setSelectedText({
                            ...selectedText, 
                            documents: {...selectedText.documents, year: e.target.value}
                          })}
                          style={{ width: '100%', padding: '5px', marginTop: '5px' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontWeight: 'bold' }}>Edition:</label>
                        <input
                          type="text"
                          value={selectedText.documents.edition || ''}
                          onChange={(e) => setSelectedText({
                            ...selectedText, 
                            documents: {...selectedText.documents, edition: e.target.value}
                          })}
                          style={{ width: '100%', padding: '5px', marginTop: '5px' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontWeight: 'bold' }}>Page Numbers:</label>
                        <input
                          type="text"
                          value={selectedText.documents.page_numbers || ''}
                          onChange={(e) => setSelectedText({
                            ...selectedText, 
                            documents: {...selectedText.documents, page_numbers: e.target.value}
                          })}
                          style={{ width: '100%', padding: '5px', marginTop: '5px' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Source Reference */}
                <div style={{ marginBottom: '20px' }}>
                  <h4>Original Source Reference</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontWeight: 'bold' }}>Source Title:</label>
                      <input
                        type="text"
                        value={selectedText.original_source_title || ''}
                        onChange={(e) => setSelectedText({...selectedText, original_source_title: e.target.value})}
                        style={{ width: '100%', padding: '5px', marginTop: '5px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontWeight: 'bold' }}>Source Author:</label>
                      <input
                        type="text"
                        value={selectedText.original_source_author || ''}
                        onChange={(e) => setSelectedText({...selectedText, original_source_author: e.target.value})}
                        style={{ width: '100%', padding: '5px', marginTop: '5px' }}
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: '10px' }}>
                    <label style={{ fontWeight: 'bold' }}>Source Publication Info:</label>
                    <input
                      type="text"
                      value={selectedText.original_source_publication_info || ''}
                      onChange={(e) => setSelectedText({...selectedText, original_source_publication_info: e.target.value})}
                      style={{ width: '100%', padding: '5px', marginTop: '5px' }}
                    />
                  </div>
                </div>

                {/* Editorial Introduction */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontWeight: 'bold' }}>Editorial Introduction:</label>
                  <textarea
                    value={selectedText.editorial_introduction || ''}
                    onChange={(e) => setSelectedText({...selectedText, editorial_introduction: e.target.value})}
                    style={{ width: '100%', height: '100px', padding: '5px', marginTop: '5px' }}
                  />
                </div>

                {/* Halunder Text */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontWeight: 'bold' }}>Halunder Text:</label>
                  <textarea
                    value={selectedText.complete_helgolandic_text || ''}
                    onChange={(e) => setSelectedText({...selectedText, complete_helgolandic_text: e.target.value})}
                    style={{ width: '100%', height: '200px', padding: '5px', marginTop: '5px' }}
                  />
                </div>

                {/* German Translation */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontWeight: 'bold' }}>German Translation:</label>
                  <textarea
                    value={selectedText.german_translation_text || ''}
                    onChange={(e) => setSelectedText({...selectedText, german_translation_text: e.target.value})}
                    style={{ width: '100%', height: '200px', padding: '5px', marginTop: '5px' }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
