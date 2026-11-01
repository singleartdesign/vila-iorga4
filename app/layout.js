import './globals.css'
import FundalApa from './FundalApa'

export const metadata = {
  title: 'Vila Iorga 4',
  description: 'Administrare consum apa',
  appleWebApp: { capable: true, title: 'Iorga 4 Apă', statusBarStyle: 'default' },
}

export const viewport = { themeColor: '#0b2545' }

export default function RootLayout({ children }) {
  return (
    <html lang="ro">
      <body><FundalApa />{children}</body>
    </html>
  )
}
