'use client'

import { useState } from 'react'

export default function DictionarySearch({ onSearch, searchTerm, searchType }) {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm || '')
  const [localSearchType, setLocalSearchType] = useState(searchType || 'both')

  const handleSearch = () => {
    onSearch(localSearchTerm, localSearchType)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      <input
        type="text"
        value={localSearchTerm}
        onChange={(e) => setLocalSearchTerm(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Suche nach Wörtern..."
        style={{
          flex: 1,
          padding: '8px 12px',
          borderRadius: '4px',
          border: '1px solid #ddd',
          fontSize: '14px'
        }}
      />
      
      <select
        value={localSearchType}
        onChange={(e) => {
          setLocalSearchType(e.target.value)
          onSearch(localSearchTerm, e.target.value)
        }}
        style={{
          padding: '8px 12px',
          borderRadius: '4px',
          border: '1px solid #ddd',
          fontSize: '14px'
        }}
      >
        <option value="both">Beide Sprachen</option>
        <option value="halunder">Nur Halunder</option>
        <option value="german">Nur Deutsch</option>
      </select>
      
      <button
        onClick={handleSearch}
        style={{
          padding: '8px 16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Suchen
      </button>
    </div>
  )
}
