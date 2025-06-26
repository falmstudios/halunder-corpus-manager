'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()
  
  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/review', label: 'Text Review' },
    { href: '/corpus', label: 'Corpus' },
    { href: '/corpus-review', label: 'Quality Review' },
    { href: '/dictionary', label: 'Dictionary' },
    { href: '/analyze', label: 'Analyze' },
    { href: '/editor', label: 'Table Editor' }
  ]

  return (
    <nav style={{
      backgroundColor: '#2c3e50',
      padding: '0',
      marginBottom: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px'
      }}>
        <Link href="/" style={{
          color: 'white',
          textDecoration: 'none',
          fontSize: '20px',
          fontWeight: 'bold',
          padding: '15px 0'
        }}>
          Halunder Corpus
        </Link>
        
        <div style={{
          display: 'flex',
          gap: '0',
          alignItems: 'center'
        }}>
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                color: pathname === item.href ? '#3498db' : 'white',
                textDecoration: 'none',
                padding: '15px 20px',
                display: 'block',
                backgroundColor: pathname === item.href ? '#34495e' : 'transparent',
                transition: 'background-color 0.2s',
                fontSize: '14px'
              }}
              onMouseEnter={(e) => {
                if (pathname !== item.href) {
                  e.target.style.backgroundColor = '#34495e'
                }
              }}
              onMouseLeave={(e) => {
                if (pathname !== item.href) {
                  e.target.style.backgroundColor = 'transparent'
                }
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
