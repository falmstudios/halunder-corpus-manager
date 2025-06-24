'use client'

export default function AlphabetSidebar({ onLetterSelect, selectedLetter }) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ'.split('')
  
  return (
    <div style={{
      width: '60px',
      backgroundColor: '#f8f9fa',
      borderRight: '1px solid #ddd',
      padding: '20px 0',
      overflowY: 'auto'
    }}>
      <button
        onClick={() => onLetterSelect(null)}
        style={{
          width: '40px',
          height: '40px',
          margin: '0 10px 5px',
          border: '1px solid #ddd',
          backgroundColor: !selectedLetter ? '#007bff' : '#fff',
          color: !selectedLetter ? '#fff' : '#333',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 'bold'
        }}
      >
        Alle
      </button>
      
      {alphabet.map(letter => (
        <button
          key={letter}
          onClick={() => onLetterSelect(letter)}
          style={{
            width: '40px',
            height: '40px',
            margin: '0 10px 5px',
            border: '1px solid #ddd',
            backgroundColor: selectedLetter === letter ? '#007bff' : '#fff',
            color: selectedLetter === letter ? '#fff' : '#333',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          {letter}
        </button>
      ))}
    </div>
  )
}
