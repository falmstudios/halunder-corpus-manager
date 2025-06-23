'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DictionaryImportPage() {
  const [importing, setImporting] = useState(false)
  const [file, setFile] = useState(null)
  const [source, setSource] = useState('krogmann')
  const [result, setResult] = useState(null)
  const router = useRouter()

  const handleImport = async () => {
    if (!file) {
      alert('Bitte wähle eine Datei aus')
      return
    }

    setImporting(true)
    setResult(null)

    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      // Determine format and extract entries
      let entries = []
      
      if (data.entries) {
        // Krogmann format
        entries = data.entries
      } else if (data.dictionaryEntries) {
        // Other format
        entries = data.dictionaryEntries
      } else if (Array.isArray(data)) {
        entries = data
      }

      const response = await fetch('/api/dictionary/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entries,
          source
        })
      })

      const result = await response.json()
      setResult(result)

    } catch (error) {
      console.error('Import error:', error)
      alert('Fehler beim Import: ' + error.message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => router.push('/dictionary')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ← Zurück zum Wörterbuch
        </button>
      </div>

      <h1>Wörterbuch importieren</h1>
      
      <div style={{
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#f8f9fa',
        marginBottom: '20px'
      }}>
        <h3>Unterstützte Formate:</h3>
        <ul>
          <li><strong>Krogmann:</strong> Halunder → Deutsch (aus Docupipe)</li>
          <li><strong>Siebs:</strong> Deutsch → Halunder (aus Docupipe)</li>
          <li><strong>Custom JSON:</strong> Eigenes Format</li>
        </ul>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
          Quelle auswählen:
        </label>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '16px'
          }}
        >
          <option value="krogmann">Krogmann Wörterbuch</option>
          <option value="siebs">Siebs Wörterbuch</option>
          <option value="corpus">Aus Corpus</option>
          <option value="manual">Manuell/Custom</option>
        </select>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
          JSON-Datei auswählen:
        </label>
        <input
          type="file"
          accept=".json"
          onChange={(e) => setFile(e.target.files[0])}
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        />
      </div>

      <button
        onClick={handleImport}
        disabled={importing || !file}
        style={{
          padding: '12px 24px',
          backgroundColor: importing ? '#ccc' : '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: importing ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: 'bold'
        }}
      >
        {importing ? 'Importiere...' : 'Import starten'}
      </button>

      {result && (
        <div style={{
          marginTop: '30px',
          padding: '20px',
          backgroundColor: result.errors?.length > 0 ? '#fff3cd' : '#d4edda',
          border: `1px solid ${result.errors?.length > 0 ? '#ffeaa7' : '#c3e6cb'}`,
          borderRadius: '8px'
        }}>
          <h3>Import abgeschlossen!</h3>
          <p><strong>Verarbeitet:</strong> {result.processed} von {result.total} Einträgen</p>
          
          {result.errors?.length > 0 && (
            <div style={{ marginTop: '15px' }}>
              <h4>Fehler:</h4>
              <ul style={{ maxHeight: '200px', overflow: 'auto' }}>
                {result.errors.map((error, index) => (
                  <li key={index}>
                    <strong>{error.word}:</strong> {error.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
