'use client'

import { useState } from 'react'

export default function FileUpload({ onUploadComplete }) {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState({})

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files)
    setFiles(selectedFiles)
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const formData = new FormData()
      formData.append('file', file)
      
      setProgress(prev => ({ ...prev, [file.name]: 0 }))
      
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        
        const result = await response.json()
        
        setProgress(prev => ({ ...prev, [file.name]: 100 }))
        
        onUploadComplete({
          filename: file.name,
          ...result
        })
        
      } catch (error) {
        console.error('Upload error:', error)
        onUploadComplete({
          filename: file.name,
          error: error.message
        })
      }
    }
    
    setUploading(false)
    setFiles([])
    setProgress({})
  }

  return (
    <div>
      <input
        type="file"
        multiple
        accept=".json"
        onChange={handleFileSelect}
        disabled={uploading}
        style={{
          marginBottom: '10px'
        }}
      />
      
      {files.length > 0 && (
        <>
          <div style={{ marginBottom: '10px' }}>
            Selected files: {files.map(f => f.name).join(', ')}
          </div>
          
          <button
            onClick={handleUpload}
            disabled={uploading}
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
          
          {Object.entries(progress).map(([filename, percent]) => (
            <div key={filename} style={{ marginTop: '10px' }}>
              <div>{filename}: {percent}%</div>
              <div style={{
                width: '100%',
                height: '10px',
                backgroundColor: '#e9ecef',
                borderRadius: '5px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${percent}%`,
                  height: '100%',
                  backgroundColor: '#007bff',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
