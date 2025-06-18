'use client'

import { useState } from 'react'

export default function Home() {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [progress, setProgress] = useState(0)
  const [uploadDetails, setUploadDetails] = useState(null)
  const [currentFile, setCurrentFile] = useState('')

  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files)
    setFiles(selectedFiles)
    setMessage('')
    setProgress(0)
    setUploadDetails(null)
    setCurrentFile('')
  }

  const uploadFiles = async () => {
    if (files.length === 0) {
      setMessage('Please select JSON files first')
      return
    }

    setUploading(true)
    setProgress(0)
    setMessage('Starting upload...')

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setCurrentFile(file.name)
        setMessage(`Uploading ${file.name}... (${i + 1}/${files.length})`)
        setProgress((i / files.length) * 100)
        
        const formData = new FormData()
        formData.append('file', file)
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        // Check if response is JSON
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text()
          console.error('Non-JSON response:', text)
          throw new Error(`Server returned HTML instead of JSON. Check server logs.`)
        }

        const result = await response.json()
        
        if (!response.ok) {
          throw new Error(result.error || `Failed to upload ${file.name}`)
        }
        
        setUploadDetails(result)
        setProgress(((i + 1) / files.length) * 100)
      }
      
      setMessage(`Successfully uploaded ${files.length} file(s)!`)
      setFiles([])
      setCurrentFile('')
      document.getElementById('fileInput').value = ''
      
    } catch (error) {
      console.error('Upload error:', error)
      setMessage(`Error: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Halunder Corpus Manager</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <a 
            href="/editor" 
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px'
            }}
          >
            Table Editor
          </a>
          <a 
            href="/review" 
            style={{
              padding: '10px 20px',
              backgroundColor: '#17a2b8',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px'
            }}
          >
            Text Review
          </a>
        </div>
      </div>

      <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>Upload JSON Files</h2>
        <p>Select your Halunder JSON files to upload to the database:</p>
        
        <div style={{ margin: '20px 0' }}>
          <input
            id="fileInput"
            type="file"
            multiple
            accept=".json"
            onChange={handleFileSelect}
            style={{ 
              padding: '10px', 
              border: '1px solid #ccc', 
              borderRadius: '4px',
              marginRight: '10px'
            }}
          />
          
          <button
            onClick={uploadFiles}
            disabled={uploading || files.length === 0}
            style={{
              padding: '10px 20px',
              backgroundColor: uploading ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: uploading ? 'not-allowed' : 'pointer'
            }}
          >
            {uploading ? 'Uploading...' : 'Upload Files'}
          </button>
        </div>

        {/* Progress Bar */}
        {uploading && (
          <div style={{ margin: '20px 0' }}>
            <div style={{ marginBottom: '10px' }}>
              Progress: {Math.round(progress)}%
              {currentFile && <span style={{ marginLeft: '10px', color: '#666' }}>({currentFile})</span>}
            </div>
            <div style={{
              width: '100%',
              backgroundColor: '#e9ecef',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progress}%`,
                backgroundColor: '#007bff',
                height: '20px',
                transition: 'width 0.3s ease'
              }}></div>
            </div>
          </div>
        )}

        {files.length > 0 && (
          <div style={{ margin: '20px 0' }}>
            <h3>Selected Files:</h3>
            <ul>
              {files.map((file, index) => {
                const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
                return (
                  <li key={index}>
                    {file.name} ({sizeMB} MB)
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {message && (
          <div style={{
            padding: '10px',
            margin: '20px 0',
            borderRadius: '4px',
            backgroundColor: message.includes('Error') ? '#ffebee' : '#e8f5e8',
            color: message.includes('Error') ? '#c62828' : '#2e7d32'
          }}>
            {message}
          </div>
        )}

        {/* Upload Details */}
        {uploadDetails && (
          <div style={{
            padding: '15px',
            margin: '20px 0',
            backgroundColor: '#e3f2fd',
            borderRadius: '4px',
            border: '1px solid #bbdefb'
          }}>
            <h4>Upload Summary:</h4>
            <p><strong>Total Documents:</strong> {uploadDetails.total}</p>
            <p><strong>Processed:</strong> {uploadDetails.processed}</p>
            <p><strong>Skipped:</strong> {uploadDetails.skipped}</p>
            <p><strong>Errors:</strong> {uploadDetails.errors}</p>
            {uploadDetails.errorDetails && uploadDetails.errorDetails.length > 0 && (
              <details style={{ marginTop: '10px' }}>
                <summary>Error Details</summary>
                <ul style={{ marginTop: '10px' }}>
                  {uploadDetails.errorDetails.map((error, index) => (
                    <li key={index}>
                      Document {error.documentIndex} ({error.filename}): {error.error}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
