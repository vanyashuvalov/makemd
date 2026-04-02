'use client'

/**
 * File: src/widgets/app-shell/ui/workspace-shell-client.tsx
 * Purpose: Client-only workspace controller for auth, documents, templates, and the editor/preview split.
 * Why it exists: the page needs a small client boundary for live editing while the sidebar rules, auth modal, and document actions stay interactive.
 * What it does: coordinates markdown state, document history, templates, auth modal state, and the desktop/mobile workspace compositions.
 * Connected to: `MarkdownPane`, `PreviewPane`, `EditorPreview`, `ExportBar`, `Sidebar`, `AuthModal`, and the workspace snapshot model.
 */

import { useState } from 'react'
import { EditorPreview, MarkdownPane, PreviewPane } from '@/widgets/editor-preview/ui/editor-preview'
import { ExportBar } from '@/widgets/export-bar/ui/export-bar'
import type {
  DocumentRecord,
  WorkspaceSnapshot,
  WorkspaceSidebarSection,
} from '@/entities/document/model/types'
import {
  buildDocumentFileName,
  copyTextToClipboard,
  downloadBlob,
} from '@/features/document-actions/model/document-actions'
import { useDocumentSelection } from '@/features/document-selection/model/use-document-selection'
import { Sidebar } from '@/widgets/sidebar/ui/sidebar'
import { AuthModal, type AuthModalAccount } from '@/features/auth/ui/auth-modal'

const DESKTOP_SIDEBAR_WIDTH = 360

function createDocumentId() {
  return `doc-${Date.now()}`
}

function createDocumentTitle() {
  return 'Untitled document'
}

function createDocumentMarkdown(title: string) {
  return `# ${title}\n`
}

function getNextActiveDocumentId(documents: DocumentRecord[], removedDocumentId: string) {
  const remainingDocuments = documents.filter((document) => document.id !== removedDocumentId)
  return remainingDocuments[0]?.id
}

