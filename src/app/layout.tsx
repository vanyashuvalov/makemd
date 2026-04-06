/**
 * File: src/app/layout.tsx
 * Purpose: Root layout for the makemd App Router application.
 * Why it exists: every route needs a persistent shell for fonts, metadata, and base document structure.
 * What it does: wires Geist fonts, global styles, the root HTML/body scaffold, and Vercel Web Analytics.
 * Connected to: `src/app/globals.css`, the home page, Vercel's Analytics dashboard, and every future route rendered by Next.js.
 */
import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'makemd',
  description: 'Markdown to PDF workspace inspired by the current Figma mockups.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        {/* Render analytics after the shared app content so page views are captured from the single root shell. */}
        {children}
        <Analytics />
      </body>
    </html>
  )
}
