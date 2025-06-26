import './globals.css'

export const metadata = {
  title: 'Halunder Corpus Management System',
  description: 'Manage and analyze Halunder language corpus data',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
