'use client'

/**
 * File: src/widgets/app-shell/ui/mobile-workspace-shell.tsx
 * Purpose: Mobile workspace chrome for the document editor.
 * Why it exists: phone-sized screens need the same sidebar navigation as desktop, but wrapped in an off-canvas drawer and a compact top bar.
 * What it does: renders the burger-triggered sidebar drawer, the compact markdown/preview toggle, the PDF action, and the read-only Help surface.
 * Connected to: the shared drawer primitive, the sidebar widget, the shared tabs and icon buttons, and the workspace shell client.
 */

import { useState } from 'react'
import { IconDownload, IconEye, IconFileCode2, IconMenu2 } from '@tabler/icons-react'
import { IconButton } from '@/shared/ui/icon-button'
import { Icon } from '@/shared/ui/icon'
import { Spinner } from '@/shared/ui/spinner'
import { Tabs } from '@/shared/ui/tabs'
import { Drawer } from '@/shared/ui/drawer'
import type {
  DocumentRecord,
  WorkspaceAccount,
  WorkspaceFavorite,
  WorkspaceSidebarSection,
  WorkspaceWarning,
} from '@/entities/document/model/types'
import { Sidebar, type SidebarProps } from '@/widgets/sidebar/ui/sidebar'
import { MarkdownPane, PreviewPane } from '@/widgets/editor-preview/ui/editor-preview'
import { HelpDocument } from '@/widgets/help-document/ui/help-document'

export interface MobileWorkspaceShellProps extends Omit<SidebarProps, 'selectionMode' | 'selectedCount'> {
  markdown: string
  placeholder: string
  helpMarkdown: string
  isHelpDocumentOpen: boolean
  isDownloadingPdf: boolean
  onMarkdownChange: (value: string) => void
  onDownloadPdf: () => void
}

