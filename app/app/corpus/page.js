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
    }
  }, [selectedText])

  const loadProcessedTexts = async () => {
    try {
      const response = await fetch('/api/corpus-texts')
      const result = await response.json()
      
      if (response.ok) {
        setTexts(result.texts)
        if (result.texts.length > 0) {
          setSelectedText(result.texts[0])
        }
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

      if (parallelResponse.ok) setParallelSentences(parallelResult.data)
      if (featuresResponse.ok) setLinguisticFeatures(featuresResult.data)
      if (vocabResponse.ok) setVocabulary(vocabResult.data)

    } catch (err) {
      console.error('Failed to load corpus data:', err)
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
            href="/review" 
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px'
            }}
          >
            ← Text Review
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
        <h2 style={{ marginBottom: '15px' }}>Select Processed Text</h2>
        <select 
          value={selectedText?.id || ''} 
          onChange={(e) => {
            const text = texts.find(t => t.id === e.target.value)
            setSelectedText(text)
          }}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            fontSize: '16px'
          }}
        >
          <option value="">Select a text...</option>
          {texts.map(text => (
            <option key={text.id} value={text.id}>
              {text.title || 'Untitled'} {text.author && `by ${text.author}`}
            </option>
          ))}
        </select>
      </div>

      {selectedText && (
        <>
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
                  <h3>Parallel Sentences</h3>
                  {parallelSentences.length === 0 ? (
                    <p>No parallel sentences found for this text.</p>
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
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Linguistic Features Tab */}
              {activeTab === 'features' && (
                <div>
                  <h3>Linguistic Features</h3>
                  {linguisticFeatures.length === 0 ? (
                    <p>No linguistic features found for this text.</p>
                  ) : (
                    <div style={{ display: 'grid', gap: '15px' }}>
                      {linguisticFeatures.map((feature, index) => (
                        <div key={feature.id} style={{
                          padding: '15px',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          backgroundColor: 'white'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                            <div>
                              <strong style={{ color: '#007bff', fontSize: '16px' }}>
                                {feature.halunder_term}
                              </strong>
                              {feature.german_equivalent && (
                                <span style={{ marginLeft: '10px', color: '#28a745' }}>
                                  → {feature.german_equivalent}
                                </span>
                              )}
                            </div>
                            <span style={{
                              padding: '4px 8px',
                              backgroundColor: getFeatureTypeColor(feature.feature_type),
                              color: 'white',
                              borderRadius: '12px',
                              fontSize: '12px'
                            }}>
                              {feature.feature_type}
                            </span>
                          </div>
                          <p style={{ margin: 0, color: '#333' }}>
                            {feature.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Vocabulary Tab */}
              {activeTab === 'vocabulary' && (
                <div>
                  <h3>Vocabulary Tracker</h3>
                  {vocabulary.length === 0 ? (
                    <p>No vocabulary entries found.</p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                      {vocabulary.map((word, index) => (
                        <div key={word.id} style={{
                          padding: '15px',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          backgroundColor: 'white'
                        }}>
                          <div style={{ fontWeight: 'bold', color: '#007bff', marginBottom: '8px' }}>
                            {word.halunder_word}
                          </div>
                          {word.german_translations && word.german_translations.length > 0 && (
                            <div style={{ marginBottom: '8px' }}>
                              <strong>German:</strong> {word.german_translations.join(', ')}
                            </div>
                          )}
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            Frequency: {word.frequency_count} | Confidence: {word.confidence_level}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

function getFeatureTypeColor(type) {
  const colors = {
    idiom: '#e74c3c',
    phrase: '#3498db',
    cultural: '#9b59b6',
    etymology: '#f39c12',
    grammar: '#2ecc71',
    other: '#95a5a6'
  }
  return colors[type] || colors.other
}
