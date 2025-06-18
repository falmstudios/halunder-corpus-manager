'use client'

import { useState, useEffect } from 'react'

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
    const initialVisible = {}
    columns.forEach(col => {
      // Show first 6 columns by default
      initialVisible[col] = columns.indexOf(col) < 6
    })
    setVisibleColumns(initialVisible)
    setPage(1)
    setFilters({}) // Clear filters when changing tables
    loadData()
  }, [selectedTable])

  useEffect(() => {
    loadData()
  }, [page, sortColumn, sortDirection, filters, pageSize])

  const loadData = async () => {
    setLoading(true)
    setError('')
    
    try {
      const params = new URLSearchParams({
        table: selectedTable,
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(sortColumn && { sortColumn, sortDirection }),
        ...filters
      })

      const response = await fetch(`/api/table-data?${params}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to load data')
      }
      
      setData(result.data)
      setTotalCount(result.totalCount)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleColumn = (column) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }))
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
    setFilters(prev => {
      const newFilters = { ...prev }
      if (value.trim() === '') {
        delete newFilters[column]
      } else {
        newFilters[column] = value
      }
      return newFilters
    })
    setPage(1)
  }

  const clearAllFilters = () => {
    setFilters({})
    setPage(1)
  }

  const handleCellEdit = async (rowId, column, newValue) => {
    try {
      const response = await fetch('/api/table-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: selectedTable,
          id: rowId,
          column,
          value: newValue
        })
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to update')
      }

      loadData() // Reload data
      setEditingCell(null)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteRow = async (rowId) => {
    if (!confirm('Are you sure you want to delete this row?')) return

    try {
      const response = await fetch('/api/table-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: selectedTable,
          id: rowId
        })
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to delete')
      }

      loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  const visibleCols = TABLE_COLUMNS[selectedTable].filter(col => visibleColumns[col])
  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div style={{ padding: '20px', maxWidth: '100vw', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Table Editor</h1>
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
          Back to Upload
        </a>
      </div>

      {/* Controls Row */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Table Selection */}
        <div>
          <label style={{ fontWeight: 'bold', marginRight: '10px' }}>Table:</label>
          <select 
            value={selectedTable} 
            onChange={(e) => setSelectedTable(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            {Object.entries(TABLES).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* Page Size */}
        <div>
          <label style={{ fontWeight: 'bold', marginRight: '10px' }}>Rows per page:</label>
          <select 
            value={pageSize} 
            onChange={(e) => setPageSize(parseInt(e.target.value))}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
        </div>

        {/* Clear Filters */}
        <button
          onClick={clearAllFilters}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ffc107',
            color: '#212529',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Clear All Filters
        </button>
      </div>

      {/* Column Visibility Controls */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <h3>Show/Hide Columns:</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {TABLE_COLUMNS[selectedTable].map(column => (
            <label key={column} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type="checkbox"
                checked={visibleColumns[column] || false}
                onChange={() => toggleColumn(column)}
              />
              <span style={{ fontSize: '14px' }}>{column}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
        <h3>Filters: <small style={{ fontWeight: 'normal', color: '#666' }}>
          (Use "NULL" for empty fields, "NOT_NULL" for non-empty fields, "EMPTY" for empty strings)
        </small></h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          {visibleCols.map(column => (
            <div key={column}>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '2px' }}>{column}:</label>
              <input
                type="text"
                placeholder={`Filter ${column}...`}
                value={filters[column] || ''}
                onChange={(e) => handleFilter(column, e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '6px', 
                  borderRadius: '3px', 
                  border: '1px solid #ccc',
                  fontSize: '12px'
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Data Count */}
      <div style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
        Total records: {totalCount} | Page {page} of {totalPages}
        {Object.keys(filters).length > 0 && (
          <span style={{ marginLeft: '10px', color: '#007bff' }}>
            (Filtered by: {Object.keys(filters).join(', ')})
          </span>
        )}
      </div>

      {error && (
        <div style={{
          padding: '10px',
          marginBottom: '20px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
      ) : (
        <>
          {/* Table */}
          <div style={{ overflowX: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '8px', border: '1px solid #ddd', minWidth: '60px' }}>Actions</th>
                  {visibleCols.map(column => (
                    <th 
                      key={column} 
                      style={{ 
                        padding: '8px', 
                        border: '1px solid #ddd', 
                        cursor: 'pointer',
                        minWidth: '120px',
                        backgroundColor: sortColumn === column ? '#e3f2fd' : '#f8f9fa'
                      }}
                      onClick={() => handleSort(column)}
                    >
                      {column} 
                      {sortColumn === column && (
                        <span style={{ marginLeft: '5px' }}>
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, rowIndex) => (
                  <tr key={row.id} style={{ backgroundColor: rowIndex % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                    <td style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'center' }}>
                      <button
                        onClick={() => handleDeleteRow(row.id)}
                        style={{
                          padding: '2px 6px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          fontSize: '10px',
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button>
                    </td>
                    {visibleCols.map(column => (
                      <td 
                        key={column} 
                        style={{ 
                          padding: '4px', 
                          border: '1px solid #ddd',
                          maxWidth: '200px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        onDoubleClick={() => setEditingCell(`${row.id}-${column}`)}
                      >
                        {editingCell === `${row.id}-${column}` ? (
                          <input
                            type="text"
                            defaultValue={row[column] || ''}
                            autoFocus
                            onBlur={(e) => handleCellEdit(row.id, column, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleCellEdit(row.id, column, e.target.value)
                              } else if (e.key === 'Escape') {
                                setEditingCell(null)
                              }
                            }}
                            style={{ 
                              width: '100%', 
                              padding: '2px',
                              border: '1px solid #007bff',
                              borderRadius: '2px',
                              fontSize: '12px'
                            }}
                          />
                        ) : (
                          <span title={row[column]} style={{ cursor: 'pointer' }}>
                            {typeof row[column] === 'object' 
                              ? JSON.stringify(row[column]) 
                              : String(row[column] || '')}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '10px', 
            marginTop: '20px' 
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
  )
}
