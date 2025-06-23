'use client'

import { useState } from 'react'

export default function DictionaryEntry({ entry, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState(entry)

  const handleSave = async () => {
    try {
      const response = await fetch('/api/dictionary/entry', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      })
      
      if (response.ok) {
        setIsEditing(false)
        onUpdate()
      }
    } catch (error) {
      console.error('Failed to save entry:', error)
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '20px'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '32px' }}>
            {entry.halunder_word}
            {entry.pronunciation && (
              <span style={{ 
                fontSize: '18px', 
                color: '#666',
                marginLeft: '10px',
                fontFamily: 'monospace'
              }}>
                [{entry.pronunciation}]
              </span>
            )}
          </h2>
          
          <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
            {entry.word_type && (
              <span style={{
                padding: '4px 8px',
                backgroundColor: '#e9ecef',
                borderRadius: '4px',
                fontSize: '14px'
              }}>
                {entry.word_type}
              </span>
            )}
            
            {entry.gender && (
              <span style={{
                padding: '4px 8px',
                backgroundColor: '#d1ecf1',
                borderRadius: '4px',
                fontSize: '14px'
              }}>
                {entry.gender}
              </span>
            )}
            
            {entry.source && (
              <span style={{
                padding: '4px 8px',
                backgroundColor: '#fff3cd',
                borderRadius: '4px',
                fontSize: '14px'
              }}>
                {entry.source}
              </span>
            )}
            
            {entry.frequency > 0 && (
              <span style={{
                padding: '4px 8px',
                backgroundColor: '#d4edda',
                borderRadius: '4px',
                fontSize: '14px'
              }}>
                {entry.frequency}x im Corpus
              </span>
            )}
          </div>
        </div>
        
        <button
          onClick={() => setIsEditing(!isEditing)}
          style={{
            padding: '8px 16px',
            backgroundColor: isEditing ? '#dc3545' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {isEditing ? 'Abbrechen' : 'Bearbeiten'}
        </button>
      </div>

      {/* Additional Info */}
      {(entry.plural_form || entry.etymology) && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          {entry.plural_form && (
            <div style={{ marginBottom: '10px' }}>
              <strong>Plural:</strong> {entry.plural_form}
            </div>
          )}
          
          {entry.etymology && (
            <div>
              <strong>Herkunft:</strong> {entry.etymology}
            </div>
          )}
        </div>
      )}

      {/* Verb Details */}
      {entry.dictionary_verb_details?.length > 0 && (
        <div style={{
          padding: '15px',
          backgroundColor: '#e7f3ff',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h4 style={{ margin: '0 0 10px 0' }}>Verbformen</h4>
          {entry.dictionary_verb_details.map((detail, index) => (
            <div key={index}>
              {detail.verb_class} {detail.conjugation_class && `(${detail.conjugation_class})`}
            </div>
          ))}
        </div>
      )}

      {/* Meanings */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '15px' }}>Bedeutungen</h3>
        
        {entry.dictionary_meanings?.map((meaning, index) => (
          <div key={meaning.id} style={{
            padding: '20px',
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderRadius: '8px',
            marginBottom: '15px'
          }}>
            {meaning.meaning_number && (
              <div style={{
                display: 'inline-block',
                width: '30px',
                height: '30px',
                backgroundColor: '#007bff',
                color: 'white',
                borderRadius: '50%',
                textAlign: 'center',
                lineHeight: '30px',
                marginRight: '10px',
                fontWeight: 'bold'
              }}>
                {meaning.meaning_number}
              </div>
            )}
            
            <div style={{ display: 'inline-block', verticalAlign: 'top', width: 'calc(100% - 50px)' }}>
              {meaning.context && (
                <span style={{
                  fontStyle: 'italic',
                  color: '#666',
                  marginRight: '10px'
                }}>
                  ({meaning.context})
                </span>
              )}
              
              <strong>{meaning.german_meaning || meaning.halunder_meaning}</strong>
            </div>
          </div>
        ))}
      </div>

      {/* Examples */}
      {entry.dictionary_examples?.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '15px' }}>Beispiele</h3>
          
          {entry.dictionary_examples.map((example, index) => (
            <div key={example.id} style={{
              padding: '15px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              marginBottom: '10px'
            }}>
              <div style={{ marginBottom: '5px' }}>
                <strong>Halunder:</strong> {example.halunder_sentence}
              </div>
              <div>
                <strong>Deutsch:</strong> {example.german_sentence}
              </div>
              {example.source_reference && (
                <div style={{ 
                  marginTop: '5px', 
                  fontSize: '12px', 
                  color: '#666' 
                }}>
                  Quelle: {example.source_reference}
                </div>
              )}
              {example.corpus_text && (
                <div style={{ 
                  marginTop: '5px', 
                  fontSize: '12px', 
                  color: '#007bff',
                  cursor: 'pointer'
                }}>
                  → Aus Text: "{example.corpus_text.title}" von {example.corpus_text.author}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* References */}
      {entry.dictionary_references?.length > 0 && (
        <div>
          <h3 style={{ marginBottom: '15px' }}>Verweise</h3>
          
          {entry.dictionary_references.map((ref) => (
            <div key={ref.id} style={{ marginBottom: '10px' }}>
              <span style={{
                padding: '4px 8px',
                backgroundColor: '#e9ecef',
                borderRadius: '4px',
                fontSize: '12px',
                marginRight: '10px'
              }}>
                {ref.reference_type}
              </span>
              <a 
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  // Navigate to referenced entry
                }}
                style={{ color: '#007bff', textDecoration: 'none' }}
              >
                {ref.referenced_entry.halunder_word}
                {ref.referenced_entry.german_word && ` (${ref.referenced_entry.german_word})`}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
