// app/layout.tsx
// import { useEffect } from 'react';
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'InferProbe – Offline ML API Debugger',
  description: 'Debug and mock ML endpoints offline with privacy-first design.',
  manifest: '/manifest.json',
  themeColor: '#6366f1',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'InferProbe',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#6366f1" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        {/* Apple-specific PWA icons/meta */}
        <link rel="apple-touch-icon" href="/apple-icon.png" />
      </head>
      <body className={inter.className}>
        <ServiceWorkerRegister /> {/* Registers and manages SW client-side */}
        {children}
      </body>
    </html>
  )
}
