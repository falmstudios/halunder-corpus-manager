'use client'

import { useState } from 'react'
import Navbar from '@/app/Navbar'

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
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Krogmann Dictionary Import</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Upload Dictionary JSON File</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select a Krogmann dictionary JSON file
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              disabled={importing}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                disabled:opacity-50"
            />
          </div>

          {importing && (
            <div className="text-blue-600">
              <div className="flex items-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Importing dictionary entries...
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">Error: {error}</p>
            </div>
          )}

          {results && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800 font-semibold">{results.message}</p>
              <p className="text-green-700 mt-1">
                Successfully imported: {results.processed} entries
              </p>
              {results.errors && results.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-orange-700">Errors: {results.errors.length}</p>
                  <ul className="text-sm text-orange-600 mt-1 max-h-40 overflow-y-auto">
                    {results.errors.map((err, idx) => (
                      <li key={idx}>{err.word}: {err.error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
            <li>Select a JSON file containing Krogmann dictionary entries</li>
            <li>The file should contain an array of dictionary entry objects</li>
            <li>Each entry will be imported with all its meanings, examples, and related information</li>
            <li>Duplicate entries will be skipped</li>
            <li>After import, you can view and search entries in the main dictionary</li>
          </ol>
        </div>
      </div>
    </>
  )
}
