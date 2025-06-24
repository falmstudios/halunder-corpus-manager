'use client'

import { useState, useEffect } from 'react'

export default function DictionaryEntry({ entry, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedEntry, setEditedEntry] = useState(entry)
  const [showCorpusSearch, setShowCorpusSearch] = useState(false)
  const [corpusSentences, setCorpusSentences] = useState([])
  const [searchingCorpus, setSearchingCorpus] = useState(false)

  // Reset editing state when entry changes
  useEffect(() => {
    setIsEditing(false)
    setEditedEntry(entry)
    setShowCorpusSearch(false)
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
    setSearchingCorpus(true)
    setCorpusSentences([])
    try {
      // Include German word if available for better search
      let url = `/api/corpus-search?word=${encodeURIComponent(entry.halunder_word)}`
      if (entry.german_word) {
        url += `&german=${encodeURIComponent(entry.german_word)}`
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
      // Add the sentence as an example to this dictionary entry
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
        alert('Beispiel hinzugefügt!')
        // Reload the entry to show the new example
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
                entry.halunder_word
              )}
            </h2>

            {/* German translation with article */}
            {(entry.german_word || entry.dictionary_meanings?.[0]?.german_meaning) && (
              <div style={{ fontSize: '20px', color: '#495057', marginBottom: '10px' }}>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedEntry.german_word || ''}
                    onChange={(e) => setEditedEntry({...editedEntry, german_word: e.target.value})}
                    style={{ fontSize: '18px', padding: '4px' }}
                    placeholder="Deutsche Übersetzung"
                  />
                ) : (
                  <>
                    = {entry.german_word || entry.dictionary_meanings?.[0]?.german_meaning}
                    {entry.gender && entry.word_type === 'noun' && (
                      <span style={{ marginLeft: '8px' }}>
                        , {getArticle(entry.gender)}
                      </span>
                    )}
                  </>
                )}
              </div>
            )}
            
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

      {/* Main meaning or multiple meanings */}
      {!additionalMeanings.length && entry.dictionary_meanings?.[0]?.german_meaning && (
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '15px', color: '#333' }}>Bedeutung</h3>
          <div style={{ 
            fontSize: '18px', 
            lineHeight: '1.6',
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            {isEditing ? (
              <textarea
                value={editedEntry.dictionary_meanings?.[0]?.german_meaning || ''}
                onChange={(e) => {
                  const newMeanings = [...(editedEntry.dictionary_meanings || [{ german_meaning: '' }])]
                  newMeanings[0] = {...newMeanings[0], german_meaning: e.target.value}
                  setEditedEntry({...editedEntry, dictionary_meanings: newMeanings})
                }}
                style={{ width: '100%', minHeight: '60px', padding: '8px' }}
              />
            ) : (
              entry.dictionary_meanings[0].german_meaning
            )}
          </div>
        </div>
      )}

      {/* Additional Info with multiple meanings */}
      {entry.additional_info && (
        <div style={{
          padding: '15px',
          backgroundColor: '#e7f3ff',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          {additionalMeanings.length > 0 ? (
            <>
              <strong>Bedeutungen:</strong>
              <ol style={{ margin: '10px 0 0 0', paddingLeft: '25px' }}>
                {additionalMeanings.map((meaning, index) => (
                  <li key={index} style={{ 
                    marginBottom: '10px',
                    fontSize: '16px',
                    lineHeight: '1.6'
                  }}>
                    {meaning.text}
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <>
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
            </>
          )}
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
                {entry.german_word && ` / "${entry.german_word}"`}
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
                  Keine Sätze mit dem vollständigen Wort "{entry.halunder_word}" im Corpus gefunden.
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
