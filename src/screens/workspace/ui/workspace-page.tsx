/**
 * File: src/screens/workspace/ui/workspace-page.tsx
 * Purpose: Page-level composition for the main makemd workspace screen.
 * Why it exists: the Figma node describes a complete app viewport, not a marketing-style page with extra chrome.
 * What it does: renders the workspace shell on a full-height canvas so the layout matches the design frame.
 * Connected to: `AppShell`, the workspace snapshot data, and the route-level state selection in `src/app/page.tsx`.
 */
import type { WorkspaceSnapshot } from '@/entities/document/model/types'
import { AppShell } from '@/widgets/app-shell/ui/app-shell'

export function WorkspacePage({ snapshot, helpMarkdown }: { snapshot: WorkspaceSnapshot; helpMarkdown: string }) {
  // Keep the page background flat and neutral so the viewport reads like the Figma frame instead of a decorative landing page.
  return (
    <main className="min-h-screen overflow-hidden bg-[color:var(--color-canvas)] p-3 text-foreground">
      <div className="h-[calc(100vh-1.5rem)] w-full">
        <AppShell snapshot={snapshot} helpMarkdown={helpMarkdown} />
      </div>
    </main>
  )
}