export function WorkspaceShellClient({
  snapshot,
}: {
  snapshot: WorkspaceSnapshot
}) {
  const [markdown, setMarkdown] = useState(snapshot.editor.markdown)
  const [isAuthenticated, setIsAuthenticated] = useState(snapshot.state === 'authorized')
  const [account, setAccount] = useState(snapshot.account)
  const [sidebarSection, setSidebarSection] = useState<WorkspaceSidebarSection>('history')
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const {
    documents,
    selectedCount,
    selectionMode,
    setAllSelected,
    setDocuments,
    toggleDocument,
  } = useDocumentSelection(snapshot.documents)

  const templates = snapshot.templates ?? []
  const guestWarning = !isAuthenticated && documents.length >= 2 ? snapshot.warning : undefined

  // Keep the editor content aligned with the currently active document so opening a history row updates the workspace canvas instead of only the sidebar state.
  const syncMarkdownToActiveDocument = (nextMarkdown: string) => {
    setMarkdown(nextMarkdown)
    setDocuments((current) =>
      current.map((document) =>
        document.active ? { ...document, markdown: nextMarkdown } : document
      )
    )
  }

  // Promote a document to active history state and clear selection so the sidebar behaves like a real document navigator rather than a static preview.
  const handleOpenDocument = (documentId: string) => {
    const nextDocument = documents.find((document) => document.id === documentId)

    if (!nextDocument) {
      return
    }

    setDocuments((current) =>
      current.map((document) => ({
        ...document,
        active: document.id === documentId,
        selected: false,
      }) as DocumentRecord)
    )
    setSidebarSection('history')
    setMarkdown(nextDocument.markdown ?? '')
  }

  // Create a blank draft document so the primary sidebar action now produces a tangible workspace state.
  const handleCreateDocument = () => {
    const title = createDocumentTitle()
    const nextMarkdown = createDocumentMarkdown(title)
    const nextDocument: DocumentRecord = {
      id: createDocumentId(),
      title,
      updatedLabel: 'Just now',
      markdown: nextMarkdown,
      active: true,
      withMenu: true,
    }

    setDocuments((current) =>
      current
        .map((document) => ({
          ...document,
          active: false,
          selected: false,
        }) as DocumentRecord)
        .concat(nextDocument)
    )
    setSidebarSection('history')
    setMarkdown(nextMarkdown)
  }

  // Remove a document from the local workspace collection and keep the editor pointed at the next available active row.
  const handleDeleteDocument = (documentId: string) => {
    const nextDocuments = documents.filter((document) => document.id !== documentId)
    const nextActiveDocumentId =
      nextDocuments.find((document) => document.active)?.id ??
      getNextActiveDocumentId(documents, documentId)
    const resolvedDocuments = nextDocuments.map((document) => ({
      ...document,
      active: document.id === nextActiveDocumentId,
      selected: false,
    }) as DocumentRecord)
    const nextActiveDocument = resolvedDocuments.find((document) => document.id === nextActiveDocumentId)

    setDocuments(resolvedDocuments)
    setMarkdown(nextActiveDocument?.markdown ?? snapshot.editor.markdown)
  }

  // Download the document markdown as a plain .md file so the overflow menu has a tangible export action even before backend storage exists.
  const handleDownloadDocument = (documentId: string) => {
    const targetDocument = documents.find((item) => item.id === documentId)
    const markdownSource = targetDocument?.markdown ?? markdown
    const fileName = buildDocumentFileName(targetDocument?.title ?? 'document', 'md')
    const blob = new Blob([markdownSource], { type: 'text/markdown;charset=utf-8' })

    downloadBlob({ blob, fileName })
  }

  // Copy the currently resolved markdown into the clipboard so the menu exposes a useful local action without waiting for persistence.
  const handleCopyMarkdownDocument = async (documentId: string) => {
    const targetDocument = documents.find((item) => item.id === documentId)
    const markdownSource = targetDocument?.markdown ?? markdown

    await copyTextToClipboard(markdownSource)
  }

  // Generate a shareable workspace link for authenticated documents so the menu reflects the future cloud-backed URL contract.
  const handleCopyLinkDocument = async (documentId: string) => {
    const url = new URL(window.location.href)
    url.searchParams.set('state', 'authorized')
    url.searchParams.set('document', documentId)
    await copyTextToClipboard(url.toString())
  }

  // Convert a template into a new active document so the Templates tab becomes a real entry point instead of a decorative list.
  const handleUseTemplate = (templateId: string) => {
    const template = templates.find((item) => item.id === templateId)

    if (!template) {
      return
    }

    const nextDocument: DocumentRecord = {
      id: createDocumentId(),
      title: template.title,
      updatedLabel: 'Just now',
      markdown: template.markdown,
      active: true,
      withMenu: true,
    }

    setDocuments((current) =>
      current
        .map((document) => ({
          ...document,
          active: false,
          selected: false,
        }) as DocumentRecord)
        .concat(nextDocument)
    )
    setSidebarSection('history')
    setMarkdown(template.markdown)
  }

  // Promote the guest session into an authenticated workspace mode without leaving the current screen.
  const handleAuthenticate = (nextAccount: AuthModalAccount) => {
    setIsAuthenticated(true)
    setAccount(nextAccount)
    setIsAuthModalOpen(false)
    setSidebarSection('history')
  }

  const handleMarkdownChange = (nextMarkdown: string) => {
    syncMarkdownToActiveDocument(nextMarkdown)
  }

  // Keep the live markdown and selection state isolated to the client surface while the sidebar stays a fixed 360px anchor in the shell.
  return (
    <>
      <div className="hidden h-full min-h-0 lg:flex lg:gap-0">
        <div className="min-h-0 shrink-0" style={{ width: `${DESKTOP_SIDEBAR_WIDTH}px` }}>
          <Sidebar
            account={isAuthenticated ? account : undefined}
            isAuthenticated={isAuthenticated}
            activeSection={sidebarSection}
            documents={documents}
            templates={templates}
            warning={guestWarning}
            selectionMode={selectionMode}
            selectedCount={selectedCount}
            totalCount={documents.length}
            helperText={snapshot.selection?.helperText ?? 'Hold Ctrl to select many'}
            onSectionChange={setSidebarSection}
            onSignUpClick={() => setIsAuthModalOpen(true)}
            onCreateDocument={handleCreateDocument}
            onUseTemplate={handleUseTemplate}
            onDownloadDocument={handleDownloadDocument}
            onDeleteDocument={handleDeleteDocument}
            onCopyMarkdownDocument={handleCopyMarkdownDocument}
            onCopyLinkDocument={handleCopyLinkDocument}
            onToggleAllSelection={setAllSelected}
            onToggleDocument={toggleDocument}
            onOpenDocument={handleOpenDocument}
          />
        </div>

        <div className="min-h-0 min-w-0 flex-1">
          <div className="grid h-full min-h-0 gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <MarkdownPane
              value={markdown}
              onChange={handleMarkdownChange}
              placeholder={snapshot.prompt?.title ?? 'Start writing markdown'}
            />

            <div className="relative min-h-0 min-w-0">
              <PreviewPane markdown={markdown} />
              <ExportBar fileName={snapshot.exportFileName} />
            </div>
          </div>
        </div>
      </div>
      <div className="h-full min-h-0 lg:hidden">
        <EditorPreview
          markdown={markdown}
          onMarkdownChange={handleMarkdownChange}
          placeholder={snapshot.prompt?.title ?? 'Start writing markdown'}
        />
      </div>

      <AuthModal
        open={isAuthModalOpen}
        onOpenChange={setIsAuthModalOpen}
        onAuthenticate={handleAuthenticate}
      />
    </>
  )
}
