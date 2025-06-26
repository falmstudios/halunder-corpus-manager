'use client'

import { useState } from 'react'

export default function DictionaryEntry({ entry, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedEntry, setEditedEntry] = useState(entry)
  const [isSaving, setIsSaving] = useState(false)

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

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/dictionary/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedEntry)
      })

      if (response.ok) {
        const data = await response.json()
        onUpdate(data.entry)
        setIsEditing(false)
      } else {
        const error = await response.json()
        alert('Fehler beim Speichern: ' + error.error)
      }
    } catch (error) {
      alert('Fehler beim Speichern: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSearchInCorpus = () => {
    window.open(`/corpus?search=${encodeURIComponent(entry.halunder_word)}`, '_blank')
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* Header with title and buttons */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '20px'
      }}>
        <div>
          <h2 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>
            {entry.halunder_word}
            {entry.pronunciation && (
              <span style={{ 
                fontSize: '18px', 
                color: '#666', 
                marginLeft: '10px',
                fontStyle: 'italic'
              }}>
                [{entry.pronunciation}]
              </span>
            )}
          </h2>
          <div style={{ fontSize: '16px', color: '#666' }}>
            {entry.word_type && getWordTypeLabel(entry.word_type)}
            {entry.word_gender && ` (${getArticle(entry.word_gender)})`}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleSearchInCorpus}
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
          
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  opacity: isSaving ? 0.6 : 1
                }}
              >
                {isSaving ? 'Speichern...' : 'Speichern'}
              </button>
              <button
                onClick={() => {
                  setEditedEntry(entry)
                  setIsEditing(false)
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
                Abbrechen
              </button>
            </>
          ) : (
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
          )}
        </div>
      </div>

      {/* German Translation */}
      <div style={{ 
        marginBottom: '25px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#495057' }}>
          Deutsche Übersetzung
        </h3>
        {isEditing ? (
          <input
            type="text"
            value={editedEntry.german_word || ''}
            onChange={(e) => setEditedEntry({...editedEntry, german_word: e.target.value})}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '16px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        ) : (
          <div style={{ fontSize: '18px', fontWeight: '500' }}>
            {entry.german_word || 'Keine Übersetzung vorhanden'}
          </div>
        )}
      </div>

      {/* Meanings */}
      {entry.dictionary_meanings && entry.dictionary_meanings.length > 0 && (
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ marginBottom: '15px', color: '#2c3e50' }}>Bedeutungen</h3>
          {entry.dictionary_meanings
            .sort((a, b) => a.meaning_number - b.meaning_number)
            .map((meaning, index) => (
              <div 
                key={meaning.id} 
                style={{ 
                  marginBottom: '15px',
                  padding: '15px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  borderLeft: '4px solid #007bff'
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                  {meaning.meaning_number || index + 1}.
                </div>
                <div style={{ marginBottom: '8px' }}>
                  {meaning.definition}
                </div>
                {meaning.context && (
                  <div style={{ fontSize: '14px', color: '#666', fontStyle: 'italic' }}>
                    Kontext: {meaning.context}
                  </div>
                )}
                {meaning.usage_notes && (
                  <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                    Hinweise: {meaning.usage_notes}
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      {/* Additional Information */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Etymology */}
        {entry.etymology && (
          <div style={{ 
            padding: '15px',
            backgroundColor: '#fff3cd',
            borderRadius: '8px',
            border: '1px solid #ffeaa7'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>Etymologie</h4>
            <p style={{ margin: 0, color: '#856404' }}>{entry.etymology}</p>
          </div>
        )}

        {/* Usage Notes */}
        {entry.usage_notes && (
          <div style={{ 
            padding: '15px',
            backgroundColor: '#d1ecf1',
            borderRadius: '8px',
            border: '1px solid #bee5eb'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#0c5460' }}>Verwendungshinweise</h4>
            <p style={{ margin: 0, color: '#0c5460' }}>{entry.usage_notes}</p>
          </div>
        )}
      </div>

      {/* Source */}
      {entry.source && (
        <div style={{ 
          marginTop: '20px',
          padding: '10px',
          backgroundColor: '#e9ecef',
          borderRadius: '4px',
          fontSize: '14px',
          color: '#495057'
        }}>
          <strong>Quelle:</strong> {entry.source}
        </div>
      )}

      {/* Metadata */}
      <div style={{ 
        marginTop: '20px',
        paddingTop: '20px',
        borderTop: '1px solid #dee2e6',
        fontSize: '12px',
        color: '#6c757d'
      }}>
        {entry.created_at && (
          <div>Erstellt: {new Date(entry.created_at).toLocaleDateString('de-DE')}</div>
        )}
        {entry.updated_at && (
          <div>Aktualisiert: {new Date(entry.updated_at).toLocaleDateString('de-DE')}</div>
        )}
      </div>
    </div>
  )
}
