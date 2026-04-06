/**
 * File: src/app/layout.tsx
 * Purpose: Root layout for the makemd App Router application.
 * Why it exists: every route needs a persistent shell for fonts, metadata, and base document structure.
 * What it does: wires Inter fonts, global styles, the root HTML/body scaffold, and Vercel Web Analytics.
 * Connected to: `src/app/globals.css`, the home page, Vercel's Analytics dashboard, and every future route rendered by Next.js.
 */
import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const interSans = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter-sans',
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
    <html lang="en" className={interSans.variable}>
      <body>
        {/* Render analytics after the shared app content so page views are captured from the single root shell. */}
        {children}
        <Analytics />
      </body>
    </html>
  )
}
