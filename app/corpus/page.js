'use client'

import { useState, useEffect } from 'react'

export default function CorpusViewer() {
  const [parallelSentences, setParallelSentences] = useState([])
  const [linguisticFeatures, setLinguisticFeatures] = useState([])
  const [vocabulary, setVocabulary] = useState([])
  const [selectedText, setSelectedText] = useState(null)
  const [texts, setTexts] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('parallel')

  useEffect(() => {
    loadProcessedTexts()
  }, [])

  useEffect(() => {
    if (selectedText) {
      loadCorpusData(selectedText.id)
    } else {
      loadAllCorpusData()
    }
  }, [selectedText])

  const loadProcessedTexts = async () => {
    try {
      const response = await fetch('/api/corpus-texts')
      const result = await response.json()
      
      if (response.ok) {
        setTexts(result.texts)
        // Don't auto-select first text - let user choose or see all data
      }
    } catch (err) {
      console.error('Failed to load processed texts:', err)
    }
  }

  const loadCorpusData = async (textId) => {
    setLoading(true)
    try {
      const [parallelResponse, featuresResponse, vocabResponse] = await Promise.all([
        fetch(`/api/corpus-data?textId=${textId}&type=parallel`),
        fetch(`/api/corpus-data?textId=${textId}&type=features`),
        fetch(`/api/corpus-data?type=vocabulary`)
      ])

      const [parallelResult, featuresResult, vocabResult] = await Promise.all([
        parallelResponse.json(),
        featuresResponse.json(),
        vocabResponse.json()
      ])

      if (parallelResponse.ok) setParallelSentences(parallelResult.data || [])
      if (featuresResponse.ok) setLinguisticFeatures(featuresResult.data || [])
      if (vocabResponse.ok) setVocabulary(vocabResult.data || [])

    } catch (err) {
      console.error('Failed to load corpus data:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadAllCorpusData = async () => {
    setLoading(true)
    try {
      const [parallelResponse, featuresResponse, vocabResponse] = await Promise.all([
        fetch(`/api/corpus-data?type=parallel`), // No textId = get all
        fetch(`/api/corpus-data?type=features`), // No textId = get all
        fetch(`/api/corpus-data?type=vocabulary`)
      ])

      const [parallelResult, featuresResult, vocabResult] = await Promise.all([
        parallelResponse.json(),
        featuresResponse.json(),
        vocabResponse.json()
      ])

      if (parallelResponse.ok) setParallelSentences(parallelResult.data || [])
      if (featuresResponse.ok) setLinguisticFeatures(featuresResult.data || [])
      if (vocabResponse.ok) setVocabulary(vocabResult.data || [])

    } catch (err) {
      console.error('Failed to load all corpus data:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Corpus Viewer</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <a 
            href="/" 
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px'
            }}
          >
            ← Home
          </a>
          <a 
            href="/review" 
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px'
            }}
          >
            Text Review
          </a>
          <a 
            href="/editor" 
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px'
            }}
          >
            Table Editor
          </a>
        </div>
      </div>

      {/* Text Selection */}
      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h2 style={{ marginBottom: '15px' }}>View Corpus Data</h2>
        <select 
          value={selectedText?.id || ''} 
          onChange={(e) => {
            const text = texts.find(t => t.id === e.target.value)
            setSelectedText(text || null)
          }}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            fontSize: '16px'
          }}
        >
          <option value="">View all processed sentences</option>
          {texts.map(text => (
            <option key={text.id} value={text.id}>
              {text.title || 'Untitled'} {text.author && `by ${text.author}`}
            </option>
          ))}
        </select>
        {!selectedText && (
          <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#666' }}>
            Showing all processed sentences from all texts. Select a specific text to filter results.
          </p>
        )}
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #ddd' }}>
          {[
            { key: 'parallel', label: 'Parallel Sentences', count: parallelSentences.length },
            { key: 'features', label: 'Linguistic Features', count: linguisticFeatures.length },
            { key: 'vocabulary', label: 'Vocabulary', count: vocabulary.length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderBottom: activeTab === tab.key ? '3px solid #007bff' : '3px solid transparent',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontWeight: activeTab === tab.key ? 'bold' : 'normal'
              }}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
      ) : (
        <>
          {/* Parallel Sentences Tab */}
          {activeTab === 'parallel' && (
            <div>
              <h3>Parallel Sentences {selectedText ? `for "${selectedText.title}"` : '(All Texts)'}</h3>
              {parallelSentences.length === 0 ? (
                <p>No parallel sentences found{selectedText ? ' for this text' : ''}.</p>
              ) : (
                <div style={{ display: 'grid', gap: '15px' }}>
                  {parallelSentences.map((sentence, index) => (
                    <div key={sentence.id} style={{
                      padding: '15px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      backgroundColor: 'white'
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                          <strong style={{ color: '#007bff' }}>Halunder:</strong>
                          <p style={{ margin: '5px 0', fontFamily: 'Georgia, serif' }}>
                            {sentence.halunder_sentence}
                          </p>
                        </div>
                        <div>
                          <strong style={{ color: '#28a745' }}>German:</strong>
                          <p style={{ margin: '5px 0', fontFamily: 'Georgia, serif' }}>
                            {sentence.german_sentence}
                          </p>
                        </div>
                      </div>
                      <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                        Order: {sentence.sentence_order} | Type: {sentence.source_type}
                        {sentence.confidence_score && ` | Confidence: ${sentence.confidence_score}`}
                        {!selectedText && sentence.source_text_title && (
                          <span style={{ marginLeft: '10px' }}>
                            | From: {sentence.source_text_title}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/*
