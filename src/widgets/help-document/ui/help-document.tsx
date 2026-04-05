'use client'

/**
 * File: src/widgets/help-document/ui/help-document.tsx
 * Purpose: Read-only document surface for the workspace Help view.
 * Why it exists: Help should feel like a real document in the same workspace shell, not a modal or a separate editor workflow.
 * What it does: renders the shared preview surface full-width without exposing the markdown source editor.
 * Connected to: `PreviewPane`, the workspace shell help toggle, and the server-loaded Help markdown content.
 */
import { PreviewPane } from '@/widgets/editor-preview/ui/editor-preview'

export interface HelpDocumentProps {
  markdown: string
}

// Render Help as a regular read-only document so the sidebar remains visible while the right-hand workspace area switches into documentation mode.
export function HelpDocument({ markdown }: HelpDocumentProps) {
  return (
    <section className="h-full min-h-0">
      <PreviewPane markdown={markdown} />
    </section>
  )
}
