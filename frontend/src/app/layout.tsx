import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Lys Atelier - Listas de Casamento',
  description:
    'Crie a sua lista de casamento personalizada e partilhe com os seus convidados. Presentes unicos e experiencias inesqueciveis.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt">
      <body className="antialiased">{children}</body>
    </html>
  )
}
