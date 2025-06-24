'use client'

import { useState } from 'react'

export default function AddEntryModal({ onClose, onSave }) {
  const [entry, setEntry] = useState({
    halunder_word: '',
    german_word: '',
    pronunciation: '',
    word_type: 'noun',
    gender: '',
    plural_form: '',
    etymology: '',
    meanings: [{
      german_meaning: '',
      examples: []
    }]
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/dictionary/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      })
      
      if (response.ok) {
        const data = await response.json()
        onSave(data.entry)
      }
    } catch (error) {
      console.error('Failed to create entry:', error)
    }
  }

  return (
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
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <h2 style={{ marginBottom: '20px' }}>Neuer Wörterbucheintrag</h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Halunder Wort *
            </label>
            <input
              type="text"
              value={entry.halunder_word}
              onChange={(e) => setEntry({...entry, halunder_word: e.target.value})}
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Deutsche Übersetzung
            </label>
            <input
              type="text"
              value={entry.german_word}
              onChange={(e) => setEntry({...entry, german_word: e.target.value})}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Bedeutung *
            </label>
            <textarea
              value={entry.meanings[0].german_meaning}
              onChange={(e) => setEntry({
                ...entry,
                meanings: [{...entry.meanings[0], german_meaning: e.target.value}]
              })}
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                minHeight: '60px'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Wortart
            </label>
            <select
              value={entry.word_type}
              onChange={(e) => setEntry({...entry, word_type: e.target.value})}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            >
              <option value="noun">Substantiv</option>
              <option value="verb">Verb</option>
              <option value="adjective">Adjektiv</option>
              <option value="adverb">Adverb</option>
              <option value="pronoun">Pronomen</option>
              <option value="preposition">Präposition</option>
              <option value="conjunction">Konjunktion</option>
              <option value="interjection">Interjektion</option>
            </select>
          </div>
          
          {entry.word_type === 'noun' && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Geschlecht
              </label>
              <select
                value={entry.gender}
                onChange={(e) => setEntry({...entry, gender: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <option value="">Wählen...</option>
                <option value="M">Maskulin</option>
                <option value="F">Feminin</option>
                <option value="N">Neutral</option>
              </select>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '10px',
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
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px',
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
        </form>
      </div>
    </div>
  )
}
