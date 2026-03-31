'use client'

/**
 * File: src/widgets/app-shell/ui/app-shell.tsx
 * Purpose: Top-level composition that mirrors the three-panel Figma layout.
 * Why it exists: the page needs one place that wires the sidebar, markdown, preview, and mobile fallback together.
 * What it does: lays out the desktop three-column shell and the mobile single-column fallback.
 * Connected to: `Sidebar`, `MarkdownPane`, `PreviewPane`, `EditorPreview`, `ExportBar`, and the workspace snapshot model.
 */
import { useState } from 'react'
import { EditorPreview, MarkdownPane, PreviewPane } from '@/widgets/editor-preview/ui/editor-preview'
import { ExportBar } from '@/widgets/export-bar/ui/export-bar'
import { Sidebar } from '@/widgets/sidebar/ui/sidebar'
import type { WorkspaceSnapshot } from '@/entities/document/model/types'

export function AppShell({ snapshot }: { snapshot: WorkspaceSnapshot }) {
  const [markdown, setMarkdown] = useState(snapshot.editor.markdown)

  // Keep the desktop layout as three full-height columns while preserving a mobile fallback for narrow viewports.
  return (
    <section className="h-full min-h-0">
      <div className="hidden h-full min-h-0 gap-2 lg:grid lg:grid-cols-[20%_minmax(0,1fr)_minmax(0,1fr)]">
        <Sidebar snapshot={snapshot} />

        <MarkdownPane
          value={markdown}
          onChange={setMarkdown}
          placeholder={snapshot.prompt?.title ?? 'Start writing markdown'}
        />

        <div className="relative min-h-0">
          <PreviewPane markdown={markdown} />
          <ExportBar fileName={snapshot.exportFileName} />
        </div>
      </div>

      <div className="h-full min-h-0 lg:hidden">
        <EditorPreview
          markdown={markdown}
          onMarkdownChange={setMarkdown}
          placeholder={snapshot.prompt?.title ?? 'Start writing markdown'}
        />
      </div>
    </section>
  )
}
