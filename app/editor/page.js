'use client'

import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'

const TABLES = {
  documents: 'Documents',
  texts: 'Texts', 
  translation_aids: 'Translation Aids',
  parallel_sentences: 'Parallel Sentences',
  ai_translations: 'AI Translations',
  processing_queue: 'Processing Queue',
  standalone_german_texts: 'Standalone German Texts'
}

const TABLE_COLUMNS = {
  documents: [
    'id', 'publication', 'date', 'year', 'month', 'edition', 
    'issue_number', 'page_numbers', 'source_file', 'halunder_sentence_count', 
    'filename', 'created_at', 'updated_at'
  ],
  texts: [
    'id', 'document_id', 'title', 'subtitle', 'author', 'translator',
    'editor_corrector', 'series_info', 'translation_available', 'text_quality',
    'editorial_introduction', 'complete_helgolandic_text', 'german_translation_location',
    'german_translation_text', 'german_translation_source_publication',
    'original_source_title', 'original_source_author', 'original_source_publication_info',
    'processing_status', 'continuation_note', 'previous_episode', 'page_break_notes',
    'created_at', 'updated_at'
  ],
  translation_aids: [
    'id', 'text_id', 'number', 'term', 'explanation', 'created_at'
  ],
  parallel_sentences: [
    'id', 'text_id', 'halunder_sentence', 'german_sentence', 'sentence_order',
    'alignment_confidence', 'created_by', 'reviewed', 'reviewer_notes',
    'created_at', 'updated_at'
  ],
  ai_translations: [
    'id', 'text_id', 'original_halunder', 'ai_german_translation', 'confidence_score',
    'model_used', 'translation_notes', 'needs_review', 'approved',
    'reviewer_feedback', 'created_at', 'reviewed_at'
  ],
  processing_queue: [
    'id', 'text_id', 'queue_type', 'priority', 'assigned_to', 'status',
    'metadata', 'created_at', 'updated_at'
  ],
  standalone_german_texts: [
    'id', 'document_id', 'title', 'full_text', 'helgolandic_source_note', 'created_at'
  ]
}

