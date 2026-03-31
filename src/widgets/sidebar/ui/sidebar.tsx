/**
 * File: src/widgets/sidebar/ui/sidebar.tsx
 * Purpose: Figma-inspired navigation rail for account, create, history, and support.
 * Why it exists: the sidebar is the main control surface in the design and keeps document navigation predictable.
 * What it does: composes the account header, primary action, tabs, warnings, selection actions, history list, and footer.
 * Connected to: `WorkspaceSnapshot`, document entities, and the editor/preview shell.
 */
import { AlertTriangle, Check, ClipboardList, HelpCircle, History, LogIn } from 'lucide-react'
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
  const helperText = snapshot.selection?.helperText ?? 'Hold Ctrl to select many'
  const helperTail = helperText.replace(/^Hold Ctrl\s*/, '') || helperText

  // Render the dense navigation rail used in the Figma side-bar states.
  return (
    <aside className="flex h-full min-h-[42rem] w-full max-w-[22.5rem] flex-col overflow-hidden rounded-[1.4rem] border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-[0_14px_34px_rgba(15,15,15,0.14)]">
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
            <Button
              variant="text"
              size="text"
              className="w-full"
              before={
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sidebar-foreground/60">
                  <LogIn className="h-6 w-6" />
                </span>
              }
            >
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
            icon={<AlertTriangle className="h-4 w-4 text-[#f2c46f]" />}
            className="border-[#5a4823] bg-[#40321b]"
          />
        ) : null}

        {!snapshot.warning && snapshot.selection?.helperText ? (
          <div className="flex items-center gap-3 rounded-[1rem] border border-sidebar-border bg-sidebar-muted px-4 py-3 text-sm text-sidebar-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-[0.4rem] border border-sidebar-border bg-sidebar text-xs font-medium">
                <Check className="h-3.5 w-3.5" />
              </div>
              <span className="font-medium">Hold</span>
            </div>
            <span className="rounded-full border border-sidebar-border bg-sidebar px-2 py-1 font-mono text-xs">
              Ctrl
            </span>
            <span className="text-sidebar-muted-foreground">{helperTail}</span>
          </div>
        ) : null}

        {hasSelection ? (
          <DocumentSelectionBar selectedCount={snapshot.selection?.selectedCount ?? 0} />
        ) : null}

        <DocumentHistoryList items={snapshot.documents} selectionMode={hasSelection} />
      </div>

      <div className="space-y-4 px-6 py-4">
        <Separator className="bg-sidebar-border" />
        <div className="flex items-center justify-between text-sm text-sidebar-muted-foreground">
          <span>makemd &copy; 2026</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 rounded-full px-3 text-sidebar-foreground hover:bg-white/[0.08] active:bg-white/[0.12]"
            before={<HelpCircle className="h-4 w-4" />}
          >
            Help
          </Button>
        </div>
      </div>
    </aside>
  )
}
