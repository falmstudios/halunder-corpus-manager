'use client'

import { useState } from 'react'
import Navbar from '../components/Navbar'

export default function AnalyzePage() {
  const [sentence, setSentence] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [results, setResults] = useState(null)

  const analyzeSentence = async () => {
    if (!sentence.trim()) return

    setAnalyzing(true)
    try {
      const response = await fetch('/api/analyze-sentence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence })
      })

      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error('Analysis error:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-content">
          <h1>Sentence Analysis</h1>
          
          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Enter a Halunder sentence to analyze
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={sentence}
                onChange={(e) => setSentence(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && analyzeSentence()}
                placeholder="e.g., Ik hoa iaan Oapel"
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
              <button
                onClick={analyzeSentence}
                disabled={analyzing || !sentence.trim()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: analyzing || !sentence.trim() ? '#9ca3af' : '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: analyzing || !sentence.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  whiteSpace: 'nowrap'
                }}
              >
                {analyzing ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
          </div>

          {results && (
            <div>
              <div style={{ marginBottom: '30px' }}>
                <h2>Statistics</h2>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px'
                }}>
                  <div style={{
                    backgroundColor: '#f9fafb',
                    padding: '20px',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50' }}>
                      {results.stats.totalWords}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                      Total Words
                    </div>
                  </div>
                  <div style={{
                    backgroundColor: '#d1fae5',
                    padding: '20px',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669' }}>
                      {results.stats.knownWords}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                      Known Words
                    </div>
                  </div>
                  <div style={{
                    backgroundColor: '#fed7aa',
                    padding: '20px',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ea580c' }}>
                      {results.stats.unknownWords}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                      Unknown Words
                    </div>
                  </div>
                  <div style={{
                    backgroundColor: '#dbeafe',
                    padding: '20px',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>
                      {results.stats.coverage}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                      Dictionary Coverage
                    </div>
                  </div>
                </div>
              </div>

              {Object.keys(results.wordAnalysis).length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                  <h2>Word Analysis</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {Object.entries(results.wordAnalysis).map(([word, entries]) => (
                      <div key={word} style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '16px',
                        backgroundColor: '#fafafa'
                      }}>
                        <div style={{ 
                          fontWeight: 'bold', 
                          fontSize: '18px', 
                          marginBottom: '8px',
                          color: '#2c3e50'
                        }}>
                          {word}
                        </div>
                        {entries.map((entry, idx) => (
                          <div key={idx} style={{ 
                            marginTop: idx > 0 ? '12px' : '0',
                            paddingTop: idx > 0 ? '12px' : '0',
                            borderTop: idx > 0 ? '1px solid #e5e7eb' : 'none'
                          }}>
                            <div style={{ marginBottom: '4px' }}>
                              <span style={{ fontWeight: '500' }}>{entry.halunder_word}</span>
                              {entry.pronunciation && (
                                <span style={{ marginLeft: '8px', color: '#6b7280' }}>
                                  [{entry.pronunciation}]
                                </span>
                              )}
                              {entry.word_type && (
                                <span style={{ 
                                  marginLeft: '8px', 
                                  color: '#3498db',
                                  backgroundColor: '#e3f2fd',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '12px'
                                }}>
                                  {entry.word_type}
                                </span>
                              )}
                              {entry.gender && (
                                <span style={{ 
                                  marginLeft: '4px', 
                                  color: '#9b59b6',
                                  fontWeight: 'bold'
                                }}>
                                  {entry.gender}
                                </span>
                              )}
                            </div>
                            {entry.german_meaning && (
                              <div style={{ 
                                marginTop: '4px',
                                color: '#374151',
                                paddingLeft: '20px'
                              }}>
                                → {entry.german_meaning}
                              </div>
                            )}
                            {entry.etymology && (
                              <div style={{ 
                                marginTop: '4px',
                                color: '#6b7280',
                                fontSize: '14px',
                                fontStyle: 'italic',
                                paddingLeft: '20px'
                              }}>
                                Etymology: {entry.etymology}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.unknownWords.length > 0 && (
                <div>
                  <h2>Unknown Words</h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {results.unknownWords.map((word, idx) => (
                      <span key={idx} style={{
                        padding: '6px 12px',
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
