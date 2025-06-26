'use client'

import { useState } from 'react'
import Navbar from '../../components/Navbar'

export default function DictionaryImportPage() {
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setImporting(true)
    setError(null)
    setResults(null)

    try {
      const text = await file.text()
      const entries = JSON.parse(text)

      const response = await fetch('/api/dictionary/krogmann-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ entries, source: 'Krogmann' })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Import failed')
      }

      setResults(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-content">
          <h1>Krogmann Dictionary Import</h1>
          
          <div style={{ marginBottom: '30px' }}>
            <h2>Upload Dictionary JSON File</h2>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Select a Krogmann dictionary JSON file
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                disabled={importing}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: importing ? 'not-allowed' : 'pointer'
                }}
              />
            </div>

            {importing && (
              <div style={{ color: '#3498db' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    display: 'inline-block',
                    width: '20px',
                    height: '20px',
                    marginRight: '10px',
                    border: '3px solid #f3f3f3',
                    borderTop: '3px solid #3498db',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Importing dictionary entries...
                </div>
              </div>
            )}

            {error && (
              <div style={{
                marginTop: '20px',
                padding: '16px',
                backgroundColor: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '6px'
              }}>
                <p style={{ color: '#dc2626', margin: 0 }}>Error: {error}</p>
              </div>
            )}

            {results && (
              <div style={{
                marginTop: '20px',
                padding: '16px',
                backgroundColor: '#d1fae5',
                border: '1px solid '#a7f3d0',
                borderRadius: '6px'
              }}>
                <p style={{ color: '#059669', fontWeight: 'bold', margin: 0 }}>
                  {results.message}
                </p>
                <p style={{ color: '#047857', marginTop: '8px', marginBottom: 0 }}>
                  Successfully imported: {results.processed} entries
                </p>
                {results.errors && results.errors.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <p style={{ color: '#ea580c', fontWeight: 'bold' }}>
                      Errors: {results.errors.length}
                    </p>
                    <ul style={{
                      fontSize: '14px',
                      color: '#c2410c',
                      marginTop: '8px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      backgroundColor: 'white',
                      padding: '10px',
                      borderRadius: '4px'
                    }}>
                      {results.errors.map((err, idx) => (
                        <li key={idx}>{err.word}: {err.error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            padding: '20px',
            marginTop: '30px'
          }}>
            <h3 style={{ marginTop: 0 }}>Instructions:</h3>
            <ol style={{
              lineHeight: '1.8',
              color: '#4b5563'
            }}>
              <li>Select a JSON file containing Krogmann dictionary entries</li>
              <li>The file should contain an array of dictionary entry objects</li>
              <li>Each entry will be imported with all its meanings, examples, and related information</li>
              <li>Duplicate entries will be skipped</li>
              <li>After import, you can view and search entries in the main dictionary</li>
            </ol>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}
