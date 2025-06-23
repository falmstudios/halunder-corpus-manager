export default function AlphabetSidebar({ onLetterSelect, selectedLetter }) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  
  return (
    <div style={{
      width: '60px',
      backgroundColor: '#f8f9fa',
      borderRight: '1px solid #ddd',
      padding: '10px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <h3 style={{ 
        margin: '0 0 10px 0', 
        fontSize: '14px',
        writingMode: 'vertical-rl',
        textOrientation: 'mixed'
      }}>
        A-Z
      </h3>
      
      {letters.map(letter => (
        <button
          key={letter}
          onClick={() => onLetterSelect(letter.toLowerCase())}
          style={{
            width: '40px',
            height: '30px',
            margin: '2px 0',
            backgroundColor: selectedLetter === letter.toLowerCase() ? '#007bff' : 'transparent',
            color: selectedLetter === letter.toLowerCase() ? 'white' : '#333',
            border: '1px solid transparent',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (selectedLetter !== letter.toLowerCase()) {
              e.target.style.backgroundColor = '#e9ecef'
            }
          }}
          onMouseLeave={(e) => {
            if (selectedLetter !== letter.toLowerCase()) {
              e.target.style.backgroundColor = 'transparent'
            }
          }}
        >
          {letter}
        </button>
      ))}
    </div>
  )
}
