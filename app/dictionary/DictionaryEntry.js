'use client'

import { useState } from 'react'

export default function DictionaryEntry({ entry, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false)
  const [meanings, setMeanings] = useState(entry.dictionary_meanings || [])
  const [searchingCorpus, setSearchingCorpus] = useState(false)
  const [showCorpusSearch, setShowCorpusSearch] = useState(false)
  const [corpusSentences, setCorpusSentences] = useState([])

  const handleSave = async () => {
    try {
      // Prepare meanings data
      const meaningsToSave = meanings.filter(m => m.text && m.text.trim())
      
      const response = await fetch('/api/dictionary/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: entry.id,
          halunder_word: entry.halunder_word,
          meanings: meaningsToSave
        })
      })
      
      if (response.ok) {
        // Reload to show updated data
        window.location.reload()
      } else {
        const error = await response.json()
        alert('Fehler beim Speichern: ' + (error.error || 'Unbekannter Fehler'))
      }
    } catch (error) {
      console.error('Failed to update entry:', error)
      alert('Fehler beim Speichern: ' + error.message)
    }
  }

  const handleCancel = () => {
    // Reset to original state
    window.location.reload()
  }

  const addMeaning = () => {
    setMeanings([...meanings, { id: `new_${Date.now()}`, text: '', context: null }])
  }

  const removeMeaning = (index) => {
    if (meanings.length > 1) {
      setMeanings(meanings.filter((_, i) => i !== index))
    }
  }

  const updateMeaning = (index, text) => {
    const updated = [...meanings]
    updated[index] = { ...updated[index], text }
    setMeanings(updated)
  }

  const searchCorpus = async () => {
    setSearchingCorpus(true)
    setCorpusSentences([])
    try {
      // Search for both Halunder word and all German meanings
      const germanWords = meanings.map(m => m.text).filter(t => t.trim()).join(',')
      let url = `/api/corpus-search?word=${encodeURIComponent(entry.halunder_word)}`
      if (germanWords) {
        url += `&german=${encodeURIComponent(germanWords)}`
      }
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (response.ok) {
        setCorpusSentences(data.sentences || [])
        setShowCorpusSearch(true)
      } else {
        console.error('Corpus search error:', data.error)
        alert('Fehler bei der Corpus-Suche: ' + (data.error || 'Unbekannter Fehler'))
      }
    } catch (error) {
      console.error('Corpus search failed:', error)
      alert('Fehler bei der Corpus-Suche')
    } finally {
      setSearchingCorpus(false)
    }
  }

  const addExampleFromCorpus = async (sentence) => {
    try {
      const response = await fetch('/api/dictionary/add-example', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry_id: entry.id,
          meaning_id: entry.dictionary_meanings?.[0]?.id,
          halunder_sentence: sentence.halunder_sentence,
          german_sentence: sentence.german_sentence,
          source_reference: `${sentence.source} (${sentence.author || 'Unbekannt'})`
        })
      })
      
      if (response.ok) {
        alert('Beispiel erfolgreich hinzugefügt!')
        window.location.reload()
      } else {
        const error = await response.json()
        alert('Fehler: ' + (error.error || 'Unbekannter Fehler'))
      }
    } catch (error) {
      console.error('Failed to add example:', error)
      alert('Fehler beim Hinzufügen des Beispiels')
    }
  }

  return (
    <div style={{ 
      marginBottom: '30px', 
      padding: '20px', 
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      {/* Entry Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>
            {entry.halunder_word}
            {entry.word_type && (
              <span style={{ 
                fontSize: '14px', 
                marginLeft: '10px', 
                color: '#6c757d',
                fontStyle: 'italic' 
              }}>
                {entry.word_type}
              </span>
            )}
          </h3>
          {entry.pronunciation && (
            <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '5px' }}>
              [{entry.pronunciation}]
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {!isEditing && (
            <>
              <button
                onClick={searchCorpus}
                disabled={searchingCorpus}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: searchingCorpus ? 'not-allowed' : 'pointer',
                  opacity: searchingCorpus ? 0.6 : 1
                }}
              >
                {searchingCorpus ? 'Suche...' : 'Im Corpus suchen'}
              </button>
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Bearbeiten
              </button>
            </>
          )}
        </div>
      </div>

      {/* Meanings Section */}
      <div style={{ marginBottom: '15px' }}>
        <h4 style={{ marginBottom: '10px', color: '#495057' }}>Bedeutungen:</h4>
        {isEditing ? (
          <div>
            {meanings.map((meaning, index) => (
              <div key={meaning.id || index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <span style={{ width: '30px', textAlign: 'right', paddingTop: '5px' }}>
                  {index + 1}.
                </span>
                <input
                  type="text"
                  value={meaning.text || ''}
                  onChange={(e) => updateMeaning(index, e.target.value)}
                  placeholder="Deutsche Bedeutung"
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px'
                  }}
                />
                {meanings.length > 1 && (
                  <button
                    onClick={() => removeMeaning(index)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Löschen
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addMeaning}
              style={{
                marginTop: '10px',
                padding: '6px 12px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              + Bedeutung hinzufügen
            </button>
          </div>
        ) : (
          <ol style={{ margin: '0', paddingLeft: '20px' }}>
            {meanings.length > 0 ? (
              meanings.map((meaning, index) => (
                <li key={meaning.id || index} style={{ marginBottom: '5px' }}>
                  {meaning.text}
                  {meaning.context && (
                    <span style={{ color: '#6c757d', fontSize: '14px', marginLeft: '5px' }}>
                      ({meaning.context})
                    </span>
                  )}
                </li>
              ))
            ) : (
              <li style={{ color: '#6c757d', fontStyle: 'italic' }}>Keine Bedeutungen eingetragen</li>
            )}
          </ol>
        )}
      </div>

      {/* Examples Section */}
      {entry.dictionary_examples && entry.dictionary_examples.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <h4 style={{ marginBottom: '10px', color: '#495057' }}>Beispiele:</h4>
          {entry.dictionary_examples.map((example, index) => (
            <div key={example.id || index} style={{ 
              marginBottom: '10px', 
              padding: '10px',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              <div style={{ marginBottom: '5px' }}>
                <strong>Halunder:</strong> {example.halunder_sentence}
              </div>
              <div style={{ marginBottom: '5px' }}>
                <strong>Deutsch:</strong> {example.german_sentence}
              </div>
              {example.source_reference && (
                <div style={{ fontSize: '12px', color: '#6c757d' }}>
                  Quelle: {example.source_reference}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Additional Info */}
      {(entry.etymology || entry.additional_info) && !isEditing && (
        <div style={{ 
          marginTop: '15px', 
          paddingTop: '15px', 
          borderTop: '1px solid #dee2e6',
          fontSize: '14px',
          color: '#6c757d'
        }}>
          {entry.etymology && (
            <div style={{ marginBottom: '5px' }}>
              <strong>Etymologie:</strong> {entry.etymology}
            </div>
          )}
          {entry.additional_info && (
            <div>
              <strong>Zusätzliche Info:</strong> {entry.additional_info}
            </div>
          )}
        </div>
      )}

      {/* Edit Actions */}
      {isEditing && (
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid #dee2e6'
        }}>
          <button
            onClick={handleSave}
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
            onClick={handleCancel}
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
      )}

      {/* Corpus Search Results Modal */}
      {showCorpusSearch && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            width: '80%',
            maxWidth: '800px',
            maxHeight: '80vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #dee2e6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0 }}>Corpus-Suchergebnisse</h3>
              <button
                onClick={() => setShowCorpusSearch(false)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Schließen
              </button>
            </div>
            
            <div style={{
              flex: 1,
              padding: '20px',
              overflowY: 'auto'
            }}>
              {corpusSentences.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#6c757d' }}>
                  Keine Sätze im Corpus gefunden.
                </p>
              ) : (
                corpusSentences.map((sentence, index) => (
                  <div key={sentence.id || index} style={{
                    marginBottom: '15px',
                    padding: '15px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px'
                  }}>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Halunder:</strong>
                      <div 
                        dangerouslySetInnerHTML={{ __html: sentence.halunder_highlighted || sentence.halunder_sentence }}
                        style={{ marginTop: '4px' }}
                      />
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Deutsch:</strong>
                      <div 
                        dangerouslySetInnerHTML={{ __html: sentence.german_highlighted || sentence.german_sentence }}
                        style={{ marginTop: '4px' }}
                      />
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginTop: '10px'
                    }}>
                      <span style={{ fontSize: '12px', color: '#6c757d' }}>
                        {sentence.source} {sentence.author && `(${sentence.author})`}
                      </span>
                      <button
                        onClick={() => addExampleFromCorpus(sentence)}
                        style={{
                          padding: '4px 12px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Als Beispiel hinzufügen
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
