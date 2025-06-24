'use client'

import { useState } from 'react'

export default function DictionaryEntry({ entry, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedEntry, setEditedEntry] = useState(entry)

  const handleSave = async () => {
    try {
      const response = await fetch('/api/dictionary/entry', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedEntry)
      })
      
      if (response.ok) {
        const data = await response.json()
        onUpdate(data.entry)
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Failed to update entry:', error)
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

  const getGenderLabel = (gender) => {
    const genderMap = {
      'M': 'maskulin',
      'F': 'feminin',
      'N': 'neutral'
    }
    return genderMap[gender] || gender
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
          <div>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '32px' }}>
              {isEditing ? (
                <input
                  type="text"
                  value={editedEntry.halunder_word}
                  onChange={(e) => setEditedEntry({...editedEntry, halunder_word: e.target.value})}
                  style={{ fontSize: '28px', padding: '4px' }}
                />
              ) : (
                entry.halunder_word
              )}
            </h2>
            
            {entry.pronunciation && (
              <div style={{ fontSize: '18px', color: '#666', marginBottom: '5px' }}>
                [{entry.pronunciation}]
              </div>
            )}
            
            <div style={{ fontSize: '16px', color: '#495057', marginBottom: '5px' }}>
              {getWordTypeLabel(entry.word_type)}
              {entry.gender && `, ${getGenderLabel(entry.gender)}`}
            </div>
            
            {entry.plural_form && (
              <div style={{ fontSize: '14px', color: '#6c757d' }}>
                Plural: {entry.plural_form}
                {entry.plural_pronunciation && ` [${entry.plural_pronunciation}]`}
              </div>
            )}
          </div>
          
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: isEditing ? '#28a745' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {isEditing ? 'Speichern' : 'Bearbeiten'}
          </button>
        </div>
      </div>

      {/* Main meaning */}
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
              value={editedEntry.german_meaning || editedEntry.dictionary_meanings?.[0]?.german_meaning || ''}
              onChange={(e) => setEditedEntry({...editedEntry, german_meaning: e.target.value})}
              style={{ width: '100%', minHeight: '60px', padding: '8px' }}
            />
          ) : (
            entry.dictionary_meanings?.[0]?.german_meaning || 
            entry.german_meaning || 
            'Keine Bedeutung eingetragen'
          )}
        </div>
      </div>

      {/* Additional Info */}
      {entry.additional_info && (
        <div style={{
          padding: '15px',
          backgroundColor: '#e7f3ff',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <strong>Zusätzliche Informationen:</strong>
          <div style={{ marginTop: '10px' }}>{entry.additional_info}</div>
        </div>
      )}

      {/* Usage notes */}
      {(entry.usage || entry.idioms) && (
        <div style={{
          padding: '15px',
          backgroundColor: '#fff3cd',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          {entry.usage && (
            <div style={{ marginBottom: '10px' }}>
              <strong>Gebrauch:</strong> {entry.usage}
            </div>
          )}
          {entry.idioms && (
            <div>
              <strong>Redewendungen:</strong> {entry.idioms}
            </div>
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

      {/* References */}
      {entry.references && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f0f0f0',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <strong>Verweise:</strong> {entry.references}
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

      {/* Alternative forms */}
      {entry.alternative_forms && entry.alternative_forms.length > 0 && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <strong>Alternative Formen:</strong>
          <div style={{ marginTop: '5px' }}>
            {entry.alternative_forms.join(', ')}
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
