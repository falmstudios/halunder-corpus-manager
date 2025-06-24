'use client'

import Link from 'next/link'
import FileUpload from './FileUpload'

export default function Home() {
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Halunder Corpus Management System</h1>
      
      <div style={{ marginBottom: '40px' }}>
        <h2>Upload JSON Files</h2>
        <FileUpload />
      </div>

      <div>
        <h2>Navigation</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <Link href="/review" style={{
            display: 'block',
            padding: '20px',
            backgroundColor: '#007bff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 5px 0' }}>Text Review</h3>
            <p style={{ margin: 0, fontSize: '14px' }}>Review and categorize texts</p>
          </Link>

          <Link href="/corpus" style={{
            display: 'block',
            padding: '20px',
            backgroundColor: '#28a745',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 5px 0' }}>Corpus Viewer</h3>
            <p style={{ margin: 0, fontSize: '14px' }}>View processed sentences</p>
          </Link>

          <Link href="/corpus-review" style={{
            display: 'block',
            padding: '20px',
            backgroundColor: '#17a2b8',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 5px 0' }}>Corpus Quality Review</h3>
            <p style={{ margin: 0, fontSize: '14px' }}>Review sentence pair quality</p>
          </Link>

          <Link href="/dictionary" style={{
            display: 'block',
            padding: '20px',
            backgroundColor: '#ffc107',
            color: '#212529',
            textDecoration: 'none',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 5px 0' }}>Dictionary</h3>
            <p style={{ margin: 0, fontSize: '14px' }}>Browse and edit dictionary</p>
          </Link>

          <Link href="/editor" style={{
            display: 'block',
            padding: '20px',
            backgroundColor: '#6c757d',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 5px 0' }}>Table Editor</h3>
            <p style={{ margin: 0, fontSize: '14px' }}>Direct database access</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
