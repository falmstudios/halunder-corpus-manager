'use client'

import { useState } from 'react'
import Navbar from '@/app/Navbar'

export default function AnalyzePage() {
  const [sentence, setSentence] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [results, setResults] = useState(null)

  const analyzeSentence = async () => {
    if (!sentence.trim()) return

    setAnalyzing(true)
    try {
      const response = await fetch('/api/analyze-sentence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence })
      })

      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error('Analysis error:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Sentence Analysis</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter a Halunder sentence to analyze
            </label>
            <input
              type="text"
              value={sentence}
              onChange={(e) => setSentence(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && analyzeSentence()}
              placeholder="e.g., Ik hoa iaan Oapel"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <button
            onClick={analyzeSentence}
            disabled={analyzing || !sentence.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {analyzing ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>

        {results && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>
            
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm text-gray-600">Total Words</div>
                  <div className="text-lg font-semibold">{results.stats.totalWords}</div>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <div className="text-sm text-gray-600">Known Words</div>
                  <div className="text-lg font-semibold text-green-600">{results.stats.knownWords}</div>
                </div>
                <div className="bg-orange-50 p-3 rounded">
                  <div className="text-sm text-gray-600">Unknown Words</div>
                  <div className="text-lg font-semibold text-orange-600">{results.stats.unknownWords}</div>
                </div>
                <div className="bg-blue-50 p-3 rounded">
                  <div className="text-sm text-gray-600">Coverage</div>
                  <div className="text-lg font-semibold text-blue-600">{results.stats.coverage}</div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-2">Word Analysis</h3>
              <div className="space-y-3">
                {Object.entries(results.wordAnalysis).map(([word, entries]) => (
                  <div key={word} className="border rounded-lg p-3">
                    <div className="font-medium text-lg">{word}</div>
                    {entries.map((entry, idx) => (
                      <div key={idx} className="mt-2 text-sm">
                        <div className="text-gray-600">
                          {entry.halunder_word} 
                          {entry.pronunciation && <span className="ml-2">/{entry.pronunciation}/</span>}
                          {entry.word_type && <span className="ml-2 text-blue-600">{entry.word_type}</span>}
                          {entry.gender && <span className="ml-1 text-purple-600">{entry.gender}</span>}
                        </div>
                        {entry.german_meaning && (
                          <div className="mt-1">→ {entry.german_meaning}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {results.unknownWords.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Unknown Words</h3>
                <div className="flex flex-wrap gap-2">
                  {results.unknownWords.map((word, idx) => (
                    <span key={idx} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-md text-sm">
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
