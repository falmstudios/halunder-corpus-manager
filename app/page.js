'use client'

import { useState } from 'react'
import FileUpload from './FileUpload'

export default function HomePage() {
  const [uploadResults, setUploadResults] = useState([])

  const handleUploadComplete = (result) => {
    setUploadResults(prev => [...prev, result])
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
        Halunder Corpus Management System
      </h1>
      
      {/* Navigation Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px',
        marginBottom: '40px'
      }}>
        <a 
          href="/review" 
          style={{
            padding: '30px',
            backgroundColor: '#007bff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            textAlign: 'center',
            transition: 'transform 0.2s',
            display: 'block'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <h2 style={{ margin: '0 0 10px 0' }}>✏️ Text Review</h2>
          <p style={{ margin: 0, fontSize: '14px' }}>
            Review and categorize texts, edit metadata, process sentences
          </p>
        </a>
        
        <a 
          href="/corpus" 
          style={{
            padding: '30px',
            backgroundColor: '#28a745',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            textAlign: 'center',
            transition: 'transform 0.2s',
            display: 'block'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <h2 style={{ margin: '0 0 10px 0' }}>📚 Corpus Viewer</h2>
          <p style={{ margin: 0, fontSize: '14px' }}>
            View processed parallel sentences and linguistic features
          </p>
        </a>
        
        <a 
          href="/editor" 
          style={{
            padding: '30px',
            backgroundColor: '#6c757d',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            textAlign: 'center',
            transition: 'transform 0.2s',
            display: 'block'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <h2 style={{ margin: '0 0 10px 0' }}>🗃️ Table Editor</h2>
          <p style={{ margin: 0, fontSize: '14px' }}>
            Direct database access for advanced editing
          </p>
        </a>

        <a 
          href="/dictionary" 
          style={{
            padding: '30px',
            backgroundColor: '#17a2b8',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            textAlign: 'center',
            transition: 'transform 0.2s',
            display: 'block'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <h2 style={{ margin: '0 0 10px 0' }}>📖 Wörterbuch</h2>
          <p style={{ margin: 0, fontSize: '14px' }}>
            Browse and manage the Halunder dictionary
          </p>
        </a>
      </div>

      {/* File Upload Section */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '30px', 
        borderRadius: '8px',
        marginBottom: '30px'
      }}>
        <h2 style={{ marginBottom: '20px' }}>Upload JSON Files</h2>
        <FileUpload onUploadComplete={handleUploadComplete} />
      </div>

      {/* Upload Results */}
      {uploadResults.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h3>Recent Uploads</h3>
          {uploadResults.map((result, index) => (
            <div 
              key={index} 
              style={{ 
                padding: '15px', 
                backgroundColor: result.error ? '#ffebee' : '#e8f5e9',
                borderRadius: '4px',
                marginBottom: '10px'
              }}
            >
              {result.error ? (
                <span style={{ color: '#c62828' }}>❌ Error: {result.error}</span>
              ) : (
                <span style={{ color: '#2e7d32' }}>
                  ✅ Processed {result.processed} documents from {result.filename}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Workflow Guide */}
      <div style={{ marginTop: '40px' }}>
        <h3>Workflow Guide</h3>
        <div style={{ display: 'grid', gap: '15px' }}>
          <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <h3 style={{ color: '#007bff', margin: '0 0 10px 0' }}>1. Upload JSON Files</h3>
            <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
              Start by uploading your digitized Helgolandic texts in JSON format using the upload form above.
            </p>
            <div style={{ fontSize: '12px', color: '#666' }}>
              ✓ Automatic duplicate detection<br/>
              ✓ Progress tracking<br/>
              ✓ Bulk upload support
            </div>
          </div>

          <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <h3 style={{ color: '#dc3545', margin: '0 0 10px 0' }}>2. Review Texts</h3>
            <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
              Use the Text Review interface to manually review, edit, and categorize your texts into buckets for processing.
            </p>
            <div style={{ fontSize: '12px', color: '#666' }}>
              ✏️ Edit metadata and content<br/>
              📂 Sort into processing buckets<br/>
              💾 Auto-save functionality
            </div>
          </div>

          <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <h3 style={{ color: '#6f42c1', margin: '0 0 10px 0' }}>3. Process & View Sentences</h3>
            <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
              Generate parallel sentence pairs using AI in the Text Review interface, then view processed corpus data.
            </p>
            <div style={{ fontSize: '12px', color: '#666' }}>
              🤖 AI-powered sentence alignment<br/>
              📝 Linguistic feature extraction<br/>
              📈 Vocabulary tracking
            </div>
          </div>

          <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <h3 style={{ color: '#28a745', margin: '0 0 10px 0' }}>4. Manage Data</h3>
            <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
              Use the Table Editor for advanced data management, filtering, and bulk operations across all database tables.
            </p>
            <div style={{ fontSize: '12px', color: '#666' }}>
              🔍 Advanced filtering options<br/>
              📋 Bulk edit capabilities<br/>
              🗃️ Full database access
            </div>
          </div>

          <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <h3 style={{ color: '#17a2b8', margin: '0 0 10px 0' }}>5. Browse Dictionary</h3>
            <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
              Access the comprehensive Halunder-German dictionary with search, editing, and import capabilities.
            </p>
            <div style={{ fontSize: '12px', color: '#666' }}>
              📖 Multiple dictionary sources<br/>
              🔍 Advanced search features<br/>
              ➕ Add entries from corpus
            </div>
          </div>
        </div>

        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffeaa7' }}>
          <h4 style={{ color: '#856404', margin: '0 0 10px 0' }}>💡 Workflow Tips</h4>
          <ol style={{ margin: 0, paddingLeft: '20px', color: '#856404' }}>
            <li>Start by uploading your JSON files</li>
            <li>Review and mark texts as "Parallel Confirmed" in Text Review</li>
            <li>Use the "Copy JSON Prompt" button to get AI sentence processing</li>
            <li>Paste AI response into the sentence processor within Text Review</li>
            <li>View and edit processed sentences directly in Text Review</li>
            <li>Use Corpus Viewer for overview of all processed data</li>
            <li>Browse and expand the dictionary with new findings</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
