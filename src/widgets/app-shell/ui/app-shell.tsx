/**
 * File: src/widgets/app-shell/ui/app-shell.tsx
 * Purpose: Top-level composition that mirrors the three-panel Figma layout.
 * Why it exists: the home page needs one place that wires the sidebar, workspace, and export affordances together.
 * What it does: lays out the sidebar and editor/preview surface as a responsive shell.
 * Connected to: `Sidebar`, `EditorPreview`, `ExportBar`, and the workspace snapshot model.
 */
import { EditorPreview } from '@/widgets/editor-preview/ui/editor-preview'
import { ExportBar } from '@/widgets/export-bar/ui/export-bar'
import { Sidebar } from '@/widgets/sidebar/ui/sidebar'
import type { WorkspaceSnapshot } from '@/entities/document/model/types'

export function AppShell({ snapshot }: { snapshot: WorkspaceSnapshot }) {
  // Arrange the dashboard shell so the sidebar remains a strong anchor and the workspace stays spacious.
  return (
    <section className="grid min-h-full gap-4 lg:grid-cols-[22.5rem_minmax(0,1fr)] lg:gap-6">
      <Sidebar snapshot={snapshot} />

      <div className="relative min-w-0">
        <EditorPreview snapshot={snapshot} />
        <ExportBar fileName={snapshot.exportFileName} />
      </div>
    </section>
  )
}
