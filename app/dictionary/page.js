'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Navbar from '../components/Navbar'
import DictionarySearch from './DictionarySearch'
import DictionaryEntry from './DictionaryEntry'
import AlphabetSidebar from './AlphabetSidebar'
import AddEntryModal from './AddEntryModal'

export default function DictionaryPage() {
  const [entries, setEntries] = useState([])
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchType, setSearchType] = useState('both')
  const [selectedLetter, setSelectedLetter] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)

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
    console.log('Selecting entry:', entry.id)
    try {
      const response = await fetch(`/api/dictionary/entry?id=${entry.id}`)
      const data = await response.json()
      
      if (response.ok && data.entry) {
        console.log('Loaded entry details:', data.entry)
        setSelectedEntry(data.entry)
      } else {
        console.error('Failed to load entry details:', data.error)
        // Fall back to using the entry from the list
        setSelectedEntry(entry)
      }
    } catch (error) {
      console.error('Failed to load entry details:', error)
      // Fall back to using the entry from the list
      setSelectedEntry(entry)
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

  const handleEntryUpdate = (updatedEntry) => {
    setSelectedEntry(updatedEntry)
    loadEntries() // Refresh the list
  }

  return (
    <>
      <Navbar />
      <div style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
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
              
              <Link 
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
              </Link>
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
                  {searchTerm || selectedLetter ? 'Keine Einträge gefunden.' : 'Bitte suchen Sie nach einem Wort oder wählen Sie einen Buchstaben.'}
                </div>
              ) : (
                entries.map(entry => (
                  <div
                    key={entry.id}
                    onClick={() => handleSelectEntry(entry)}
                    style={{
                      padding: '15px',
                      borderBottom: '1px solid #eee',
                      cursor: 'pointer',
                      backgroundColor: selectedEntry?.id === entry.id ? '#e3f2fd' : 'transparent',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedEntry?.id !== entry.id) {
                        e.currentTarget.style.backgroundColor = '#f5f5f5'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedEntry?.id !== entry.id) {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {entry.halunder_word}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      {entry.word_type && (
                        <span>{getWordTypeLabel(entry.word_type)}</span>
                      )}
                      {entry.word_gender && (
                        <span> ({getArticle(entry.word_gender)})</span>
                      )}
                    </div>
                    <div style={{ fontSize: '14px', color: '#444', marginTop: '2px' }}>
                      {entry.german_word}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Entry Details */}
            <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#fff' }}>
              {selectedEntry ? (
                <DictionaryEntry 
                  entry={selectedEntry} 
                  onUpdate={handleEntryUpdate}
                />
              ) : (
                <div style={{ 
                  padding: '40px', 
                  textAlign: 'center', 
                  color: '#666',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  Wählen Sie einen Eintrag aus der Liste aus
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
    </>
  )
}
