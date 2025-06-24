'use client'

import { useState, useEffect } from 'react'

export default function CorpusReviewPage() {
  const [buckets, setBuckets] = useState([])
  const [selectedBucket, setSelectedBucket] = useState(null)
  const [sentences, setSentences] = useState([])
  const [selectedSentences, setSelectedSentences] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalSentences, setTotalSentences] = useState(0)
  const [unprocessedCount, setUnprocessedCount] = useState(0)
  const [editingSentence, setEditingSentence] = useState(null)
  const [bulkAction, setBulkAction] = useState('')
  const [processingQuality, setProcessingQuality] = useState(false)
  const [showAllBuckets, setShowAllBuckets] = useState(false)

  useEffect(() => {
    loadBuckets()
  }, [])

  useEffect(() => {
    if (selectedBucket) {
      loadSentences()
    }
  }, [selectedBucket, currentPage])

  const loadBuckets = async () => {
    try {
      const response = await fetch('/api/corpus-quality/buckets')
      const data = await response.json()
      
      if (response.ok) {
        setBuckets(data.buckets)
        setTotalSentences(data.totalSentences)
        setUnprocessedCount(data.unprocessedCount)
        
        // Auto-select first non-empty bucket
        const firstNonEmpty = data.buckets.find(b => b.count > 0)
        if (firstNonEmpty && !selectedBucket) {
          setSelectedBucket(firstNonEmpty.key)
        }
      }
    } catch (err) {
      console.error('Failed to load buckets:', err)
    }
  }

  const loadSentences = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/corpus-quality/sentences?bucket=${selectedBucket}&page=${currentPage}&limit=50`
      )
      const data = await response.json()
      
      if (response.ok) {
        setSentences(data.sentences)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (err) {
      console.error('Failed to load sentences:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculateQualityMetrics = async (forceRecalculate = false) => {
    setProcessingQuality(true)
    try {
      const response = await fetch('/api/corpus-quality/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceRecalculate })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        alert(`Quality metrics calculated for ${result.processed} sentences`)
        await loadBuckets()
        if (selectedBucket) {
          await loadSentences()
        }
      } else {
        alert('Error calculating quality metrics: ' + result.error)
      }
    } catch (err) {
      console.error('Failed to calculate quality metrics:', err)
      alert('Failed to calculate quality metrics')
    } finally {
      setProcessingQuality(false)
    }
  }

  const handleSentenceSelect = (sentenceId) => {
    const newSelection = new Set(selectedSentences)
    if (newSelection.has(sentenceId)) {
      newSelection.delete(sentenceId)
    } else {
      newSelection.add(sentenceId)
    }
    setSelectedSentences(newSelection)
  }

  const handleSelectAll = () => {
    if (selectedSentences.size === sentences.length) {
      setSelectedSentences(new Set())
    } else {
      setSelectedSentences(new Set(sentences.map(s => s.id)))
    }
  }

  const handleBulkAction = async () => {
    if (!bulkAction || selectedSentences.size === 0) return
    
    const sentenceIds = Array.from(selectedSentences)
    let body = { action: bulkAction, sentenceIds }
    
    if (bulkAction === 'move_to_bucket') {
      const targetBucket = prompt('Enter target bucket (high_quality, good_quality, needs_review, poor_quality, unreviewed):')
      if (!targetBucket) return
      body.targetBucket = targetBucket
    }
    
    if (bulkAction === 'mark_reviewed' || bulkAction === 'approve' || bulkAction === 'reject') {
      const notes = prompt('Add review notes (optional):')
      if (notes) body.reviewNotes = notes
    }
    
    try {
      const response = await fetch('/api/corpus-quality/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      const result = await response.json()
      
      if (response.ok) {
        alert(result.message)
        setSelectedSentences(new Set())
        await loadBuckets()
        await loadSentences()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (err) {
      console.error('Failed to perform bulk action:', err)
      alert('Failed to perform bulk action')
    }
  }

  const saveSentenceEdit = async () => {
    if (!editingSentence) return
    
    try {
      const response = await fetch('/api/corpus-quality/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingSentence)
      })
      
      const result = await response.json()
      
      if (response.ok) {
        setEditingSentence(null)
        await loadSentences()
      } else {
        alert('Error saving sentence: ' + result.error)
      }
    } catch (err) {
      console.error('Failed to save sentence:', err)
      alert('Failed to save sentence')
    }
  }

  const deleteSentence = async (sentenceId) => {
    if (!confirm('Are you sure you want to delete this sentence pair?')) return
    
    try {
      const response = await fetch(`/api/corpus-quality/update?id=${sentenceId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await loadBuckets()
        await loadSentences()
      } else {
        const result = await response.json()
        alert('Error deleting sentence: ' + result.error)
      }
    } catch (err) {
      console.error('Failed to delete sentence:', err)
      alert('Failed to delete sentence')
    }
  }

  const getTagStyle = (tag) => {
    const styles = {
      similar_length: { backgroundColor: '#28a745', color: 'white' },
      different_length: { backgroundColor: '#dc3545', color: 'white' },
      similar_punctuation: { backgroundColor: '#28a745', color: 'white' },
      very_different_punctuation: { backgroundColor: '#dc3545', color: 'white' }
    }
    return styles[tag] || { backgroundColor: '#6c757d', color: 'white' }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1>Corpus Quality Review</h1>
          <p style={{ color: '#666', marginTop: '5px' }}>
            Total: {totalSentences} sentences | Unprocessed: {unprocessedCount}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => calculateQualityMetrics(false)}
            disabled={processingQuality || unprocessedCount === 0}
            style={{
              padding: '10px 20px',
              backgroundColor: unprocessedCount > 0 ? '#007bff' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: unprocessedCount > 0 ? 'pointer' : 'not-allowed',
              opacity: processingQuality ? 0.6 : 1
            }}
          >
            {processingQuality ? 'Processing...' : `Process ${unprocessedCount} Unprocessed`}
          </button>
          <button
            onClick={() => calculateQualityMetrics(true)}
            disabled={processingQuality}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ffc107',
              color: '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              opacity: processingQuality ? 0.6 : 1
            }}
          >
            Recalculate All
          </button>
          <a 
            href="/corpus" 
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px'
            }}
          >
            Corpus Viewer
          </a>
          <a 
            href="/" 
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px'
            }}
          >
            Home
          </a>
        </div>
      </div>

      {/* Bucket Selection */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2>Quality Buckets</h2>
          <button
            onClick={() => setShowAllBuckets(!showAllBuckets)}
            style={{
              padding: '5px 15px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {showAllBuckets ? 'Show Non-Empty' : 'Show All'}
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
          {buckets
            .filter(bucket => showAllBuckets || bucket.count > 0)
            .map(bucket => (
              <div
                key={bucket.key}
                onClick={() => {
                  if (bucket.count > 0) {
                    setSelectedBucket(bucket.key)
                    setCurrentPage(1)
                    setSelectedSentences(new Set())
                  }
                }}
                style={{
                  padding: '20px',
                  borderRadius: '8px',
                  border: `2px solid ${selectedBucket === bucket.key ? bucket.color : '#dee2e6'}`,
                  backgroundColor: selectedBucket === bucket.key ? `${bucket.color}20` : '#f8f9fa',
                  cursor: bucket.count > 0 ? 'pointer' : 'default',
                  opacity: bucket.count === 0 ? 0.5 : 1,
                  transition: 'all 0.2s'
                }}
              >
                <h3 style={{ margin: '0 0 5px 0', color: bucket.color }}>{bucket.label}</h3>
                <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>
                  {bucket.description}
                </p>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
                  {bucket.count}
                </p>
              </div>
            ))}
        </div>
      </div>

      {/* Sentences View */}
      {selectedBucket && sentences.length > 0 && (
        <div>
          {/* Bulk Actions Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <input
                type="checkbox"
                checked={selectedSentences.size === sentences.length && sentences.length > 0}
                onChange={handleSelectAll}
              />
              <span>{selectedSentences.size} selected</span>
              
              {selectedSentences.size > 0 && (
                <>
                  <select
                    value={bulkAction}
                    onChange={(e) => setBulkAction(e.target.value)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '4px',
                      border: '1px solid #dee2e6'
                    }}
                  >
                    <option value="">Select Action...</option>
                    <option value="move_to_bucket">Move to Bucket</option>
                    <option value="mark_reviewed">Mark as Reviewed</option>
                    <option value="mark_unreviewed">Mark as Unreviewed</option>
                    <option value="approve">Approve (→ High Quality)</option>
                    <option value="reject">Reject (→ Poor Quality)</option>
                    <option value="delete">Delete</option>
                  </select>
                  
                  <button
                    onClick={handleBulkAction}
                    disabled={!bulkAction}
                    style={{
                      padding: '5px 15px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: bulkAction ? 'pointer' : 'not-allowed',
                      opacity: bulkAction ? 1 : 0.6
                    }}
                  >
                    Apply
                  </button>
                </>
              )}
            </div>
            
            {/* Pagination */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '5px 15px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.6 : 1
                }}
              >
                Previous
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '5px 15px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.6 : 1
                }}
              >
                Next
              </button>
            </div>
          </div>

          {/* Sentences List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {loading ? (
              <p style={{ textAlign: 'center', padding: '40px' }}>Loading sentences...</p>
            ) : (
              sentences.map(sentence => (
                <div
                  key={sentence.id}
                  style={{
                    padding: '20px',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    backgroundColor: selectedSentences.has(sentence.id) ? '#e3f2fd' : 'white'
                  }}
                >
                  {/* Sentence Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <input
                        type="checkbox"
                        checked={selectedSentences.has(sentence.id)}
                        onChange={() => handleSentenceSelect(sentence.id)}
                      />
                      {sentence.source_text && (
                        <span style={{ fontSize: '14px', color: '#666' }}>
                          {sentence.source_text.title} ({sentence.source_text.author || 'Unknown'})
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {sentence.quality_reviewed && (
                        <span style={{
                          padding: '2px 8px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}>
                          Reviewed
                        </span>
                      )}
                      <button
                        onClick={() => setEditingSentence(sentence)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#17a2b8',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteSentence(sentence.id)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Quality Tags */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
                    {sentence.quality_tags.map(tag => (
                      <span
                        key={tag}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          ...getTagStyle(tag)
                        }}
                      >
                        {tag.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>

                  {/* Sentences */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>
                        Halunder ({sentence.halunder_word_count} words, {sentence.halunder_punctuation_count} punct)
                      </h4>
                      <p style={{ margin: 0, lineHeight: '1.6' }}>{sentence.halunder_sentence}</p>
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>
                        German ({sentence.german_word_count} words, {sentence.german_punctuation_count} punct)
                      </h4>
                      <p style={{ margin: 0, lineHeight: '1.6' }}>{sentence.german_sentence}</p>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '20px', 
                    marginTop: '15px',
                    paddingTop: '15px',
                    borderTop: '1px solid #dee2e6',
                    fontSize: '14px',
                    color: '#666'
                  }}>
                    <span>Length Ratio: {(sentence.length_ratio * 100).toFixed(0)}%</span>
                    <span>Punctuation Ratio: {(sentence.punctuation_ratio * 100).toFixed(0)}%</span>
                    {sentence.confidence_score && (
                      <span>AI Confidence: {(sentence.confidence_score * 100).toFixed(0)}%</span>
                    )}
                  </div>

                  {/* Review Notes */}
                  {sentence.quality_reviewer_notes && (
                    <div style={{
                      marginTop: '15px',
                      padding: '10px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}>
                      <strong>Review Notes:</strong> {sentence.quality_reviewer_notes}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingSentence && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginTop: 0 }}>Edit Sentence Pair</h2>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Halunder Sentence
              </label>
              <textarea
                value={editingSentence.halunder_sentence}
                onChange={(e) => setEditingSentence({
                  ...editingSentence,
                  halunder_sentence: e.target.value
                })}
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #dee2e6'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                German Sentence
              </label>
              <textarea
                value={editingSentence.german_sentence}
                onChange={(e) => setEditingSentence({
                  ...editingSentence,
                  german_sentence: e.target.value
                })}
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #dee2e6'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Quality Bucket
              </label>
              <select
                value={editingSentence.quality_bucket}
                onChange={(e) => setEditingSentence({
                  ...editingSentence,
                  quality_bucket: e.target.value
                })}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #dee2e6'
                }}
              >
                <option value="high_quality">High Quality</option>
                <option value="good_quality">Good Quality</option>
                <option value="needs_review">Needs Review</option>
                <option value="poor_quality">Poor Quality</option>
                <option value="unreviewed">Unreviewed</option>
              </select>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Review Notes
              </label>
              <textarea
                value={editingSentence.quality_reviewer_notes || ''}
                onChange={(e) => setEditingSentence({
                  ...editingSentence,
                  quality_reviewer_notes: e.target.value
                })}
                placeholder="Add any notes about this sentence pair..."
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #dee2e6'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEditingSentence(null)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveSentenceEdit}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
