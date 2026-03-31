/**
 * File: src/screens/workspace/ui/workspace-page.tsx
 * Purpose: Page-level composition for the main makemd workspace screen.
 * Why it exists: the Figma node describes a complete app viewport, not a marketing-style page with extra chrome.
 * What it does: renders the workspace shell on a full-height warm background so the layout matches the design frame.
 * Connected to: `AppShell`, the workspace snapshot data, and the route-level state selection in `src/app/page.tsx`.
 */
import { AppShell } from '@/widgets/app-shell/ui/app-shell'
import type { WorkspaceSnapshot } from '@/entities/document/model/types'

export function WorkspacePage({ snapshot }: { snapshot: WorkspaceSnapshot }) {
  // Use a full-viewport background and tight outer padding so the canvas reads like the Figma desktop frame.
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(79,116,255,0.1),_transparent_28%),linear-gradient(180deg,#f5f1eb_0%,#efe7db_100%)] p-3 text-foreground">
      <div className="mx-auto min-h-[calc(100vh-1.5rem)] w-full max-w-[1920px]">
        <AppShell snapshot={snapshot} />
      </div>
    </main>
  )
}
