'use client'

import { useState, useEffect } from 'react'

export default function DictionaryEntry({ entry, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedEntry, setEditedEntry] = useState(entry)
  const [meanings, setMeanings] = useState([])
  const [showCorpusSearch, setShowCorpusSearch] = useState(false)
  const [corpusSentences, setCorpusSentences] = useState([])
  const [searchingCorpus, setSearchingCorpus] = useState(false)

  // Initialize meanings from entry data
  useEffect(() => {
    if (entry) {
      // Extract meanings from various sources
      const extractedMeanings = []
      
      // From dictionary_meanings
      if (entry.dictionary_meanings?.length > 0) {
        entry.dictionary_meanings.forEach(m => {
          if (m.german_meaning) {
            extractedMeanings.push({
              id: m.id,
              text: m.german_meaning,
              context: m.context
            })
          }
        })
      }
      
      // From german_word field
      if (entry.german_word && !extractedMeanings.find(m => m.text === entry.german_word)) {
        extractedMeanings.push({
          id: 'main',
          text: entry.german_word,
          context: null
        })
      }
      
      // From additional_info if it contains numbered meanings
      if (entry.additional_info && entry.additional_info.includes('1.')) {
        const additionalMeanings = entry.additional_info.split(/\d+\.\s*/).filter(m => m.trim())
        additionalMeanings.forEach((meaning, index) => {
          if (!extractedMeanings.find(m => m.text === meaning.trim())) {
            extractedMeanings.push({
              id: `add_${index}`,
              text: meaning.trim(),
              context: null
            })
          }
        })
      }
      
      setMeanings(extractedMeanings.length > 0 ? extractedMeanings : [{ id: 'new', text: '', context: null }])
      setEditedEntry(entry)
    }
  }, [entry])

  // Reset when entry changes
  useEffect(() => {
    setIsEditing(false)
    setShowCorpusSearch(false)
  }, [entry?.id])

  const handleSave = async () => {
    try {
      // Prepare meanings for saving
      const germanWords = meanings.map(m => m.text).filter(t => t.trim())
      const primaryGermanWord = germanWords[0] || ''
      
      // Update the entry
      const response = await fetch('/api/dictionary/entry', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editedEntry.id,
          halunder_word: editedEntry.halunder_word,
          german_word: primaryGermanWord,
          pronunciation: editedEntry.pronunciation,
          word_type: editedEntry.word_type,
          gender: editedEntry.gender,
          plural_form: editedEntry.plural_form,
          etymology: editedEntry.etymology,
          additional_info: editedEntry.additional_info,
          meanings: meanings
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        alert('Erfolgreich gespeichert!')
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
        setShowCorpusSearch(false)
        // Reload to show new example
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to add example:', error)
      alert('Fehler beim Hinzufügen des Beispiels')
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
                entry.halunder_word
              )}
            </h2>

            {/* German translations */}
            <div style={{ marginBottom: '15px' }}>
              {isEditing ? (
                <div>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                    Deutsche Bedeutungen:
                  </label>
                  {meanings.map((meaning, index) => (
                    <div key={meaning.id} style={{ display: 'flex', gap: '10px', marginBottom: '5px' }}>
                      <input
                        type="text"
                        value={meaning.text}
                        onChange={(e) => updateMeaning(index, e.target.value)}
                        placeholder={`Bedeutung ${index + 1}`}
                        style={{ 
                          flex: 1, 
                          padding: '6px', 
                          fontSize: '16px',
                          border: '1px solid #ddd',
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
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addMeaning}
                    style={{
                      marginTop: '5px',
                      padding: '6px 12px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    + Bedeutung hinzufügen
                  </button>
                </div>
              ) : (
                meanings.filter(m => m.text.trim()).map((meaning, index) => (
                  <div key={meaning.id} style={{ 
                    fontSize: '20px', 
                    color: '#495057', 
                    marginBottom: '5px' 
                  }}>
                    = {meaning.text}
                    {entry.gender && entry.word_type === 'noun' && index === 0 && (
                      <span style={{ marginLeft: '8px' }}>
                        , {getArticle(entry.gender)}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
            
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
                  disabled={searchingCorpus}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    opacity: searchingCorpus ? 0.6 : 1
                  }}
                >
                  {searchingCorpus ? 'Suche...' : 'Im Corpus suchen'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Additional sections remain the same... */}
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
      {(entry.dictionary_examples?.length > 0) && (
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '15px' }}>Beispiele</h3>
          
          {entry.dictionary_examples.map((example, index) => (
            <div key={example.id || index} style={{
              padding: '15px',
              backgroundColor: '#fff',
              border: '1px solid #ddd',
              borderRadius: '8px',
              marginBottom: '10px'
            }}>
              <div style={{ marginBottom: '8px' }}>
                <strong>Halunder:</strong> {example.halunder_sentence}
              </div>
              <div>
                <strong>Deutsch:</strong> {example.german_sentence}
              </div>
              {example.source_reference && (
                <div style={{ 
                  marginTop: '8px', 
                  fontSize: '12px', 
                  color: '#666',
                  fontStyle: 'italic'
                }}>
                  Quelle: {example.source_reference}
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
            maxWidth: '900px',
            width: '90%',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: 0 }}>
                Corpus-Suche für "{entry.halunder_word}"
                {meanings.length > 0 && meanings[0].text && ` / "${meanings.map(m => m.text).filter(t => t).join(', ')}"`}
              </h3>
              <button
                onClick={() => setShowCorpusSearch(false)}
                style={{
                  padding: '5px 15px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '20px'
                }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ 
              flex: 1, 
              overflow: 'auto',
              border: '1px solid #eee',
              borderRadius: '4px',
              padding: '10px'
            }}>
              {corpusSentences.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
                  Keine passenden Sätze im Corpus gefunden.
                </p>
              ) : (
                <div>
                  <p style={{ marginBottom: '15px', color: '#666' }}>
                    {corpusSentences.length} Treffer gefunden:
                  </p>
                  {corpusSentences.map((sentence, index) => (
                    <div key={index} style={{
                      padding: '15px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      marginBottom: '10px',
                      backgroundColor: '#f8f9fa'
                    }}>
                      <div style={{ marginBottom: '8px' }}>
                        <strong>Halunder:</strong> 
                        <span dangerouslySetInnerHTML={{ __html: sentence.halunder_highlighted }} />
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <strong>Deutsch:</strong> 
                        <span dangerouslySetInnerHTML={{ __html: sentence.german_highlighted }} />
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#666',
                        fontStyle: 'italic',
                        marginBottom: '8px'
                      }}>
                        Quelle: {sentence.source} {sentence.author && `(${sentence.author})`}
                      </div>
                      <button
                        onClick={() => addExampleFromCorpus(sentence)}
                        style={{
                          padding: '5px 15px',
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
                  ))}
                </div>
              )}
            </div>
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
