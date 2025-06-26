export const metadata = {
  title: 'Halunder Corpus Management System',
  description: 'Manage and analyze Halunder language corpus data',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background-color: #f5f5f5;
          }

          * {
            box-sizing: border-box;
          }

          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
          }

          .page-content {
            background-color: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }

          h1 {
            color: #2c3e50;
            margin-top: 0;
          }

          h2 {
            color: #34495e;
          }

          h3 {
            color: #7f8c8d;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}} />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
