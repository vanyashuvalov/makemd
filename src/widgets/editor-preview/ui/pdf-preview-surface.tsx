'use client'

/**
 * File: src/widgets/editor-preview/ui/pdf-preview-surface.tsx
 * Purpose: Export-friendly markdown surface that mirrors the preview styling without layout chrome.
 * Why it exists: PDF export needs the same rendered markdown content as the right panel, but without scroll containers or full-height shell constraints.
 * What it does: wraps the shared markdown renderer in a static card so html2pdf can capture a clean, paginated document.
 * Connected to: the workspace shell export flow, the preview renderer, and the document row/context menu download actions.
 */

import { MarkdownRenderer } from './markdown-renderer'

export function PdfPreviewSurface({
  markdown,
  width,
}: {
  markdown: string
  width?: number
}) {
  // Render the same preview content the user sees on the right, but without the card chrome so the PDF reads as exported markdown instead of another UI panel.
  return (
    <div
      className="bg-white px-8 py-8 text-foreground"
      style={width ? { width: `${width}px` } : undefined}
    >
      <MarkdownRenderer markdown={markdown} />
    </div>
  )
}
