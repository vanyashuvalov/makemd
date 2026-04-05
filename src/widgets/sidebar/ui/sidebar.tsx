'use client'

/**
 * File: src/widgets/sidebar/ui/sidebar.tsx
 * Purpose: Figma-inspired navigation rail for account, create, history, templates, and support.
 * Why it exists: the sidebar is the main control surface in the design and keeps document navigation predictable.
 * What it does: composes the account header, primary action, tabs, warnings, selection actions, history list, templates list, and footer.
 * Connected to: workspace session state, document and template entities, and the editor/preview shell.
 */

import * as React from 'react'
import {
  IconAlertTriangle,
  IconClipboardList,
  IconHelpCircle,
  IconHistory,
  IconLogin2,
  IconLogout2,
} from '@tabler/icons-react'
import { CreateDocumentButton } from '@/features/document-create/ui/create-document-button'
import type {
  DocumentRecord,
  WorkspaceSidebarSection,
  WorkspaceTemplate,
  WorkspaceWarning,
  WorkspaceAccount,
} from '@/entities/document/model/types'
import { DocumentList } from './document-list'
import { TemplateList } from '@/entities/template/ui/template-list'
import { Alert } from '@/shared/ui/alert'
import { Avatar } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import { ContextMenu, type ContextMenuItem } from '@/shared/ui/context-menu'
import { Icon } from '@/shared/ui/icon'
import { IconButton } from '@/shared/ui/icon-button'
import { Separator } from '@/shared/ui/separator'
import { Tabs } from '@/shared/ui/tabs'

export interface SidebarProps {
  account?: WorkspaceAccount
  isAuthenticated: boolean
  activeSection: WorkspaceSidebarSection
  documents: DocumentRecord[]
  templates: WorkspaceTemplate[]
  warning?: WorkspaceWarning
  selectionMode: boolean
  selectedCount: number
  totalCount: number
  helperText?: string
  canCopyLink: boolean
  onSectionChange: (section: WorkspaceSidebarSection) => void
  onSignUpClick: () => void
  onSignOut: () => void
  onCreateDocument: () => void
  onUseTemplate: (templateId: string) => void
  onDownloadDocument: (documentId: string) => void
  onDeleteDocument: (documentId: string) => void
  onRenameDocument: (documentId: string, nextTitle: string) => void
  onCopyMarkdownDocument: (documentId: string) => void
  onCopyLinkDocument: (documentId: string) => void
  onToggleAllSelection: (checked: boolean) => void
  onToggleDocument: (documentId: string) => void
  onOpenDocument: (documentId: string) => void
  onDeleteSelected: () => void
  onDownloadSelected: () => void
  onCopyMarkdownSelected: () => void
  onCopyLinkSelected: () => void
}

export function Sidebar({
  account,
  isAuthenticated,
  activeSection,
  documents,
  templates,
  warning,
  selectionMode,
  selectedCount,
  totalCount,
  helperText = 'Hold Ctrl to select many',
  canCopyLink,
  onSectionChange,
  onSignUpClick,
  onSignOut,
  onCreateDocument,
  onUseTemplate,
  onDownloadDocument,
  onDeleteDocument,
  onRenameDocument,
  onCopyMarkdownDocument,
  onCopyLinkDocument,
  onToggleAllSelection,
  onToggleDocument,
  onOpenDocument,
  onDeleteSelected,
  onDownloadSelected,
  onCopyMarkdownSelected,
  onCopyLinkSelected,
}: SidebarProps) {
  // Render the fixed-width navigation rail used in the Figma sidebar states without a compact or resizable variant.
  const showHistory = !isAuthenticated || activeSection === 'history'
  const showTemplates = isAuthenticated && activeSection === 'templates'
  const accountButtonRef = React.useRef<HTMLButtonElement | null>(null)
  const [isAccountMenuOpen, setIsAccountMenuOpen] = React.useState(false)
  const accountMenuItems: ContextMenuItem[] = [
    {
      key: 'sign-out',
      label: 'Sign out',
      icon: IconLogout2,
      destructive: true,
      onSelect: onSignOut,
    },
  ]

  return (
    <aside className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[16px] border border-sidebar-border bg-[color:var(--color-sidebar-surface)] text-sidebar-foreground">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6">
          <div className="flex items-center gap-3">
            {account ? (
              <Button
                ref={accountButtonRef}
                variant="text"
                size="text"
                className="w-full justify-start gap-3 px-0 font-normal"
                before={<Avatar name={account.name} className="h-10 w-10" />}
                aria-haspopup="menu"
                aria-expanded={isAccountMenuOpen}
                onClick={() => setIsAccountMenuOpen((current) => !current)}
              >
                <span className="truncate text-[18px] leading-[25px] text-sidebar-foreground">{account.email}</span>
              </Button>
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
                onClick={onSignUpClick}
              >
                Sign up
              </Button>
            )}

            {account ? (
              <ContextMenu
                open={isAccountMenuOpen}
                anchorRef={accountButtonRef}
                items={accountMenuItems}
                onOpenChange={setIsAccountMenuOpen}
              />
            ) : null}
          </div>

          <CreateDocumentButton onClick={onCreateDocument} />

          {isAuthenticated ? (
            <Tabs
              ariaLabel="Sidebar sections"
              items={[
                { value: 'history', label: 'History', icon: IconHistory },
                { value: 'templates', label: 'Templates', icon: IconClipboardList },
              ]}
              value={activeSection}
              compact
              onValueChange={(value) => onSectionChange(value as WorkspaceSidebarSection)}
            />
          ) : null}

          {warning ? (
            <Alert
              tone="warning"
              title={warning.title}
              description={warning.description}
              icon={<Icon icon={IconAlertTriangle} size="sm" className="text-[#f2c46f]" />}
              className="border-[#5a4823] bg-[#40321b]"
            />
          ) : null}

          {showHistory ? (
            <DocumentList
              documents={documents}
              selectionMode={selectionMode}
              selectedCount={selectedCount}
              totalCount={totalCount}
              helperText={helperText}
              canCopyLink={canCopyLink}
              onToggleAllSelection={onToggleAllSelection}
              onToggleDocument={onToggleDocument}
              onOpenDocument={onOpenDocument}
              onDownloadDocument={onDownloadDocument}
              onDeleteDocument={onDeleteDocument}
              onRenameDocument={onRenameDocument}
              onCopyMarkdownDocument={onCopyMarkdownDocument}
              onCopyLinkDocument={onCopyLinkDocument}
              onDeleteSelected={onDeleteSelected}
              onDownloadSelected={onDownloadSelected}
              onCopyMarkdownSelected={onCopyMarkdownSelected}
              onCopyLinkSelected={onCopyLinkSelected}
            />
          ) : null}

          {showTemplates ? <TemplateList items={templates} onUseTemplate={onUseTemplate} /> : null}
        </div>
      </div>

      <div className="shrink-0 space-y-4 px-6 py-4">
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
