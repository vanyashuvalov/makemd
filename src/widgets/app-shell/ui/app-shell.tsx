/**
 * File: src/widgets/app-shell/ui/app-shell.tsx
 * Purpose: Top-level composition that mirrors the three-panel Figma layout.
 * Why it exists: the page needs one place that wires the sidebar, workspace, and export affordances together.
 * What it does: lays out the sidebar and editor/preview surface as a responsive shell.
 * Connected to: `Sidebar`, `EditorPreview`, `ExportBar`, and the workspace snapshot model.
 */
import { EditorPreview } from '@/widgets/editor-preview/ui/editor-preview'
import { ExportBar } from '@/widgets/export-bar/ui/export-bar'
import { Sidebar } from '@/widgets/sidebar/ui/sidebar'
import type { WorkspaceSnapshot } from '@/entities/document/model/types'

export function AppShell({ snapshot }: { snapshot: WorkspaceSnapshot }) {
  // Keep the column gap tight so the layout feels like a dense desktop workspace rather than a dashboard.
  return (
    <section className="grid min-h-full items-start gap-3 lg:grid-cols-[22.5rem_minmax(0,1fr)] lg:gap-3">
      <Sidebar snapshot={snapshot} />

      <div className="relative min-w-0">
        <EditorPreview snapshot={snapshot} />
        <ExportBar fileName={snapshot.exportFileName} />
      </div>
    </section>
  )
}