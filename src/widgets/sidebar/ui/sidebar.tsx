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
import { cn } from '@/shared/lib/cn'
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
  compact?: boolean
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
  compact = false,
}: SidebarProps) {
  // Render the dense navigation rail used in the Figma side-bar states, switching to a more compact arrangement when the rail gets narrow.
  return (
    <aside className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[16px] border border-sidebar-border bg-[color:var(--color-sidebar-surface)] text-sidebar-foreground">
      <div className={cn('flex-1', compact ? 'space-y-4 px-4 py-4' : 'space-y-6 px-6 py-6')}>
        <div className={cn('flex items-center', compact ? 'gap-2' : 'gap-3')}>
          {snapshot.account ? (
            <>
              <Avatar name={snapshot.account.name} className={compact ? 'h-9 w-9' : 'h-10 w-10'} />
              <div className="min-w-0">
                <p className={cn('truncate font-medium text-sidebar-foreground', compact ? 'text-[0.8rem]' : 'text-sm')}>
                  {snapshot.account.email}
                </p>
                <p className={cn('text-sidebar-muted-foreground', compact ? 'text-[0.68rem]' : 'text-xs')}>
                  Signed in
                </p>
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
            className={compact ? 'border-[#5a4823] bg-[#40321b] px-4 py-3' : 'border-[#5a4823] bg-[#40321b]'}
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

      <div className={cn('space-y-4', compact ? 'px-4 py-3' : 'px-6 py-4')}>
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