// Render the mobile workspace so the sidebar stays available through a drawer while the main view keeps the same markdown and preview modes as desktop.
export function MobileWorkspaceShell({
  account,
  isAuthenticated,
  activeSection,
  documents,
  favorites,
  warning,
  isDocumentsLoading = false,
  isFavoritesLoading = false,
  totalCount,
  helperText,
  highlightActiveDocument = true,
  onHelpClick,
  onSectionChange,
  onSignUpClick,
  onSignOut,
  onCreateDocument,
  onUseFavorite,
  onRenameFavorite,
  onDeleteFavorite,
  onDownloadDocument,
  onDeleteDocument,
  onRenameDocument,
  onCopyMarkdownDocument,
  onSaveToFavorites,
  onToggleAllSelection,
  onToggleDocument,
  onOpenDocument,
  onDeleteSelected,
  onDownloadSelected,
  onCopyMarkdownSelected,
  markdown,
  placeholder,
  helpMarkdown,
  isHelpDocumentOpen,
  isDownloadingPdf,
  onMarkdownChange,
  onDownloadPdf,
}: MobileWorkspaceShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [mobilePanel, setMobilePanel] = useState<'markdown' | 'preview'>('markdown')
  const mobileSidebarDocuments = documents.map((document) => ({ ...document, selected: false }))

  // Close the drawer after a navigation or creation action so the mobile canvas gets focus back immediately.
  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  // Forward sidebar navigation into the workspace and then dismiss the drawer so the new target is visible without extra taps.
  const handleSectionChange = (section: WorkspaceSidebarSection) => {
    closeSidebar()
    onSectionChange(section)
  }

  // Forward a real document open action and close the drawer so the new selection appears full-width.
  const handleOpenDocument = (documentId: string) => {
    closeSidebar()
    onOpenDocument(documentId)
  }

  // Forward creation and close the drawer so the new draft appears immediately in the main canvas.
  const handleCreateDocument = () => {
    closeSidebar()
    onCreateDocument()
  }

  // Forward favorite reuse and close the drawer so the created document occupies the main canvas immediately.
  const handleUseFavorite = (favoriteId: string) => {
    closeSidebar()
    onUseFavorite(favoriteId)
  }

  // Forward sign-in entry through the existing auth modal and close the drawer so the modal is the only active overlay.
  const handleSignUpClick = () => {
    closeSidebar()
    onSignUpClick()
  }

  // Forward sign-out through the workspace auth flow and close the drawer so the shell returns to the standard mobile view.
  const handleSignOut = () => {
    closeSidebar()
    onSignOut()
  }

  // Forward Help mode through the existing toggle and close the drawer so the read-only document can occupy the main area.
  const handleHelpClick = () => {
    closeSidebar()
    onHelpClick()
  }

  // Forward document mutation actions and close the drawer so the list state updates without leaving the sidebar in the way.
  const handleDeleteDocument = (documentId: string) => {
    closeSidebar()
    onDeleteDocument(documentId)
  }

  // Forward document rename from the drawer rows while keeping the drawer out of the way after the commit.
  const handleRenameDocument = (documentId: string, nextTitle: string) => {
    closeSidebar()
    onRenameDocument(documentId, nextTitle)
  }

  // Forward favorite rename from the drawer rows and close the sidebar once the inline edit commits.
  const handleRenameFavorite = (favoriteId: string, nextTitle: string) => {
    closeSidebar()
    onRenameFavorite(favoriteId, nextTitle)
  }

  // Forward favorite deletion and close the drawer so the item list updates in the main viewport immediately.
  const handleDeleteFavorite = (favoriteId: string) => {
    closeSidebar()
    onDeleteFavorite(favoriteId)
  }

  return (
    <section className="relative flex min-h-[100dvh] h-auto w-full min-w-0 flex-col overflow-visible overflow-x-hidden bg-[color:var(--color-canvas)]">
      <div className="fixed inset-x-0 top-0 z-20 px-3 pt-3">
        <div className="flex min-h-[68px] min-w-0 items-center gap-2">
          <IconButton
            aria-label="Open sidebar"
            variant="neutral"
            size="lg"
            className="h-[68px] w-[68px] bg-[#292929] hover:bg-[#323232] active:bg-[#494949]"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Icon icon={IconMenu2} size="md" />
          </IconButton>

          <Tabs
            ariaLabel="Workspace mode"
            items={[
              { value: 'markdown', label: 'Markdown', icon: IconFileCode2 },
              { value: 'preview', label: 'Preview', icon: IconEye },
            ]}
            value={mobilePanel}
            onValueChange={(value) => setMobilePanel(value as 'markdown' | 'preview')}
            compact
            compactClassName="bg-[#292929]"
            compactActiveClassName="bg-[#494949]"
            compactInactiveClassName="hover:bg-[#323232] active:bg-[#3a3a3a]"
            className="min-w-0 flex-1"
          />

          <IconButton
            aria-label="Download PDF"
            variant="primary"
            size="lg"
            className="h-[68px] w-[68px]"
            disabled={isDownloadingPdf}
            onClick={onDownloadPdf}
          >
            {isDownloadingPdf ? (
              <Spinner size="sm" className="text-current" />
            ) : (
              <Icon icon={IconDownload} size="md" />
            )}
          </IconButton>
        </div>
      </div>

      <div className="min-w-0 overflow-visible px-0 pt-[88px]">
        {isHelpDocumentOpen ? (
          <HelpDocument markdown={helpMarkdown} />
        ) : mobilePanel === 'markdown' ? (
          <MarkdownPane value={markdown} onChange={onMarkdownChange} placeholder={placeholder} mobile />
        ) : (
          <PreviewPane markdown={markdown} mobile />
        )}
      </div>

      <Drawer
        open={isSidebarOpen}
        ariaLabel="Workspace sidebar"
        onOpenChange={setIsSidebarOpen}
        side="bottom"
        className="p-0"
      >
        <Sidebar
          account={account}
          isAuthenticated={isAuthenticated}
          activeSection={activeSection}
          documents={mobileSidebarDocuments}
          favorites={favorites}
          warning={warning}
          isDocumentsLoading={isDocumentsLoading}
          isFavoritesLoading={isFavoritesLoading}
          selectionMode={false}
          selectedCount={0}
          totalCount={totalCount}
          helperText={helperText}
          highlightActiveDocument={highlightActiveDocument}
          showSelectionControls={false}
          onHelpClick={handleHelpClick}
          onSectionChange={handleSectionChange}
          onSignUpClick={handleSignUpClick}
          onSignOut={handleSignOut}
          onCreateDocument={handleCreateDocument}
          onUseFavorite={handleUseFavorite}
          onRenameFavorite={handleRenameFavorite}
          onDeleteFavorite={handleDeleteFavorite}
          onDownloadDocument={onDownloadDocument}
          onDeleteDocument={handleDeleteDocument}
          onRenameDocument={handleRenameDocument}
          onCopyMarkdownDocument={onCopyMarkdownDocument}
          onSaveToFavorites={onSaveToFavorites}
          onToggleAllSelection={onToggleAllSelection}
          onToggleDocument={onToggleDocument}
          onOpenDocument={handleOpenDocument}
          onDeleteSelected={onDeleteSelected}
          onDownloadSelected={onDownloadSelected}
          onCopyMarkdownSelected={onCopyMarkdownSelected}
        />
      </Drawer>
    </section>
  )
}
