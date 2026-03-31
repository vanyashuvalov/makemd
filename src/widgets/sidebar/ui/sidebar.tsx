/**
 * File: src/widgets/sidebar/ui/sidebar.tsx
 * Purpose: Figma-inspired navigation rail for account, create, history, and support.
 * Why it exists: the sidebar is the main control surface in the design and keeps document navigation predictable.
 * What it does: composes the account header, primary action, tabs, warnings, selection actions, history list, and footer.
 * Connected to: `WorkspaceSnapshot`, document entities, and the editor/preview shell.
 */
import { ClipboardList, HelpCircle, History, LogIn } from 'lucide-react'
import { Alert } from '@/shared/ui/alert'
import { Avatar } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import { Tabs } from '@/shared/ui/tabs'
import { Separator } from '@/shared/ui/separator'
import { CreateDocumentButton } from '@/features/document-create/ui/create-document-button'
import { DocumentHistoryList } from '@/entities/document/ui/document-history-list'
import { DocumentSelectionBar } from '@/features/document-selection/ui/document-selection-bar'
import type { WorkspaceSnapshot } from '@/entities/document/model/types'

export function Sidebar({ snapshot }: { snapshot: WorkspaceSnapshot }) {
  const hasSelection = Boolean(snapshot.selection?.selectedCount && snapshot.selection.selectedCount > 0)

  // Render the full navigation rail with the same dense, dark treatment used in the Figma side-bar states.
  return (
    <aside className="flex h-full min-h-[42rem] w-full max-w-[22.5rem] flex-col overflow-hidden rounded-[1.75rem] border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-[0_30px_80px_rgba(15,15,15,0.26)]">
      <div className="flex-1 space-y-6 px-6 py-6">
        <div className="flex items-center gap-3">
          {snapshot.account ? (
            <>
              <Avatar name={snapshot.account.name} className="h-10 w-10" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-sidebar-foreground">
                  {snapshot.account.email}
                </p>
                <p className="text-xs text-sidebar-muted-foreground">Signed in</p>
              </div>
            </>
          ) : (
            <Button variant="ghost" className="w-full justify-center rounded-full bg-transparent text-sidebar-foreground hover:bg-white/[0.06]">
              <LogIn className="h-4 w-4" />
              Sign up
            </Button>
          )}
        </div>

        <CreateDocumentButton />

        <Tabs
          ariaLabel="Sidebar sections"
          items={[
            { value: 'history', label: 'History', icon: <History className="h-5 w-5" /> },
            { value: 'documents', label: 'Documents', icon: <ClipboardList className="h-5 w-5" /> },
          ]}
          value="history"
          compact
        />

        {snapshot.warning ? (
          <Alert
            tone="warning"
            title={snapshot.warning.title}
            description={snapshot.warning.description}
            className="border-none bg-[#3b311c]"
          />
        ) : null}

        {!snapshot.warning && snapshot.selection?.helperText ? (
          <div className="flex items-center gap-3 rounded-[1rem] border border-sidebar-border bg-sidebar-muted px-4 py-3 text-sm text-sidebar-foreground">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-[0.4rem] border border-sidebar-border bg-sidebar text-xs font-medium">
                <span className="mt-px">✓</span>
              </div>
              <span className="font-medium">Hold</span>
            </div>
            <span className="rounded-full border border-sidebar-border bg-sidebar px-2 py-1 font-mono text-xs">
              Ctrl
            </span>
            <span className="text-sidebar-muted-foreground">{snapshot.selection.helperText.replace('Hold Ctrl ', '')}</span>
          </div>
        ) : null}

        {hasSelection ? (
          <DocumentSelectionBar selectedCount={snapshot.selection?.selectedCount ?? 0} />
        ) : null}

        <DocumentHistoryList items={snapshot.documents} />
      </div>

      <div className="space-y-4 px-6 py-4">
        <Separator className="bg-sidebar-border" />
        <div className="flex items-center justify-between text-sm text-sidebar-muted-foreground">
          <span>makemd © 2026</span>
          <Button variant="ghost" size="sm" className="h-8 rounded-full px-3 text-sidebar-foreground hover:bg-white/[0.06]">
            <HelpCircle className="h-4 w-4" />
            Help
          </Button>
        </div>
      </div>
    </aside>
  )
}
