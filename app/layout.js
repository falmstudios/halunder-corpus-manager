export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
          <h1>Halunder Corpus Manager</h1>
          {children}
        </div>
      </body>
    </html>
  )
}
