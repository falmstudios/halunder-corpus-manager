'use client'

import { useState } from 'react'

export default function AddEntryModal({ onClose, onSave }) {
  const [entry, setEntry] = useState({
    halunder_word: '',
    german_word: '',
    pronunciation: '',
    word_type: '',
    word_gender: '',
    etymology: '',
    usage_notes: '',
    source: ''
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!entry.halunder_word || !entry.german_word) {
      alert('Halunder-Wort und deutsche Übersetzung sind erforderlich')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/dictionary/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      })

      if (response.ok) {
        onSave()
      } else {
        const error = await response.json()
        alert('Fehler beim Erstellen: ' + error.error)
      }
    } catch (error) {
      alert('Fehler beim Erstellen: ' + error.message)
    } finally {
      setSaving(false)
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
        borderRadius: '8px',
        padding: '30px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <h2 style={{ marginTop: 0 }}>Neuer Wörterbuch-Eintrag</h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Halunder-Wort *
            </label>
            <input
              type="text"
              value={entry.halunder_word}
              onChange={(e) => setEntry({...entry, halunder_word: e.target.value})}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Deutsche Übersetzung *
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
              required
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Aussprache
            </label>
            <input
              type="text"
              value={entry.pronunciation}
              onChange={(e) => setEntry({...entry, pronunciation: e.target.value})}
              placeholder="[a.larsédan]"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
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
                <option value="">-- Auswählen --</option>
                <option value="noun">Substantiv</option>
                <option value="verb">Verb</option>
                <option value="adjective">Adjektiv</option>
                <option value="adverb">Adverb</option>
                <option value="pronoun">Pronomen</option>
                <option value="preposition">Präposition</option>
                <option value="conjunction">Konjunktion</option>
                <option value="interjection">Interjektion</option>
                <option value="numeral">Zahlwort</option>
                <option value="proper noun">Eigenname</option>
              </select>
            </div>

            {entry.word_type === 'noun' && (
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>
                  Geschlecht
                </label>
                <select
                  value={entry.word_gender}
                  onChange={(e) => setEntry({...entry, word_gender: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                >
                  <option value="">-- Auswählen --</option>
                  <option value="M">Maskulinum (der)</option>
                  <option value="F">Femininum (die)</option>
                  <option value="N">Neutrum (das)</option>
                </select>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Etymologie
            </label>
            <textarea
              value={entry.etymology}
              onChange={(e) => setEntry({...entry, etymology: e.target.value})}
              rows={2}
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
              Verwendungshinweise
            </label>
            <textarea
              value={entry.usage_notes}
              onChange={(e) => setEntry({...entry, usage_notes: e.target.value})}
              rows={2}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Quelle
            </label>
            <input
              type="text"
              value={entry.source}
              onChange={(e) => setEntry({...entry, source: e.target.value})}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '10px 20px',
                backgroundColor: saving ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              {saving ? 'Speichern...' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
