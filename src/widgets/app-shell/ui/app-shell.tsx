/**
 * File: src/widgets/app-shell/ui/app-shell.tsx
 * Purpose: Top-level composition that mirrors the three-panel Figma layout.
 * Why it exists: the page needs one place that wires the sidebar, markdown, preview, and mobile fallback together.
 * What it does: lays out the desktop three-column shell and the mobile single-column fallback.
 * Connected to: `Sidebar`, `WorkspaceShellClient`, and the workspace snapshot model.
 */
import { Sidebar } from '@/widgets/sidebar/ui/sidebar'
import { WorkspaceShellClient } from '@/widgets/app-shell/ui/workspace-shell-client'
import type { WorkspaceSnapshot } from '@/entities/document/model/types'

export function AppShell({ snapshot }: { snapshot: WorkspaceSnapshot }) {
  // Keep the outer shell server-rendered and hand off only the interactive markdown region to the client wrapper.
  return (
    <section className="h-full min-h-0">
      <WorkspaceShellClient snapshot={snapshot}>
        <Sidebar snapshot={snapshot} />
      </WorkspaceShellClient>
    </section>
  )
}
