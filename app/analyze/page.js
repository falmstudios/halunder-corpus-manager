'use client'

import { useState } from 'react'
import Navbar from '../components/Navbar'

export default function AnalyzePage() {
  const [sentence, setSentence] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  const analyzeSentence = async () => {
    if (!sentence.trim()) return

    setAnalyzing(true)
    setError(null)
    setResults(null)
    
    try {
      const response = await fetch('/api/analyze-sentence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence })
      })

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      setResults(data)
    } catch (error) {
      console.error('Analysis error:', error)
      setError(error.message || 'Failed to analyze sentence')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-content">
          <h1>Sentence Analysis</h1>
          
          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Enter a Halunder sentence to analyze
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={sentence}
                onChange={(e) => setSentence(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && analyzeSentence()}
                placeholder="e.g., Ik hoa iaan Oapel"
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
              <button
                onClick={analyzeSentence}
                disabled={analyzing || !sentence.trim()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: analyzing || !sentence.trim() ? '#9ca3af' : '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: analyzing || !sentence.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  wh
