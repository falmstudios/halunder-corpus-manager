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
  
  // Editable fields
  const [halunderText, setHalunderText] = useState('')
  const [germanText, setGermanText] = useState('')
  const [editorialIntro, setEditorialIntro] = useState('')
  const [translationAids, setTranslationAids] = useState([])

  const buckets = {
    pending: { label: 'Pending Review', color: '#ffc107' },
    parallel_confirmed: { label: 'Parallel Confirmed', color: '#28a745' },
    german_available: { label: 'German Available', color: '#17a2b8' },
    halunder_only: { label: 'Halunder Only', color: '#fd7e14' },
    deleted: { label: 'Deleted', color: '#dc3545' }
  }

  useEffect(() => {
    loadBucketCounts()
    loadTexts()
  }, [selectedBucket])

  useEffect(() => {
    if (currentText) {
      setHalunderText(currentText.complete_helgolandic_text || '')
      setGermanText(currentText.german_translation_text || '')
      setEditorialIntro(currentText.editorial_introduction || '')
      loadTranslationAids(currentText.id)
    }
  }, [currentText])

  const loadBucketCounts = async () => {
    try {
      const response = await fetch('/api/bucket-counts')
      const result = await response.json()
      
      if (response.ok) {
        setBucketCounts(result.counts)
      }
    } catch (err) {
      console.error('Failed to load bucket counts:', err)
    }
  }

  const loadTexts = async () => {
    setLoading(true)
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
      
      // Select first text if none selected or current text not in list
      if (!currentText || !result.texts.find(t => t.id === currentText.id)) {
        setCurrentText(result.texts[0] || null)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
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

  const saveCurrentText = async () => {
    if (!currentText) return
    
    setSaving(true)
    setError('')
    
    try {
      const response = await fetch('/api/save-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentText.id,
          complete_helgolandic_text: halunderText,
          german_translation_text: germanText,
          editorial_introduction: editorialIntro,
          translation_aids: translationAids
        })
      })
      
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to save')
      }
      
      // Update current text
      setCurrentText(prev => ({
        ...prev,
        complete_helgolandic_text: halunderText,
        german_translation_text: germanText,
        editorial_introduction: editorialIntro
      }))
      
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const updateTextStatus = async (status) => {
    if (!currentText) return
    
    let confirmMessage = ''
    if (status === 'deleted') {
      confirmMessage = 'Are you sure you want to mark this text as deleted?'
    } else {
      confirmMessage = `Move this text to "${buckets[status].label}"?`
    }
    
    if (!confirm(confirmMessage)) return
    
    try {
      const response = await fetch('/api/update-text-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentText.id,
          status: status
        })
      })
      
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to update status')
      }
      
      // Reload texts and counts
      await loadTexts()
      await loadBucketCounts()
      
    } catch (err) {
      setError(err.message)
    }
  }

  const addTranslationAid = () => {
    setTranslationAids([...translationAids, { number: '', term: '', explanation: '' }])
  }

  const updateTranslationAid = (index, field, value) => {
    const updated = [...translationAids]
    updated[index] = { ...updated[index], [field]: value }
    setTranslationAids(updated)
  }

  const removeTranslationAid = (index) => {
    setTranslationAids(translationAids.filter((_, i) => i !== index))
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
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Buckets</h3>
          {Object.entries(buckets).map(([key, bucket]) => (
            <button
              key={key}
              onClick={() => setSelectedBucket(key)}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 12px',
                margin: '4px 0',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: selectedBucket === key ? bucket.color : '#e9ecef',
                color: selectedBucket === key ? 'white' : '#333',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              {bucket.label} ({bucketCounts[key] || 0})
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ padding: '15px', borderBottom: '1px solid #ddd' }}>
          <input
            type="text"
            placeholder="Search texts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadTexts()}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
          <button
            onClick={loadTexts}
            style={{
              width: '100%',
              padding: '6px',
              marginTop: '5px',
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
            <div>Loading...</div>
          ) : texts.length === 0 ? (
            <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
              No texts found
            </div>
          ) : (
            texts.map(text => (
              <div
                key={text.id}
                onClick={() => setCurrentText(text)}
                style={{
                  padding: '10px',
                  margin: '5px 0',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: currentText?.id === text.id ? '#e3f2fd' : 'white'
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                  {text.title || 'Untitled'}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {text.author && `by ${text.author}`}
                </div>
                <div style={{ fontSize: '11px', color: '#999', marginTop: '5px' }}>
                  {text.complete_helgolandic_text?.substring(0, 50)}...
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {currentText ? (
          <>
            {/* Header with metadata */}
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#fff', 
              borderBottom: '1px solid #ddd',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h1 style={{ margin: '0 0 10px 0' }}>{currentText.title || 'Untitled Text'}</h1>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '14px', color: '#666' }}>
                    {currentText.author && <div><strong>Author:</strong> {currentText.author}</div>}
                    {currentText.translator && <div><strong>Translator:</strong> {currentText.translator}</div>}
                    {currentText.text_quality && <div><strong>Quality:</strong> {currentText.text_quality}</div>}
                    {currentText.documents && <div><strong>Source:</strong> {currentText.documents.publication} ({currentText.documents.year})</div>}
                    <div><strong>Status:</strong> 
                      <span style={{ 
                        marginLeft: '5px',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        backgroundColor: buckets[currentText.review_status]?.color || '#ccc',
                        color: 'white',
                        fontSize: '12px'
                      }}>
                        {buckets[currentText.review_status]?.label || currentText.review_status}
                      </span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={saveCurrentText}
                  disabled={saving}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: saving ? '#ccc' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: saving ? 'not-allowed' : 'pointer'
                  }}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
              
              {error && (
                <div style={{
                  marginTop: '10px',
                  padding: '10px',
                  backgroundColor: '#ffebee',
                  color: '#c62828',
                  borderRadius: '4px'
                }}>
                  {error}
                </div>
              )}
            </div>

            {/* Main text editing area */}
            <div style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
              {/* Text fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px' }}>
                    Halunder Text:
                  </label>
                  <textarea
                    value={halunderText}
                    onChange={(e) => setHalunderText(e.target.value)}
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
                    value={germanText}
                    onChange={(e) => setGermanText(e.target.value)}
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
                  value={editorialIntro}
                  onChange={(e) => setEditorialIntro(e.target.value)}
                  style={{
                    width: '100%',
                    height: '100px',
                    padding: '15px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                  placeholder="Editorial introduction or notes..."
                />
              </div>

              {/* Translation Aids */}
              <div style={{ marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <label style={{ fontWeight: 'bold' }}>Translation Aids:</label>
                  <button
                    onClick={addTranslationAid}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Add Translation Aid
                  </button>
                </div>
                
                {translationAids.map((aid, index) => (
                  <div key={index} style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '100px 200px 1fr 60px', 
                    gap: '10px', 
                    alignItems: 'center',
                    marginBottom: '10px',
                    padding: '10px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px'
                  }}>
                    <input
                      type="text"
                      placeholder="No."
                      value={aid.number || ''}
                      onChange={(e) => updateTranslationAid(index, 'number', e.target.value)}
                      style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                    <input
                      type="text"
                      placeholder="Term"
                      value={aid.term || ''}
                      onChange={(e) => updateTranslationAid(index, 'term', e.target.value)}
                      style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                    <input
                      type="text"
                      placeholder="Explanation"
                      value={aid.explanation || ''}
                      onChange={(e) => updateTranslationAid(index, 'explanation', e.target.value)}
                      style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                    <button
                      onClick={() => removeTranslationAid(index)}
                      style={{
                        padding: '8px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#f8f9fa', 
              borderTop: '1px solid #ddd',
              display: 'flex',
              justifyContent: 'center',
              gap: '15px'
            }}>
              <button
                onClick={() => updateTextStatus('deleted')}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Delete
              </button>
              <button
                onClick={() => updateTextStatus('parallel_confirmed')}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Parallel Confirmed
              </button>
              <button
                onClick={() => updateTextStatus('german_available')}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                German Available
              </button>
              <button
                onClick={() => updateTextStatus('halunder_only')}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#fd7e14',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Halunder Only
              </button>
            </div>
          </>
        ) : (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            color: '#666'
          }}>
            Select a text to review
          </div>
        )}
      </div>
    </div>
  )
}
