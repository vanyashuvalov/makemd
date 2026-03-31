/**
 * File: src/widgets/sidebar/ui/sidebar.tsx
 * Purpose: Figma-inspired navigation rail for account, create, history, and support.
 * Why it exists: the sidebar is the main control surface in the design and keeps document navigation predictable.
 * What it does: composes the account header, primary action, tabs, warnings, selection actions, history list, and footer.
 * Connected to: `WorkspaceSnapshot`, document entities, and the editor/preview shell.
 */
'use client'

import { Alert } from '@/shared/ui/alert'
import { Avatar } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import { IconButton } from '@/shared/ui/icon-button'
import { Tabs } from '@/shared/ui/tabs'
import { Icon } from '@/shared/ui/icon'
import { Separator } from '@/shared/ui/separator'
import { CreateDocumentButton } from '@/features/document-create/ui/create-document-button'
import { DocumentList } from './document-list'
import type { DocumentRecord, WorkspaceSnapshot } from '@/entities/document/model/types'
import {
  IconAlertTriangle,
  IconClipboardList,
  IconHelpCircle,
  IconHistory,
  IconLogin2,
} from '@tabler/icons-react'

export interface SidebarProps {
  snapshot: WorkspaceSnapshot
  documents: DocumentRecord[]
  selectionMode: boolean
  selectedCount: number
  totalCount: number
  helperText?: string
  onToggleAllSelection: (checked: boolean) => void
  onToggleDocument: (documentId: string) => void
}

export function Sidebar({
  snapshot,
  documents,
  selectionMode,
  selectedCount,
  totalCount,
  helperText = 'Hold Ctrl to select many',
  onToggleAllSelection,
  onToggleDocument,
}: SidebarProps) {
  // Render the dense navigation rail used in the Figma side-bar states.
  return (
    <aside className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[16px] border border-sidebar-border bg-[color:var(--color-sidebar-surface)] text-sidebar-foreground">
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
                <IconButton as="span" variant="neutral" aria-hidden>
                  <Icon icon={IconLogin2} size="md" tone="sidebarMuted" />
                </IconButton>
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
            { value: 'history', label: 'History', icon: IconHistory },
            { value: 'documents', label: 'Documents', icon: IconClipboardList },
          ]}
          value="history"
          compact
        />

        {snapshot.warning ? (
          <Alert
            tone="warning"
            title={snapshot.warning.title}
            description={snapshot.warning.description}
            icon={<Icon icon={IconAlertTriangle} size="sm" className="text-[#f2c46f]" />}
            className="border-[#5a4823] bg-[#40321b]"
          />
        ) : null}

        <DocumentList
          documents={documents}
          selectionMode={selectionMode}
          selectedCount={selectedCount}
          totalCount={totalCount}
          helperText={helperText}
          onToggleAllSelection={onToggleAllSelection}
          onToggleDocument={onToggleDocument}
        />
      </div>

      <div className="space-y-4 px-6 py-4">
        <Separator className="bg-sidebar-border" />
        <div className="flex items-center justify-between text-sm text-sidebar-muted-foreground">
          <span>makemd &copy; 2026</span>
          <a
            href="#help"
            className="inline-flex items-center gap-2 text-sidebar-foreground/60 transition-opacity duration-150 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Icon icon={IconHelpCircle} size="sm" tone="sidebarMuted" />
            <span>Help</span>
          </a>
        </div>
      </div>
    </aside>
  )
}
