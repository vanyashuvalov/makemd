/**
 * File: src/app/layout.tsx
 * Purpose: Root layout for the makemd App Router application.
 * Why it exists: every route needs a persistent shell for fonts, metadata, and base document structure.
 * What it does: wires Geist fonts, global styles, and the root HTML/body scaffold.
 * Connected to: `src/app/globals.css`, the home page, and every future route rendered by Next.js.
 */
import type { Metadata } from 'next'
import './globals.css'

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
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
