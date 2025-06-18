'use client'

import { useState } from 'react'

export default function Home() {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files)
    setFiles(selectedFiles)
    setMessage('')
  }

  const uploadFiles = async () => {
    if (files.length === 0) {
      setMessage('Please select JSON files first')
      return
    }

    setUploading(true)
    setMessage('Uploading files...')

    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }
      }
      
      setMessage(`Successfully uploaded ${files.length} file(s)!`)
      setFiles([])
      // Reset file input
      document.getElementById('fileInput').value = ''
      
    } catch (error) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
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

      {files.length > 0 && (
        <div style={{ margin: '20px 0' }}>
          <h3>Selected Files:</h3>
          <ul>
            {files.map((file, index) => (
              <li key={index}>{file.name}</li>
            ))}
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
    </div>
  )
}
