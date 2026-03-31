/**
 * File: src/widgets/app-shell/ui/app-shell.tsx
 * Purpose: Top-level composition that mirrors the three-panel Figma layout.
 * Why it exists: the page needs one place that wires the sidebar, markdown, preview, and mobile fallback together.
 * What it does: lays out the desktop three-column shell and the mobile single-column fallback.
 * Connected to: `Sidebar`, `MarkdownPane`, `PreviewPane`, `EditorPreview`, `ExportBar`, and the workspace snapshot model.
 */
import { EditorPreview, MarkdownPane, PreviewPane } from '@/widgets/editor-preview/ui/editor-preview'
import { ExportBar } from '@/widgets/export-bar/ui/export-bar'
import { Sidebar } from '@/widgets/sidebar/ui/sidebar'
import type { WorkspaceSnapshot } from '@/entities/document/model/types'

export function AppShell({ snapshot }: { snapshot: WorkspaceSnapshot }) {
  // Keep the desktop layout as three full-height columns while preserving a mobile fallback for narrow viewports.
  return (
    <section className="h-full min-h-0">
      <div className="hidden h-full min-h-0 gap-2 lg:grid lg:grid-cols-[20%_minmax(0,1fr)_minmax(0,1fr)]">
        <Sidebar snapshot={snapshot} />

        <MarkdownPane lines={snapshot.editor.lines} />

        <div className="relative min-h-0">
          <PreviewPane title={snapshot.preview.title} note={snapshot.preview.note} body={snapshot.preview.body} />
          <ExportBar fileName={snapshot.exportFileName} />
        </div>
      </div>

      <div className="h-full min-h-0 lg:hidden">
        <EditorPreview snapshot={snapshot} />
      </div>
    </section>
  )
}