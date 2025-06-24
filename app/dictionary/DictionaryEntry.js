'use client'

import { useState, useEffect } from 'react'

export default function DictionaryEntry({ entry, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedEntry, setEditedEntry] = useState(entry)
  const [showCorpusSearch, setShowCorpusSearch] = useState(false)
  const [corpusSentences, setCorpusSentences] = useState([])

  // Reset editing state when entry changes
  useEffect(() => {
    setIsEditing(false)
    setEditedEntry(entry)
  }, [entry?.id])

  const handleSave = async () => {
    try {
      const response = await fetch('/api/dictionary/entry', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editedEntry.id,
          halunder_word: editedEntry.halunder_word,
          german_word: editedEntry.german_word,
          pronunciation: editedEntry.pronunciation,
          word_type: editedEntry.word_type,
          gender: editedEntry.gender,
          plural_form: editedEntry.plural_form,
          etymology: editedEntry.etymology,
          additional_info: editedEntry.additional_info
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        onUpdate(data.entry)
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Failed to update entry:', error)
      alert('Fehler beim Speichern')
    }
  }

  const handleCancel = () => {
    setEditedEntry(entry)
    setIsEditing(false)
  }

  const searchCorpus = async () => {
    try {
      const response = await fetch(`/api/corpus-search?word=${encodeURIComponent(entry.halunder_word)}`)
      const data = await response.json()
      setCorpusSentences(data.sentences || [])
      setShowCorpusSearch(true)
    } catch (error) {
      console.error('Corpus search failed:', error)
    }
  }

  const getWordTypeLabel = (type) => {
    const typeMap = {
      'noun': 'Substantiv',
      'verb': 'Verb',
      'verb (weak)': 'Verb (schwach)',
      'verb (strong)': 'Verb (stark)',
      'adjective': 'Adjektiv',
      'adverb': 'Adverb',
      'pronoun': 'Pronomen',
      'preposition': 'Präposition',
      'conjunction': 'Konjunktion',
      'interjection': 'Interjektion',
      'numeral': 'Zahlwort',
      'proper noun': 'Eigenname'
    }
    return typeMap[type] || type
  }

  const getArticle = (gender) => {
    const articleMap = {
      'M': 'der',
      'F': 'die',
      'N': 'das'
    }
    return articleMap[gender] || ''
  }

  if (!entry) return null

  // Parse additional_info to extract multiple meanings if stored there
  const extractMeanings = () => {
    if (entry.additional_info && entry.additional_info.includes('1.')) {
      // Parse numbered meanings from additional_info
      const meanings = entry.additional_info.split(/\d+\.\s*/).filter(m => m.trim())
      return meanings.map((meaning, index) => ({
        number: index + 1,
        text: meaning.trim()
      }))
    }
    return []
  }

  const additionalMeanings = extractMeanings()

  return (
    <div>
      <div style={{ 
        marginBottom: '30px',
        borderBottom: '2px solid #e9ecef',
        paddingBottom: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '32px' }}>
              {isEditing ? (
                <input
                  type="text"
                  value={editedEntry.halunder_word}
                  onChange={(e) => setEditedEntry({...editedEntry, halunder_word: e.target.value})}
                  style={{ fontSize: '28px', padding: '4px', width: '100%' }}
                />
              ) : (
                <>
                  {entry.halunder_word}
                  {entry.gender && entry.word_type === 'noun' && (
                    <span style={{ 
                      fontSize: '24px', 
                      color: '#666', 
                      marginLeft: '10px' 
                    }}>
                      , {getArticle(entry.gender)}
                    </span>
                  )}
                </>
              )}
            </h2>
            
            {entry.pronunciation && (
              <div style={{ fontSize: '18px', color: '#666', marginBottom: '5px' }}>
                [{entry.pronunciation}]
              </div>
            )}
            
            <div style={{ fontSize: '16px', color: '#495057', marginBottom: '5px' }}>
              {getWordTypeLabel(entry.word_type)}
              {entry.gender && entry.word_type === 'noun' && `, ${entry.gender === 'M' ? 'maskulin' : entry.gender === 'F' ? 'feminin' : 'neutral'}`}
            </div>
            
            {entry.plural_form && (
              <div style={{ fontSize: '14px', color: '#6c757d' }}>
                Plural: {isEditing ? (
                  <input
                    type="text"
                    value={editedEntry.plural_form}
                    onChange={(e) => setEditedEntry({...editedEntry, plural_form: e.target.value})}
                    style={{ marginLeft: '5px' }}
                  />
                ) : (
                  entry.plural_form
                )}
                {entry.plural_pronunciation && ` [${entry.plural_pronunciation}]`}
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            {isEditing ? (
              <>
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
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Abbrechen
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Bearbeiten
                </button>
                <button
                  onClick={searchCorpus}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Im Corpus suchen
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main meaning or multiple meanings */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '15px', color: '#333' }}>Bedeutung{additionalMeanings.length > 1 ? 'en' : ''}</h3>
        
        {additionalMeanings.length > 0 ? (
          <ol style={{ margin: 0, paddingLeft: '25px' }}>
            {additionalMeanings.map((meaning, index) => (
              <li key={index} style={{ 
                marginBottom: '15px',
                fontSize: '16px',
                lineHeight: '1.6'
              }}>
                {meaning.text}
              </li>
            ))}
          </ol>
        ) : (
          <div style={{ 
            fontSize: '18px', 
            lineHeight: '1.6',
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            {isEditing ? (
              <textarea
                value={editedEntry.dictionary_meanings?.[0]?.german_meaning || editedEntry.german_meaning || ''}
                onChange={(e) => {
                  if (editedEntry.dictionary_meanings?.[0]) {
                    const newMeanings = [...editedEntry.dictionary_meanings]
                    newMeanings[0] = {...newMeanings[0], german_meaning: e.target.value}
                    setEditedEntry({...editedEntry, dictionary_meanings: newMeanings})
                  } else {
                    setEditedEntry({...editedEntry, german_meaning: e.target.value})
                  }
                }}
                style={{ width: '100%', minHeight: '60px', padding: '8px' }}
              />
            ) : (
              entry.dictionary_meanings?.[0]?.german_meaning || 
              entry.german_meaning || 
              'Keine Bedeutung eingetragen'
            )}
          </div>
        )}
      </div>

      {/* Additional Info */}
      {entry.additional_info && !additionalMeanings.length && (
        <div style={{
          padding: '15px',
          backgroundColor: '#e7f3ff',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <strong>Zusätzliche Informationen:</strong>
          <div style={{ marginTop: '10px', whiteSpace: 'pre-line' }}>
            {isEditing ? (
              <textarea
                value={editedEntry.additional_info}
                onChange={(e) => setEditedEntry({...editedEntry, additional_info: e.target.value})}
                style={{ width: '100%', minHeight: '100px', padding: '8px' }}
              />
            ) : (
              entry.additional_info
            )}
          </div>
        </div>
      )}

      {/* Etymology */}
      {entry.etymology && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <strong>Herkunft:</strong> {entry.etymology}
        </div>
      )}

      {/* Examples */}
      {(entry.dictionary_examples?.length > 0 || entry.examples?.length > 0) && (
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '15px' }}>Beispiele</h3>
          
          {(entry.dictionary_examples || entry.examples || []).map((example, index) => (
            <div key={example.id || index} style={{
              padding: '15px',
              backgroundColor: '#fff',
              border: '1px solid #ddd',
              borderRadius: '8px',
              marginBottom: '10px'
            }}>
              <div style={{ marginBottom: '8px' }}>
                <strong>Halunder:</strong> {example.halunder_sentence || example.halunder}
              </div>
              <div>
                <strong>Deutsch:</strong> {example.german_sentence || example.german}
              </div>
              {(example.source_reference || example.note) && (
                <div style={{ 
                  marginTop: '8px', 
                  fontSize: '12px', 
                  color: '#666',
                  fontStyle: 'italic'
                }}>
                  Quelle: {example.source_reference || example.note}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Corpus Search Modal */}
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
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3>Corpus-Suche für "{entry.halunder_word}"</h3>
            <div style={{ marginTop: '20px' }}>
              {corpusSentences.length === 0 ? (
                <p>Keine Sätze im Corpus gefunden.</p>
              ) : (
                corpusSentences.map((sentence, index) => (
                  <div key={index} style={{
                    padding: '15px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    marginBottom: '10px'
                  }}>
                    <div><strong>Halunder:</strong> {sentence.halunder_sentence}</div>
                    <div><strong>Deutsch:</strong> {sentence.german_sentence}</div>
                    <button
                      onClick={() => {
                        // Add to examples
                        console.log('Add to examples:', sentence)
                      }}
                      style={{
                        marginTop: '10px',
                        padding: '5px 10px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Als Beispiel hinzufügen
                    </button>
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => setShowCorpusSearch(false)}
              style={{
                marginTop: '20px',
                padding: '10px 20px',
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
        </div>
      )}

      {/* Source info */}
      <div style={{ 
        marginTop: '30px',
        paddingTop: '20px',
        borderTop: '1px solid #ddd',
        fontSize: '12px',
        color: '#6c757d'
      }}>
        <div>Quelle: {entry.source}</div>
        <div>Eingetragen: {new Date(entry.created_at).toLocaleDateString('de-DE')}</div>
      </div>
    </div>
  )
}
