import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NoveResto — Dashboard',
  description: 'Plateforme IA de gestion de restaurants MENA',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={inter.className} style={{ background: 'var(--bg-page)', color: 'var(--text-primary)', margin: 0 }}>
        {children}
      </body>
    </html>
  )
}
