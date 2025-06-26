'use client'

import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'

export default function CorpusViewer() {
  const [texts, setTexts] = useState([])
  const [selectedTextId, setSelectedTextId] = useState(null)
  const [sentences, setSentences] = useState([])
  const [features, setFeatures] = useState([])
  const [vocabulary, setVocabulary] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('parallel')
  const [searchTerm, setSearchTerm] = useState('')
  const [showQualityReview, setShowQualityReview] = useState(false)
  const [qualitySentences, setQualitySentences] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 20

  useEffect(() => {
    loadTexts()
  }, [])

  useEffect(() => {
    if (activeTab === 'parallel' || activeTab === 'features') {
      loadData()
    } else if (activeTab === 'vocabulary') {
      loadVocabulary()
    }
  }, [selectedTextId, activeTab])

  const loadTexts = async () => {
    try {
      const response = await fetch('/api/corpus-texts')
      const data = await response.json()
      
      if (response.ok) {
        setTexts(data.texts || [])
      }
    } catch (error) {
      console.error('Failed to load texts:', error)
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ type: activeTab })
      if (selectedTextId) params.append('textId', selectedTextId)
      
      const response = await fetch(`/api/corpus-data?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        if (activeTab === 'parallel') {
          setSentences(data.data || [])
        } else if (activeTab === 'features') {
          setFeatures(data.data || [])
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadVocabulary = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/corpus-data?type=vocabulary')
      const data = await response.json()
      
      if (response.ok) {
        setVocabulary(data.data || [])
      }
    } catch (error) {
      console.error('Failed to load vocabulary:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadQualityReviewData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/quality-review?page=${page}&pageSize=${pageSize}`)
      const data = await response.json()
      
      if (response.ok) {
        setQualitySentences(data.sentences || [])
        setTotalPages(Math.ceil(data.totalCount / pageSize))
      }
    } catch (error) {
      console.error('Failed to load quality review data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (showQualityReview) {
      loadQualityReviewData()
    }
  }, [showQualityReview, page])

  const updateReviewStatus = async (sentenceId, newStatus) => {
    try {
      const response = await fetch('/api/quality-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sentenceId,
          reviewStatus: newStatus,
          confidence: newStatus === 'approved' ? 1.0 : 0.5
        })
      })

      if (response.ok) {
        loadQualityReviewData()
      }
    } catch (error) {
      console.error('Failed to update review status:', error)
    }
  }

  const handleExport = async (format) => {
    try {
      const response = await fetch(`/api/corpus-export?format=${format}`)
      const blob = await response.blob()
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `halunder_corpus_${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed: ' + error.message)
    }
  }

  const filteredSentences = sentences.filter(s => 
    !searchTerm || 
    s.halunder_sentence?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.german_sentence?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredFeatures = features.filter(f =>
    !searchTerm ||
    f.halunder_term?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.german_equivalent?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.explanation?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredVocabulary = vocabulary.filter(v =>
    !searchTerm ||
    v.halunder_word?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const renderQualitySentence = (sentence) => {
    const bgColor = sentence.review_status === 'approved' ? '#d1fae5' :
                   sentence.review_status === 'needs_review' ? '#fed7aa' :
                   sentence.review_status === 'rejected' ? '#fee2e2' : '#f3f4f6'

    return (
      <div style={{ backgroundColor: bgColor, padding: '10px', borderRadius: '6px' }}>
        <div style={{ marginBottom: '8px' }}>
          <strong>Halunder:</strong> {sentence.halunder_sentence}
        </div>
        <div style={{ marginBottom: '8px' }}>
          <strong>Deutsch:</strong> {sentence.german_sentence}
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          fontSize: '14px',
          color: '#6b7280'
        }}>
          <span>Confidence: {(sentence.confidence * 100).toFixed(0)}%</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => updateReviewStatus(sentence.id, 'approved')}
              disabled={sentence.review_status === 'approved'}
              style={{
                padding: '4px 12px',
                backgroundColor: sentence.review_status === 'approved' ? '#059669' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: sentence.review_status === 'approved' ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                opacity: sentence.review_status === 'approved' ? 0.6 : 1
              }}
            >
              ✓ Approve
            </button>
            <button
              onClick={() => updateReviewStatus(sentence.id, 'needs_review')}
              disabled={sentence.review_status === 'needs_review'}
              style={{
                padding: '4px 12px',
                backgroundColor: sentence.review_status === 'needs_review' ? '#d97706' : '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: sentence.review_status === 'needs_review' ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                opacity: sentence.review_status === 'needs_review' ? 0.6 : 1
              }}
            >
              ? Review
            </button>
            <button
              onClick={() => updateReviewStatus(sentence.id, 'rejected')}
              disabled={sentence.review_status === 'rejected'}
              style={{
                padding: '4px 12px',
                backgroundColor: sentence.review_status === 'rejected' ? '#dc2626' : '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: sentence.review_status === 'rejected' ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                opacity: sentence.review_status === 'rejected' ? 0.6 : 1
              }}
            >
              ✗ Reject
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-content">
          <div style={{ marginBottom: '20px' }}>
            <h1>Corpus Viewer</h1>
            
            {/* Quality Review Toggle */}
            <div style={{ marginBottom: '20px' }}>
              <button
                onClick={() => setShowQualityReview(!showQualityReview)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: showQualityReview ? '#6366f1' : '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '500'
                }}
              >
                {showQualityReview ? 'Hide Quality Review' : 'Show Quality Review'}
              </button>
            </div>

            {!showQualityReview && (
              <>
                {/* Text Filter */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ marginRight: '10px' }}>Filter by text:</label>
                  <select
                    value={selectedTextId || ''}
                    onChange={(e) => setSelectedTextId(e.target.value || null)}
                    style={{
                      padding: '8px',
                      fontSize: '16px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      minWidth: '300px'
                    }}
                  >
                    <option value="">All texts</option>
                    {texts.map(text => (
                      <option key={text.id} value={text.id}>
                        {text.title || 'Untitled'} {text.author && `- ${text.author}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tabs */}
                <div style={{ marginBottom: '20px', borderBottom: '2px solid #e5e7eb' }}>
                  <button
                    onClick={() => setActiveTab('parallel')}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: activeTab === 'parallel' ? '#3b82f6' : 'transparent',
                      color: activeTab === 'parallel' ? 'white' : '#6b7280',
                      border: 'none',
                      borderBottom: activeTab === 'parallel' ? '2px solid #3b82f6' : 'none',
                      cursor: 'pointer',
                      marginRight: '10px',
                      fontSize: '16px'
                    }}
                  >
                    Parallel Sentences ({filteredSentences.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('features')}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: activeTab === 'features' ? '#3b82f6' : 'transparent',
                      color: activeTab === 'features' ? 'white' : '#6b7280',
                      border: 'none',
                      borderBottom: activeTab === 'features' ? '2px solid #3b82f6' : 'none',
                      cursor: 'pointer',
                      marginRight: '10px',
                      fontSize: '16px'
                    }}
                  >
                    Linguistic Features ({filteredFeatures.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('vocabulary')}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: activeTab === 'vocabulary' ? '#3b82f6' : 'transparent',
                      color: activeTab === 'vocabulary' ? 'white' : '#6b7280',
                      border: 'none',
                      borderBottom: activeTab === 'vocabulary' ? '2px solid #3b82f6' : 'none',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                  >
                    Vocabulary ({filteredVocabulary.length})
                  </button>
                </div>

                {/* Search */}
                <div style={{ marginBottom: '20px' }}>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      fontSize: '16px',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                </div>

                {/* Export Button */}
                <div style={{ marginBottom: '20px' }}>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleExport(e.target.value)
                        e.target.value = ''
                      }
                    }}
                    style={{
                      padding: '8px 16px',
                      fontSize: '14px',
                      border: 'none',
                      borderRadius: '4px',
                      backgroundColor: '#17a2b8',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Export...</option>
                    <option value="json">JSON (vollständig)</option>
                    <option value="jsonl">JSONL (Training)</option>
                    <option value="tsv">TSV (Tab-getrennt)</option>
                    <option value="csv">CSV (Excel)</option>
                    <option value="txt">TXT (einfach)</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Content */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>Loading...</p>
            </div>
          ) : showQualityReview ? (
            <div>
              <h2>Quality Review - Sentences Needing Review</h2>
              <p style={{ marginBottom: '20px', color: '#6b7280' }}>
                Review AI-generated translations and approve, mark for review, or reject them.
              </p>
              
              {/* Quality Review Content */}
              {qualitySentences.length === 0 ? (
                <p>No sentences need review.</p>
              ) : (
                <>
                  {/* Export Button for Quality Review */}
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleExport(e.target.value)
                        e.target.value = ''
                      }
                    }}
                    style={{
                      marginBottom: '20px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      border: 'none',
                      borderRadius: '4px',
                      backgroundColor: '#17a2b8',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Export...</option>
                    <option value="json">JSON (vollständig)</option>
                    <option value="jsonl">JSONL (Training)</option>
                    <option value="tsv">TSV (Tab-getrennt)</option>
                    <option value="csv">CSV (Excel)</option>
                    <option value="txt">TXT (einfach)</option>
                  </select>

                  {/* Sentences list */}
                  {qualitySentences.map((sentence) => (
                    <div
                      key={sentence.id}
                      style={{
                        marginBottom: '15px',
                        padding: '15px',
                        backgroundColor: 'white',
                        border: '1px solid #dee2e6',
                        borderRadius: '8px'
                      }}
                    >
                      {renderQualitySentence(sentence)}
                    </div>
                  ))}
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '10px',
                      marginTop: '30px'
                    }}>
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: page === 1 ? '#e9ecef' : '#007bff',
                          color: page === 1 ? '#6c757d' : 'white',
                          border: 'none',
                          borderRadius: '4px
