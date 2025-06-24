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
  
  // Quality review states
  const [reviewMode, setReviewMode] = useState(false)
  const [buckets, setBuckets] = useState([])
  const [selectedBucket, setSelectedBucket] = useState('all')
  const [qualitySentences, setQualitySentences] = useState([])
  const [selectedSentences, setSelectedSentences] = useState(new Set())
  const [editingSentence, setEditingSentence] = useState(null)
  const [calculating, setCalculating] = useState(false)

  useEffect(() => {
    loadProcessedTexts()
    if (reviewMode) {
      loadBuckets()
    }
  }, [reviewMode])

  useEffect(() => {
    if (reviewMode && selectedBucket !== 'all') {
      loadQualitySentences()
    } else if (!reviewMode) {
      if (selectedText) {
        loadCorpusData(selectedText.id)
      } else {
        loadAllCorpusData()
      }
    }
  }, [selectedText, reviewMode, selectedBucket])

  const loadProcessedTexts = async () => {
    try {
      const response = await fetch('/api/corpus-texts')
      const result = await response.json()
      
      if (response.ok) {
        setTexts(result.texts)
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
        fetch(`/api/corpus-data?type=parallel`),
        fetch(`/api/corpus-data?type=features`),
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

  // Quality review functions
  const loadBuckets = async () => {
    try {
      const response = await fetch('/api/corpus-quality/buckets')
      const data = await response.json()
      if (response.ok) {
        setBuckets(data.buckets)
      }
    } catch (err) {
      console.error('Failed to load buckets:', err)
    }
  }

  const loadQualitySentences = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/corpus-quality/sentences?bucket=${selectedBucket}&limit=200`)
      const data = await response.json()
      
      if (response.ok) {
        setQualitySentences(data.sentences)
      }
    } catch (err) {
      console.error('Failed to load quality sentences:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculateAllMetrics = async () => {
    if (!confirm('Qualitätsmetriken für alle Sätze berechnen? Dies kann einige Minuten dauern.')) {
      return
    }

    setCalculating(true)
    try {
      const response = await fetch('/api/corpus-quality/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      
      const data = await response.json()
      if (response.ok) {
        alert(`Erfolgreich ${data.processed} Sätze verarbeitet!`)
        loadBuckets()
        if (selectedBucket !== 'all') {
          loadQualitySentences()
        }
      } else {
        alert('Fehler: ' + data.error)
      }
    } catch (err) {
      console.error('Failed to calculate metrics:', err)
      alert('Fehler beim Berechnen der Metriken')
    } finally {
      setCalculating(false)
    }
  }

  const handleSentenceUpdate = async (sentenceId, updates) => {
    try {
      const response = await fetch('/api/corpus-quality/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sentenceId, ...updates })
      })

      const data = await response.json()
      if (response.ok) {
        setEditingSentence(null)
        loadQualitySentences()
        loadBuckets()
      } else {
        alert('Fehler: ' + data.error)
      }
    } catch (err) {
      console.error('Failed to update sentence:', err)
      alert('Fehler beim Aktualisieren')
    }
  }

  const moveSentenceToBucket = async (sentenceId, targetBucket) => {
    await handleSentenceUpdate(sentenceId, { quality_bucket: targetBucket })
  }

  const getQualityBadges = (sentence) => {
    const badges = []
    
    if (sentence.quality_tags?.includes('similar_length')) {
      badges.push(
        <span key="length-similar" style={{
          padding: '2px 8px',
          backgroundColor: '#28a745',
          color: 'white',
          borderRadius: '12px',
          fontSize: '12px',
          marginRight: '4px'
        }}>
          Länge ✓
        </span>
      )
    } else if (sentence.quality_tags?.includes('different_length')) {
      badges.push(
        <span key="length-different" style={{
          padding: '2px 8px',
          backgroundColor: '#dc3545',
          color: 'white',
          borderRadius: '12px',
          fontSize: '12px',
          marginRight: '4px'
        }}>
          Länge ✗
        </span>
      )
    }
    
    if (sentence.quality_tags?.includes('similar_punctuation')) {
      badges.push(
        <span key="punct-similar" style={{
          padding: '2px 8px',
          backgroundColor: '#28a745',
          color: 'white',
          borderRadius: '12px',
          fontSize: '12px',
          marginRight: '4px'
        }}>
          Interpunktion ✓
        </span>
      )
    } else if (sentence.quality_tags?.includes('very_different_punctuation')) {
      badges.push(
        <span key="punct-different" style={{
          padding: '2px 8px',
          backgroundColor: '#dc3545',
          color: 'white',
          borderRadius: '12px',
          fontSize: '12px',
          marginRight: '4px'
        }}>
          Interpunktion ✗
        </span>
      )
    }
    
    return badges
  }

  // Render sentence for quality review
  const renderQualitySentence = (sentence) => {
    if (editingSentence === sentence.id) {
      return (
        <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Halunder:</label>
            <textarea
              id={`halunder-${sentence.id}`}
              defaultValue={sentence.halunder_sentence}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ced4da',
                minHeight: '60px',
                fontFamily: 'monospace'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Deutsch:</label>
            <textarea
              id={`german-${sentence.id}`}
              defaultValue={sentence.german_sentence}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ced4da',
                minHeight: '60px',
                fontFamily: 'monospace'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => {
                const halunderText = document.getElementById(`halunder-${sentence.id}`).value
                const germanText = document.getElementById(`german-${sentence.id}`).value
                handleSentenceUpdate(sentence.id, {
                  halunder_sentence: halunderText,
                  german_sentence: germanText,
                  quality_reviewed: true
                })
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Speichern
            </button>
            <button
              onClick={() => setEditingSentence(null)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Abbrechen
            </button>
          </div>
        </div>
      )
    }

    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              checked={selectedSentences.has(sentence.id)}
              onChange={() => {
                const newSelected = new Set(selectedSentences)
                if (newSelected.has(sentence.id)) {
                  newSelected.delete(sentence.id)
                } else {
                  newSelected.add(sentence.id)
                }
                setSelectedSentences(newSelected)
              }}
              style={{ width: '18px', height: '18px' }}
            />
            {getQualityBadges(sentence)}
          </div>
          <button
            onClick={() => setEditingSentence(sentence.id)}
            style={{
              padding: '4px 12px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Bearbeiten
          </button>
        </div>
        
        <div style={{ marginBottom: '8px' }}>
          <strong>Halunder ({sentence.halunder_word_count || 0} Wörter):</strong>
          <div style={{ 
            padding: '8px',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            marginTop: '4px',
            fontFamily: 'monospace',
            fontSize: '14px'
          }}>
            {sentence.halunder_sentence}
          </div>
        </div>
        
        <div style={{ marginBottom: '8px' }}>
          <strong>Deutsch ({sentence.german_word_count || 0} Wörter):</strong>
          <div style={{ 
            padding: '8px',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            marginTop: '4px',
            fontFamily: 'monospace',
            fontSize: '14px'
          }}>
            {sentence.german_sentence}
          </div>
        </div>
        
        <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '8px' }}>
          Längenverhältnis: {sentence.length_ratio ? (sentence.length_ratio * 100).toFixed(0) : 0}% | 
          Interpunktion: {sentence.punctuation_ratio ? (sentence.punctuation_ratio * 100).toFixed(0) : 0}%
          {sentence.texts && ` | ${sentence.texts.title}`}
        </div>
      </>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Left sidebar */}
      <div style={{ 
        width: reviewMode ? '300px' : '250px', 
        backgroundColor: '#f8f9fa', 
        padding: '20px',
        overflowY: 'auto',
        borderRight: '1px solid #dee2e6'
      }}>
        <h2 style={{ marginBottom: '20px' }}>
          {reviewMode ? 'Qualitätsprüfung' : 'Corpus Viewer'}
        </h2>
        
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => {
              setReviewMode(!reviewMode)
              setSelectedBucket('all')
              setSelectedSentences(new Set())
            }}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: reviewMode ? '#dc3545' : '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: '10px'
            }}
          >
            {reviewMode ? 'Zurück zum Viewer' : 'Qualitätsprüfung'}
          </button>
          
          {reviewMode && (
            <button
              onClick={calculateAllMetrics}
              disabled={calculating}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: calculating ? 'not-allowed' : 'pointer',
                opacity: calculating ? 0.6 : 1
              }}
            >
              {calculating ? 'Berechne...' : 'Metriken berechnen'}
            </button>
          )}
        </div>

        {reviewMode ? (
          // Quality buckets
          <div>
            <h3 style={{ marginBottom: '15px' }}>Buckets</h3>
            <div
              onClick={() => setSelectedBucket('all')}
              style={{
                padding: '12px',
                marginBottom: '8px',
                backgroundColor: selectedBucket === 'all' ? '#007bff' : 'white',
                color: selectedBucket === 'all' ? 'white' : 'black',
                borderRadius: '4px',
                cursor: 'pointer',
                border: '1px solid #dee2e6'
              }}
            >
              <div style={{ fontWeight: 'bold' }}>Alle Sätze</div>
              <div style={{ fontSize: '12px' }}>Gesamtübersicht</div>
            </div>
            
            {buckets.map(bucket => (
              <div
                key={bucket.key}
                onClick={() => setSelectedBucket(bucket.key)}
                style={{
                  padding: '12px',
                  marginBottom: '8px',
                  backgroundColor: selectedBucket === bucket.key ? bucket.color : 'white',
                  color: selectedBucket === bucket.key ? 'white' : 'black',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  border: `2px solid ${bucket.color}`
                }}
              >
                <div style={{ fontWeight: 'bold' }}>{bucket.label}</div>
                <div style={{ fontSize: '20px', margin: '5px 0' }}>{bucket.count}</div>
                <div style={{ fontSize: '11px', opacity: 0.8 }}>{bucket.description}</div>
              </div>
            ))}
          </div>
        ) : (
          // Text list for normal view
          <>
            <h3 style={{ marginBottom: '15px' }}>Texte</h3>
            <div
              onClick={() => setSelectedText(null)}
              style={{
                padding: '10px',
                marginBottom: '10px',
                backgroundColor: !selectedText ? '#007bff' : 'white',
                color: !selectedText ? 'white' : 'black',
                borderRadius: '4px',
                cursor: 'pointer',
                border: '1px solid #dee2e6'
              }}
            >
              Alle Texte
            </div>
            
            {texts.map(text => (
              <div
                key={text.id}
                onClick={() => setSelectedText(text)}
                style={{
                  padding: '10px',
                  marginBottom: '5px',
                  backgroundColor: selectedText?.id === text.id ? '#007bff' : 'white',
                  color: selectedText?.id === text.id ? 'white' : 'black',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  border: '1px solid #dee2e6',
                  fontSize: '14px'
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>{text.title}</div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                  {text.author || 'Unbekannt'}
                </div>
              </div>
            ))}
          </>
        )}
        
        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #dee2e6' }}>
          <a 
            href="/" 
            style={{
              display: 'block',
              padding: '10px',
              backgroundColor: '#6c757d',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              textAlign: 'center'
            }}
          >
            ← Home
          </a>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {reviewMode ? (
          // Quality review content
          <div>
            {selectedBucket === 'all' ? (
              <div>
                <h2>Corpus-Qualitätsübersicht</h2>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
                  gap: '15px',
                  marginTop: '20px'
                }}>
                  {buckets.map(bucket => (
                    <div
                      key={bucket.key}
                      style={{
                        padding: '20px',
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        border: `2px solid ${bucket.color}`,
                        textAlign: 'center'
                      }}
                    >
                      <h3 style={{ color: bucket.color, marginBottom: '10px' }}>{bucket.label}</h3>
                      <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '10px' }}>
                        {bucket.count}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6c757d' }}>
                        {bucket.description}
                      </div>
                      <button
                        onClick={() => setSelectedBucket(bucket.key)}
                        style={{
                          marginTop: '15px',
                          padding: '8px 16px',
                          backgroundColor: bucket.color,
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Anzeigen
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <h2 style={{ marginBottom: '20px' }}>
                  {buckets.find(b => b.key === selectedBucket)?.label || 'Sätze'}
                </h2>
                
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    Lade Sätze...
                  </div>
                ) : qualitySentences.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                    Keine Sätze in diesem Bucket
                  </div>
                ) : (
                  <div>
                    {/* Bulk actions bar */}
                    <div style={{
                      padding: '15px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      marginBottom: '20px',
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'center'
                    }}>
                      <button
                        onClick={() => {
                          if (selectedSentences.size === qualitySentences.length) {
                            setSelectedSentences(new Set())
                          } else {
                            setSelectedSentences(new Set(qualitySentences.map(s => s.id)))
                          }
                        }}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        {selectedSentences.size === qualitySentences.length ? 'Alle abwählen' : 'Alle auswählen'}
                      </button>
                      
                      {selectedSentences.size > 0 && (
                        <>
                          <span>{selectedSentences.size} ausgewählt</span>
                          <select
                            onChange={async (e) => {
                              const targetBucket = e.target.value
                              if (targetBucket && confirm(`${selectedSentences.size} Sätze nach "${targetBucket}" verschieben?`)) {
                                try {
                                  const response = await fetch('/api/corpus-quality/bulk-action', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      action: 'move',
                                      sentenceIds: Array.from(selectedSentences),
                                      targetBucket
                                    })
                                  })
                                  
                                  if (response.ok) {
                                    setSelectedSentences(new Set())
                                    loadBuckets()
                                    loadQualitySentences()
                                  }
                                } catch (err) {
                                  console.error('Failed to move sentences:', err)
                                }
                              }
                              e.target.value = ''
                            }}
                            style={{
                              padding: '8px',
                              borderRadius: '4px',
                              border: '1px solid #ced4da'
                            }}
                          >
                            <option value="">Verschieben nach...</option>
                            {buckets.filter(b => b.key !== selectedBucket).map(bucket => (
                              <option key={bucket.key} value={bucket.key}>{bucket.label}</option>
                            ))}
                          </select>
                        </>
                      )}
                    </div>
                    
                    {/* Sentences list */}
                    {qualitySentences.map((sentence) => (
                      <div
                        key={sentence.id}
                        style={{
                          marginBottom: '15px',
                          padding: '15px',
                          backgroundColor: 'white',
                          border: '1px solid #dee2e6',
                          borderRadius: '8px'
                        }}
                      >
                        {renderQualitySentence(sentence)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          // Normal corpus view
          <>
            {!reviewMode && (
              <div style={{ marginBottom: '20px' }}>
                <button
                  onClick={() => setActiveTab('parallel')}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: activeTab === 'parallel' ? '#007bff' : '#e9ecef',
                    color: activeTab === 'parallel' ? 'white' : 'black',
                    border: 'none',
                    borderRadius: '4px 0 0 4px',
                    cursor: 'pointer'
                  }}
                >
                  Parallele Sätze ({parallelSentences.length})
                </button>
                <button
                  onClick={() => setActiveTab('features')}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: activeTab === 'features' ? '#007bff' : '#e9ecef',
                    color: activeTab === 'features' ? 'white' : 'black',
                    border: 'none',
                    borderRadius: '0',
                    cursor: 'pointer'
                  }}
                >
                  Sprachliche Merkmale ({linguisticFeatures.length})
                </button>
                <button
                  onClick={() => setActiveTab('vocabulary')}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: activeTab === 'vocabulary' ? '#007bff' : '#e9ecef',
                    color: activeTab === 'vocabulary' ? 'white' : 'black',
                    border: 'none',
                    borderRadius: '0 4px 4px 0',
                    cursor: 'pointer'
                  }}
                >
                  Vokabular ({vocabulary.length})
                </button>
              </div>
            )}

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div>Lade Daten...</div>
              </div>
            ) : (
              <>
                {activeTab === 'parallel' && (
                  <div>
                    <h2>Parallele Sätze</h2>
                    {parallelSentences.length === 0 ? (
                      <p>Keine parallelen Sätze vorhanden.</p>
                    ) : (
                      <div style={{ marginTop: '20px' }}>
                        {parallelSentences.map((sentence, idx) => (
                          <div key={sentence.id || idx} style={{
                            marginBottom: '20px',
                            padding: '15px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px'
                          }}>
                            <div style={{ marginBottom: '10px' }}>
                              <strong>Halunder:</strong>
                              <div style={{ 
                                padding: '10px',
                                backgroundColor: 'white',
                                borderRadius: '4px',
                                marginTop: '5px'
                              }}>
                                {sentence.halunder_sentence}
                              </div>
                            </div>
                            <div>
                              <strong>Deutsch:</strong>
                              <div style={{ 
                                padding: '10px',
                                backgroundColor: 'white',
                                borderRadius: '4px',
                                marginTop: '5px'
                              }}>
                                {sentence.german_sentence}
                              </div>
                            </div>
                            {sentence.confidence_score && (
                              <div style={{ marginTop: '10px', fontSize: '14px', color: '#6c757d' }}>
                                Konfidenz: {(sentence.confidence_score * 100).toFixed(0)}%
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'features' && (
                  <div>
                    <h2>Sprachliche Merkmale</h2>
                    {linguisticFeatures.length === 0 ? (
                      <p>Keine sprachlichen Merkmale vorhanden.</p>
                    ) : (
                      <div style={{ marginTop: '20px' }}>
                        {linguisticFeatures.map((feature, idx) => (
                          <div key={feature.id || idx} style={{
                            marginBottom: '15px',
                            padding: '15px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px'
                          }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                              {feature.halunder_term}
                              {feature.german_equivalent && (
                                <span style={{ fontWeight: 'normal' }}> = {feature.german_equivalent}</span>
                              )}
                            </div>
                            <div>{feature.explanation}</div>
                            {feature.feature_type && (
                              <div style={{ marginTop: '5px', fontSize: '12px', color: '#6c757d' }}>
                                Typ: {feature.feature_type}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'vocabulary' && (
                  <div>
                    <h2>Vokabular-Tracking</h2>
                    {vocabulary.length === 0 ? (
                      <p>Kein Vokabular vorhanden.</p>
                    ) : (
                      <div style={{ marginTop: '20px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                              <th style={{ padding: '10px', textAlign: 'left' }}>Halunder</th>
                              <th style={{ padding: '10px', textAlign: 'left' }}>Deutsch</th>
                              <th style={{ padding: '10px', textAlign: 'center' }}>Häufigkeit</th>
                              <th style={{ padding: '10px', textAlign: 'center' }}>Konfidenz</th>
                            </tr>
                          </thead>
                          <tbody>
                            {vocabulary.map((word, idx) => (
                              <tr key={word.id || idx} style={{ borderBottom: '1px solid #dee2e6' }}>
                                <td style={{ padding: '10px' }}>{word.halunder_word}</td>
                                <td style={{ padding: '10px' }}>
                                  {word.german_translations?.join(', ') || '-'}
                                </td>
                                <td style={{ padding: '10px', textAlign: 'center' }}>
                                  {word.frequency_count || 1}
                                </td>
                                <td style={{ padding: '10px', textAlign: 'center' }}>
                                  <span style={{
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    backgroundColor: word.confidence_level === 'high' ? '#28a745' :
                                                   word.confidence_level === 'medium' ? '#ffc107' :
                                                   '#6c757d',
                                    color: 'white'
                                  }}>
                                    {word.confidence_level || 'unknown'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
