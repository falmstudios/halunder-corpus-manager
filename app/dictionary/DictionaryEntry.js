'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '../../components/Navbar'

export default function DictionaryImport() {
  const router = useRouter()
  const [jsonText, setJsonText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')

  const handleImport = async () => {
    if (!jsonText.trim()) {
      setError('Bitte fügen Sie JSON-Daten ein')
      return
    }

    setIsProcessing(true)
    setError('')
    setResults(null)

    try {
      // Parse JSON to validate it
      const data = JSON.parse(jsonText)
      
      const response = await fetch('/api/dictionary/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: Array.isArray(data) ? data : [data] })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Import fehlgeschlagen')
      }

      setResults(result)
      
      // Clear the input after successful import
      if (result.imported > 0) {
        setJsonText('')
      }
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Ungültiges JSON-Format')
      } else {
        setError(err.message)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const sampleJson = `[
  {
    "halunderWord": "Alerseelen",
    "pronunciation": "a.larsédan",
    "wordType": "proper noun",
    "germanMeaning": "Allerseelen, der 2. November",
    "references": "S. Alerhilligen",
    "relatedWords": ["Alerhilligen"]
  }
]`

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-content">
          <div style={{ marginBottom: '30px' }}>
            <h1>Wörterbuch Import</h1>
            <button
              onClick={() => router.push('/dictionary')}
              style={{
                padding: '10px 20px',
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

          <div style={{ marginBottom: '20px' }}>
            <h2>JSON-Daten importieren</h2>
            <p>Fügen Sie Ihre Wörterbuch-Einträge im JSON-Format ein:</p>
          </div>

          {error && (
            <div style={{
              padding: '15px',
              backgroundColor: '#f8d7da',
              color: '#721c24',
              borderRadius: '4px',
              marginBottom: '20px'
            }}>
              {error}
            </div>
          )}

          {results && (
            <div style={{
              padding: '15px',
              backgroundColor: results.imported > 0 ? '#d4edda' : '#fff3cd',
              color: results.imported > 0 ? '#155724' : '#856404',
              borderRadius: '4px',
              marginBottom: '20px'
            }}>
              <h3>Import-Ergebnisse:</h3>
              <ul style={{ margin: '10px 0' }}>
                <li>Importiert: {results.imported}</li>
                <li>Übersprungen: {results.skipped}</li>
                <li>Fehler: {results.errors}</li>
              </ul>
              {results.details && results.details.length > 0 && (
                <details style={{ marginTop: '10px' }}>
                  <summary style={{ cursor: 'pointer' }}>Details anzeigen</summary>
                  <pre style={{ marginTop: '10px', fontSize: '12px' }}>
                    {JSON.stringify(results.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder="JSON hier einfügen..."
              style={{
                width: '100%',
                height: '400px',
                padding: '10px',
                fontFamily: 'monospace',
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={handleImport}
              disabled={isProcessing || !jsonText.trim()}
              style={{
                padding: '10px 20px',
                backgroundColor: isProcessing || !jsonText.trim() ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isProcessing || !jsonText.trim() ? 'not-allowed' : 'pointer',
                marginRight: '10px'
              }}
            >
              {isProcessing ? 'Importiere...' : 'Importieren'}
            </button>

            <button
              onClick={() => setJsonText(sampleJson)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Beispiel-JSON laden
            </button>
          </div>

          <div style={{
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px'
          }}>
            <h3>JSON-Format</h3>
            <p>Jeder Eintrag sollte folgende Felder enthalten:</p>
            <ul>
              <li><strong>halunderWord</strong> (erforderlich): Das Halunder-Wort</li>
              <li><strong>germanMeaning</strong> (erforderlich): Die deutsche Übersetzung</li>
              <li><strong>pronunciation</strong>: Lautschrift</li>
              <li><strong>wordType</strong>: Wortart (noun, verb, adjective, etc.)</li>
              <li><strong>wordGender</strong>: Geschlecht (M, F, N) für Substantive</li>
              <li><strong>etymology</strong>: Etymologie</li>
              <li><strong>usageNotes</strong>: Verwendungshinweise</li>
              <li><strong>source</strong>: Quelle</li>
            </ul>
            
            <h4 style={{ marginTop: '20px' }}>Beispiel:</h4>
            <pre style={{
              backgroundColor: '#fff',
              padding: '10px',
              borderRadius: '4px',
              overflow: 'auto'
            }}>
{sampleJson}
            </pre>
          </div>
        </div>
      </div>
    </>
  )
}
