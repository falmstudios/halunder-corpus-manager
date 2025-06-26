'use client'

import Link from 'next/link'
import FileUpload from './FileUpload'
import Navbar from './components/Navbar'

export default function Home() {
  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-content">
          <h1>Halunder Corpus Management System</h1>
          
          <div style={{ marginBottom: '40px' }}>
            <h2>Upload JSON Files</h2>
            <FileUpload />
          </div>

          <div>
            <h2>Quick Navigation</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
              <Link href="/review" style={{
                display: 'block',
                padding: '20px',
                backgroundColor: '#3498db',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                textAlign: 'center',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ margin: '0 0 5px 0', color: 'white' }}>Text Review</h3>
                <p style={{ margin: 0, fontSize: '14px' }}>Review and categorize uploaded texts</p>
              </Link>

              <Link href="/corpus" style={{
                display: 'block',
                padding: '20px',
                backgroundColor: '#27ae60',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                textAlign: 'center',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ margin: '0 0 5px 0', color: 'white' }}>Corpus Viewer</h3>
                <p style={{ margin: 0, fontSize: '14px' }}>View all processed parallel sentences</p>
              </Link>

              <Link href="/dictionary" style={{
                display: 'block',
                padding: '20px',
                backgroundColor: '#f39c12',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                textAlign: 'center',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ margin: '0 0 5px 0', color: 'white' }}>Dictionary</h3>
                <p style={{ margin: 0, fontSize: '14px' }}>Browse and manage dictionary entries</p>
              </Link>

              <Link href="/analyze" style={{
                display: 'block',
                padding: '20px',
                backgroundColor: '#e74c3c',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                textAlign: 'center',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ margin: '0 0 5px 0', color: 'white' }}>Sentence Analysis</h3>
                <p style={{ margin: 0, fontSize: '14px' }}>Analyze Halunder sentences with dictionary</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
