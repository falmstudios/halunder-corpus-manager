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
      let data
      
      try {
        data = JSON.parse(text)
      } catch (parseError) {
        alert('Fehler beim Parsen der JSON-Datei: ' + parseError.message)
        setImporting(false)
        return
      }
      
      // Determine format and extract entries
      let entries = []
      
      if (Array.isArray(data)) {
        // Direct array of entries (your format)
        entries = data
      } else if (data.entries && Array.isArray(data.entries)) {
        // Object with entries property
        entries = data.entries
      } else if (data.dictionaryEntries && Array.isArray(data.dictionaryEntries)) {
        // Object with dictionaryEntries property
        entries = data.dictionaryEntries
      } else {
        alert('Unbekanntes JSON-Format. Erwartet wird ein Array von Wörterbucheinträgen.')
        setImporting(false)
        return
      }

      console.log(`Found ${entries.length} entries to import`)

      const response = await fetch('/api/dictionary/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entries,
          source
        })
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Import fehlgeschlagen')
      }
      
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
        
        <h4>Erwartete JSON-Struktur:</h4>
        <pre style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '10px', 
          borderRadius: '4px',
          overflow: 'auto',
          fontSize: '12px'
        }}>
{`[
  {
    "halunderWord": "dwalske",
    "germanMeaning": "dusseln, gedankenlos schlendern",
    "pronunciation": "dwa.lsKə",
    "wordType": "verb (weak)",
    "examples": [
      {
        "halunder": "hi dwalsket di heele Dai",
        "german": "er dusselt den ganzen Tag"
      }
    ]
  }
]`}
        </pre>
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
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}
        >
          <option value="krogmann">Krogmann</option>
          <option value="siebs">Siebs</option>
          <option value="custom">Custom</option>
          <option value="docupipe">Docupipe Export</option>
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
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        />
      </div>

      <button
        onClick={handleImport}
        disabled={!file || importing}
        style={{
          padding: '10px 20px',
          backgroundColor: !file || importing ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: !file || importing ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          width: '100%'
        }}
      >
        {importing ? 'Importiere...' : 'Import starten'}
      </button>

      {result && (
        <div style={{
          marginTop: '20px',
          padding: '20px',
          backgroundColor: result.errors?.length > 0 ? '#f8d7da' : '#d4edda',
          borderRadius: '8px',
          border: `1px solid ${result.errors?.length > 0 ? '#f5c6cb' : '#c3e6cb'}`
        }}>
          <h3>{result.errors?.length > 0 ? 'Import mit Fehlern abgeschlossen' : 'Import erfolgreich!'}</h3>
          <p>
            <strong>Verarbeitet:</strong> {result.processed} von {result.total} Einträgen
          </p>
          
          {result.errors?.length > 0 && (
            <div>
              <h4>Fehler:</h4>
              <ul style={{ 
                maxHeight: '200px', 
                overflow: 'auto',
                backgroundColor: 'white',
                padding: '10px',
                borderRadius: '4px'
              }}>
                {result.errors.map((err, idx) => (
                  <li key={idx}>
                    <strong>{err.word}:</strong> {err.error}
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
