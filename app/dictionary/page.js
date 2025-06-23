'use client'

import { useState, useEffect, useCallback } from 'react'
import DictionarySearch from './DictionarySearch'
import DictionaryEntry from './DictionaryEntry'
import AlphabetSidebar from './AlphabetSidebar'

export default function DictionaryPage() {
  const [entries, setEntries] = useState([])
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchType, setSearchType] = useState('both') // halunder, german, both
  const [selectedLetter, setSelectedLetter] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [sources, setSources] = useState(['all'])

  // Load entries based on search or letter
  const loadEntries = useCallback(async () => {
    setLoading(true)
    try {
      let url = '/api/dictionary/search?'
      
      if (searchTerm) {
        url += `q=${encodeURIComponent(searchTerm)}&type=${searchType}`
      } else if (selectedLetter) {
        url += `q=${selectedLetter}&type=halunder`
      }
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (response.ok) {
        setEntries(data.entries || [])
      }
    } catch (error) {
      console.error('Failed to load dictionary entries:', error)
    } finally {
      setLoading(false)
    }
  }, [searchTerm, searchType, selectedLetter])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  const handleSelectEntry = async (entry) => {
    try {
      const response = await fetch(`/api/dictionary/entry?id=${entry.id}`)
      const data = await response.json()
      
      if (response.ok) {
        setSelectedEntry(data.entry)
      }
    } catch (error) {
      console.error('Failed to load entry details:', error)
    }
  }

  const handleSearch = (term, type) => {
    setSearchTerm(term)
    setSearchType(type)
    setSelectedLetter(null)
  }

  const handleLetterSelect = (letter) => {
    setSelectedLetter(letter)
    setSearchTerm('')
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Alphabet Sidebar */}
      <AlphabetSidebar 
        onLetterSelect={handleLetterSelect}
        selectedLetter={selectedLetter}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ 
          padding: '20px', 
          borderBottom: '1px solid #ddd',
          backgroundColor: '#f8f9fa'
        }}>
          <h1 style={{ margin: '0 0 20px 0' }}>Halunder Wörterbuch</h1>
          
          <DictionarySearch 
            onSearch={handleSearch}
            searchTerm={searchTerm}
            searchType={searchType}
          />
          
          <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowAddForm(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              + Neuer Eintrag
            </button>
            
            
              href="/dictionary/import"
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '4px',
                display: 'inline-block'
              }}
            >
              Wörterbuch importieren
            </a>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Entry List */}
          <div style={{ 
            width: '400px', 
            borderRight: '1px solid #ddd',
            overflow: 'auto',
            backgroundColor: '#fff'
          }}>
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                Lädt...
              </div>
            ) : entries.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                Keine Einträge gefunden
              </div>
            ) : (
              <div>
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    onClick={() => handleSelectEntry(entry)}
                    style={{
                      padding: '15px',
                      borderBottom: '1px solid #eee',
                      cursor: 'pointer',
                      backgroundColor: selectedEntry?.id === entry.id ? '#e3f2fd' : 'transparent',
                      ':hover': { backgroundColor: '#f5f5f5' }
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 
                      selectedEntry?.id === entry.id ? '#e3f2fd' : 'transparent'}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                      {entry.halunder_word}
                      {entry.german_word && (
                        <span style={{ 
                          fontWeight: 'normal', 
                          color: '#666',
                          fontSize: '14px',
                          marginLeft: '10px'
                        }}>
                          → {entry.german_word}
                        </span>
                      )}
                    </div>
                    
                    {entry.word_type && (
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {entry.word_type}
                        {entry.gender && ` (${entry.gender})`}
                      </div>
                    )}
                    
                    {entry.dictionary_meanings?.[0] && (
                      <div style={{ 
                        fontSize: '14px', 
                        color: '#333',
                        marginTop: '5px',
                        fontStyle: 'italic'
                      }}>
                        {entry.dictionary_meanings[0].german_meaning}
                      </div>
                    )}
                    
                    <div style={{ 
                      fontSize: '11px', 
                      color: '#999',
                      marginTop: '5px'
                    }}>
                      Quelle: {entry.source}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Entry Detail */}
          <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
            {selectedEntry ? (
              <DictionaryEntry 
                entry={selectedEntry}
                onUpdate={loadEntries}
              />
            ) : (
              <div style={{ 
                textAlign: 'center', 
                color: '#666',
                marginTop: '50px'
              }}>
                Wähle einen Eintrag aus der Liste
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Entry Modal */}
      {showAddForm && (
        <AddEntryModal 
          onClose={() => setShowAddForm(false)}
          onSave={() => {
            setShowAddForm(false)
            loadEntries()
          }}
        />
      )}
    </div>
  )
}