export default function TableEditor() {
  const [selectedTable, setSelectedTable] = useState('documents')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [visibleColumns, setVisibleColumns] = useState({})
  const [sortColumn, setSortColumn] = useState('')
  const [sortDirection, setSortDirection] = useState('asc')
  const [filters, setFilters] = useState({})
  const [editingCell, setEditingCell] = useState(null)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageSize, setPageSize] = useState(50)

  useEffect(() => {
    // Initialize visible columns for selected table
    const columns = TABLE_COLUMNS[selectedTable]
    const defaultVisible = columns.reduce((acc, col) => {
      // Show first 5 columns by default
      acc[col] = columns.indexOf(col) < 5
      return acc
    }, {})
    setVisibleColumns(defaultVisible)
    
    // Reset page when changing tables
    setPage(1)
    setFilters({})
    setSortColumn('')
    setSortDirection('asc')
    
    loadData()
  }, [selectedTable])

  useEffect(() => {
    loadData()
  }, [page, sortColumn, sortDirection, filters])

  const loadData = async () => {
    setLoading(true)
    setError('')
    
    try {
      const params = new URLSearchParams({
        table: selectedTable,
        page: page.toString(),
        pageSize: pageSize.toString()
      })
      
      if (sortColumn) {
        params.append('sortColumn', sortColumn)
        params.append('sortDirection', sortDirection)
      }
      
      // Add filters
      Object.entries(filters).forEach(([column, value]) => {
        if (value) {
          params.append(column, value)
        }
      })
      
      const response = await fetch(`/api/table-data?${params}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to load data')
      }
      
      setData(result.data || [])
      setTotalCount(result.totalCount || 0)
    } catch (err) {
      setError(err.message)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const handleFilter = (column, value) => {
    setFilters({ ...filters, [column]: value })
    setPage(1) // Reset to first page when filtering
  }

  const handleCellEdit = async (id, column, value) => {
    try {
      const response = await fetch('/api/table-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: selectedTable,
          id,
          column,
          value
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update')
      }
      
      // Refresh data
      loadData()
      setEditingCell(null)
    } catch (err) {
      alert('Failed to update: ' + err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this record?')) {
      return
    }
    
    try {
      const response = await fetch('/api/table-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: selectedTable,
          id
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete')
      }
      
      // Refresh data
      loadData()
    } catch (err) {
      alert('Failed to delete: ' + err.message)
    }
  }

  const visibleColumnsList = Object.entries(visibleColumns)
    .filter(([_, visible]) => visible)
    .map(([col]) => col)

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-content">
          <h1>Table Editor</h1>
          
          {/* Table selector */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ marginRight: '10px' }}>Select table:</label>
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              style={{
                padding: '8px',
                fontSize: '16px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            >
              {Object.entries(TABLES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            
            <span style={{ marginLeft: '20px', color: '#666' }}>
              Total records: {totalCount}
            </span>
          </div>
          
          {/* Column visibility toggle */}
          <details style={{ marginBottom: '20px' }}>
            <summary style={{ cursor: 'pointer', padding: '10px', backgroundColor: '#f8f9fa' }}>
              Column Visibility
            </summary>
            <div style={{ padding: '10px', backgroundColor: '#f8f9fa', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {TABLE_COLUMNS[selectedTable].map(col => (
                <label key={col} style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={visibleColumns[col] || false}
                    onChange={(e) => setVisibleColumns({
                      ...visibleColumns,
                      [col]: e.target.checked
                    })}
                    style={{ marginRight: '5px' }}
                  />
                  {col}
                </label>
              ))}
            </div>
          </details>
          
          {/* Error display */}
          {error && (
            <div style={{
              padding: '10px',
              backgroundColor: '#fee',
              color: '#c00',
              borderRadius: '4px',
              marginBottom: '20px'
            }}>
              Error: {error}
            </div>
          )}
          
          {/* Table */}
          {loading ? (
            <p>Loading...</p>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '14px'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      {visibleColumnsList.map(col => (
                        <th
                          key={col}
                          style={{
                            padding: '10px',
                            borderBottom: '2px solid #dee2e6',
                            textAlign: 'left',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                            userSelect: 'none'
                          }}
                          onClick={() => handleSort(col)}
                        >
                          {col}
                          {sortColumn === col && (
                            <span> {sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </th>
                      ))}
                      <th style={{
                        padding: '10px',
                        borderBottom: '2px solid #dee2e6',
                        textAlign: 'center'
                      }}>
                        Actions
                      </th>
                    </tr>
                    <tr>
                      {visibleColumnsList.map(col => (
                        <th key={col} style={{ padding: '5px' }}>
                          <input
                            type="text"
                            placeholder="Filter..."
                            value={filters[col] || ''}
                            onChange={(e) => handleFilter(col, e.target.value)}
                            style={{
                              width: '100%',
                              padding: '4px',
                              fontSize: '12px',
                              border: '1px solid #ddd',
                              borderRadius: '2px'
                            }}
                          />
                        </th>
                      ))}
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, index) => (
                      <tr
                        key={row.id}
                        style={{
                          backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa'
                        }}
                      >
                        {visibleColumnsList.map(col => (
                          <td
                            key={col}
                            style={{
                              padding: '8px',
                              borderBottom: '1px solid #dee2e6',
                              maxWidth: '300px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                            title={row[col]}
                            onDoubleClick={() => setEditingCell(`${row.id}-${col}`)}
                          >
                            {editingCell === `${row.id}-${col}` ? (
                              <input
                                type="text"
                                defaultValue={row[col] || ''}
                                onBlur={(e) => handleCellEdit(row.id, col, e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleCellEdit(row.id, col, e.target.value)
                                  }
                                }}
                                style={{
                                  width: '100%',
                                  padding: '4px',
                                  border: '1px solid #007bff'
                                }}
                                autoFocus
                              />
                            ) : (
                              row[col] || <span style={{ color: '#ccc' }}>NULL</span>
                            )}
                          </td>
                        ))}
                        <td style={{
                          padding: '8px',
                          borderBottom: '1px solid #dee2e6',
                          textAlign: 'center'
                        }}>
                          <button
                            onClick={() => handleDelete(row.id)}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '2px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div style={{
                marginTop: '20px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '10px'
              }}>
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: page === 1 ? '#ccc' : '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: page === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  First
                </button>
                
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: page === 1 ? '#ccc' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: page === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Previous
                </button>
                
                <span>Page {page} of {totalPages}</span>
                
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: page === totalPages ? '#ccc' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: page === totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  Next
                </button>
                
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: page === totalPages ? '#ccc' : '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: page === totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  Last
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
