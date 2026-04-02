'use client'

'use client'

/**
 * File: src/widgets/editor-preview/ui/pdf-preview-surface.tsx
 * Purpose: Export-friendly markdown surface that mirrors the preview styling without layout chrome.
 * Why it exists: PDF export needs the same rendered markdown content as the right panel, but without scroll containers or full-height shell constraints.
 * What it does: wraps the shared markdown renderer in a static card so html2pdf can capture a clean, paginated document.
 * Connected to: the workspace shell export flow, the preview renderer, and the document row/context menu download actions.
 */

import { MarkdownRenderer } from './markdown-renderer'

export function PdfPreviewSurface({ markdown }: { markdown: string }) {
  // Render the same preview content the user sees on the right, but inside a static export frame so the PDF snapshot keeps the visual language without inherited viewport sizing.
  return (
    <div className="rounded-[16px] border border-border bg-card px-8 py-8">
      <MarkdownRenderer markdown={markdown} />
    </div>
  )
}
