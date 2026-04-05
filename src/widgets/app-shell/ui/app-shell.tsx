/**
 * File: src/widgets/app-shell/ui/app-shell.tsx
 * Purpose: Top-level composition that mirrors the three-panel Figma layout.
 * Why it exists: the page needs one place that wires the sidebar, markdown, preview, and mobile fallback together.
 * What it does: lays out the desktop three-column shell and the mobile single-column fallback.
 * Connected to: `Sidebar`, `WorkspaceShellClient`, and the workspace snapshot model.
 */
import { WorkspaceShellClient } from '@/widgets/app-shell/ui/workspace-shell-client'
import type { WorkspaceSnapshot } from '@/entities/document/model/types'

export function AppShell({ snapshot, helpMarkdown }: { snapshot: WorkspaceSnapshot; helpMarkdown: string }) {
  // Keep the outer shell server-rendered and hand off only the interactive markdown region to the client wrapper.
  return (
    <section className="h-full min-h-0">
      <WorkspaceShellClient snapshot={snapshot} helpMarkdown={helpMarkdown} />
    </section>
  )
}
