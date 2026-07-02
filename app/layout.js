import './globals.css'

export const metadata = {
  title: 'Vila Iorga 4',
  description: 'Administrare consum apa',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ro">
      <body>{children}</body>
    </html>
  )
}
