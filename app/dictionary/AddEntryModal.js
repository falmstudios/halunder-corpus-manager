'use client'

import { useState } from 'react'

export default function AddEntryModal({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    halunder_word: '',
    german_word: '',
    pronunciation: '',
    word_type: '',
    gender: '',
    plural_form: '',
    etymology: '',
    source: 'manual',
    meanings: [{
      german_meaning: '',
      context: ''
    }],
    examples: [{
      halunder_sentence: '',
      german_sentence: ''
    }]
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/dictionary/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        onSave()
      } else {
        const error = await response.json()
        alert('Fehler: ' + error.message)
      }
    } catch (error) {
      console.error('Failed to save entry:', error)
      alert('Fehler beim Speichern')
    }
  }

  const addMeaning = () => {
    setFormData({
      ...formData,
      meanings: [...formData.meanings, { german_meaning: '', context: '' }]
    })
  }

  const addExample = () => {
    setFormData({
      ...formData,
      examples: [...formData.examples, { halunder_sentence: '', german_sentence: '' }]
    })
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
        width: '90%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <h2 style={{ marginTop: 0 }}>Neuer Wörterbucheintrag</h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Halunder Wort *
              </label>
              <input
                type="text"
                required
                value={formData.halunder_word}
                onChange={(e) => setFormData({...formData, halunder_word: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Deutsches Wort
              </label>
              <input
                type="text"
                value={formData.german_word}
                onChange={(e) => setFormData({...formData, german_word: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Aussprache
              </label>
              <input
                type="text"
                value={formData.pronunciation}
                onChange={(e) => setFormData({...formData, pronunciation: e.target.value})}
                placeholder="z.B. [de:l]"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Wortart
              </label>
              <select
                value={formData.word_type}
                onChange={(e) => setFormData({...formData, word_type: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <option value="">-- Wählen --</option>
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
            
            {formData.word_type === 'noun' && (
              <>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Geschlecht
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  >
                    <option value="">-- Wählen --</option>
                    <option value="M">Maskulinum (M)</option>
                    <option value="F">Femininum (F)</option>
                    <option value="N">Neutrum (N)</option>
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Pluralform
                  </label>
                  <input
                    type="text"
                    value={formData.plural_form}
                    onChange={(e) => setFormData({...formData, plural_form: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </>
            )}
          </div>

          {/* Meanings */}
          <div style={{ marginBottom: '20px' }}>
            <h3>Bedeutungen</h3>
            {formData.meanings.map((meaning, index) => (
              <div key={index} style={{ 
                padding: '15px', 
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                marginBottom: '10px'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="Deutsche Bedeutung"
                    value={meaning.german_meaning}
                    onChange={(e) => {
                      const newMeanings = [...formData.meanings]
                      newMeanings[index].german_meaning = e.target.value
                      setFormData({...formData, meanings: newMeanings})
                    }}
                    style={{
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Kontext (optional)"
                    value={meaning.context}
                    onChange={(e) => {
                      const newMeanings = [...formData.meanings]
                      newMeanings[index].context = e.target.value
                      setFormData({...formData, meanings: newMeanings})
                    }}
                    style={{
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addMeaning}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              + Bedeutung hinzufügen
            </button>
          </div>

          {/* Examples */}
          <div style={{ marginBottom: '20px' }}>
            <h3>Beispiele</h3>
            {formData.examples.map((example, index) => (
              <div key={index} style={{ 
                padding: '15px', 
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                marginBottom: '10px'
              }}>
                <input
                  type="text"
                  placeholder="Halunder Beispielsatz"
                  value={example.halunder_sentence}
                  onChange={(e) => {
                    const newExamples = [...formData.examples]
                    newExamples[index].halunder_sentence = e.target.value
                    setFormData({...formData, examples: newExamples})
                  }}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    marginBottom: '10px'
                  }}
                />
                <input
                  type="text"
                  placeholder="Deutsche Übersetzung"
                  value={example.german_sentence}
                  onChange={(e) => {
                    const newExamples = [...formData.examples]
                    newExamples[index].german_sentence = e.target.value
                    setFormData({...formData, examples: newExamples})
                  }}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={addExample}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              + Beispiel hinzufügen
            </button>
          </div>

          {/* Actions */}
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
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
