import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import NetworkStatusBanner from './components/NetworkStatusBanner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NoveResto — Dashboard',
  description: 'Plateforme IA de gestion de restaurants MENA',
  manifest: '/app/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#0D2137',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={inter.className} style={{ background: 'var(--bg-page)', color: 'var(--text-primary)', margin: 0 }}>
        <NetworkStatusBanner />
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/app/sw.js', { scope: '/app/' }).catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
