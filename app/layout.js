import './globals.css'

export const metadata = {
  title: 'Vila Iorga 4',
  description: 'Administrare consum apa',
  appleWebApp: { capable: true, title: 'Iorga 4 Apă', statusBarStyle: 'default' },
}

export const viewport = { themeColor: '#7c3aed' }

export default function RootLayout({ children }) {
  return (
    <html lang="ro">
      <body>{children}</body>
    </html>
  )
}
