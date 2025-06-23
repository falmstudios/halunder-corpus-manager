export default function DictionarySearch({ onSearch, searchTerm, searchType }) {
  return (
    <div style={{ display: 'flex', gap: '10px' }}>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => onSearch(e.target.value, searchType)}
        placeholder="Wort suchen..."
        style={{
          flex: 1,
          padding: '10px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontSize: '16px'
        }}
      />
      
      <select
        value={searchType}
        onChange={(e) => onSearch(searchTerm, e.target.value)}
        style={{
          padding: '10px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontSize: '16px'
        }}
      >
        <option value="both">Halunder & Deutsch</option>
        <option value="halunder">Nur Halunder</option>
        <option value="german">Nur Deutsch</option>
      </select>
    </div>
  )
}
