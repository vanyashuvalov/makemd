'use client'

/**
 * File: src/widgets/app-shell/ui/workspace-shell-client.tsx
 * Purpose: Client-only workspace controller for auth, documents, templates, and the editor/preview split.
 * Why it exists: the page needs a small client boundary for live editing while the sidebar rules, auth modal, and document actions stay interactive.
 * What it does: coordinates markdown state, document history, templates, auth modal state, and the desktop/mobile workspace compositions.
 * Connected to: `MarkdownPane`, `PreviewPane`, `EditorPreview`, `ExportBar`, `Sidebar`, `AuthModal`, and the workspace snapshot model.
 */

import { useEffect, useRef, useState } from 'react'
import { EditorPreview, MarkdownPane, PreviewPane } from '@/widgets/editor-preview/ui/editor-preview'
import { ToastStack, type ToastItem } from '@/shared/ui/toast'
import { ExportBar } from '@/widgets/export-bar/ui/export-bar'
import type {
  DocumentRecord,
  WorkspaceSnapshot,
  WorkspaceSidebarSection,
} from '@/entities/document/model/types'
import {
  buildDocumentBundleFileName,
  buildDocumentMarkdownBundle,
  copyTextToClipboard,
  downloadBlob,
} from '@/features/document-actions/model/document-actions'
import { useDocumentSelection } from '@/features/document-selection/model/use-document-selection'
import { Sidebar } from '@/widgets/sidebar/ui/sidebar'
import { AuthModal, type AuthModalAccount } from '@/features/auth/ui/auth-modal'

const DESKTOP_SIDEBAR_WIDTH = 360
const MAX_GUEST_DOCUMENTS = 20

function createDocumentId() {
  return `doc-${Date.now()}`
}

function createDocumentTitle() {
  return 'Untitled document'
}

function createDocumentMarkdown(title: string) {
  return `# ${title}\n`
}

// Restore a starter document when the last file is deleted so the workspace never falls into an empty dead-end state.
function createStarterDocument(snapshot: WorkspaceSnapshot): DocumentRecord {
  return {
    id: createDocumentId(),
    title: snapshot.prompt?.title ?? snapshot.documents[0]?.title ?? createDocumentTitle(),
    updatedLabel: 'Just now',
    markdown: snapshot.editor.markdown,
    active: true,
    withMenu: true,
  }
}

// Resolve the next active document after one or more rows are deleted so multi-select and single-row deletion share the same fallback behavior.
function getNextActiveDocumentId(documents: DocumentRecord[], removedDocumentIds: string[]) {
  const removedDocumentIdSet = new Set(removedDocumentIds)
  const remainingDocuments = documents.filter((document) => !removedDocumentIdSet.has(document.id))
  return remainingDocuments.find((document) => document.active)?.id ?? remainingDocuments[0]?.id
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
  const selectedDocuments = documents.filter((document) => document.selected)
  const guestWarning = !isAuthenticated && documents.length >= 2 ? snapshot.warning : undefined
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const toastTimersRef = useRef<Map<string, number>>(new Map())

  // Allocate a stable toast identifier so the stack can add and remove guest-limit feedback without clashing with other transient messages.
  const createToastId = () => 'toast-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8)

  // Remove a toast from the viewport and clear its pending timer so dismissed messages do not linger in memory.
  const dismissToast = (toastId: string) => {
    const timeoutId = toastTimersRef.current.get(toastId)

    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId)
      toastTimersRef.current.delete(toastId)
    }

    setToasts((current) => current.filter((toast) => toast.id !== toastId))
  }

  // Add a new toast to the shared viewport and schedule its automatic dismissal so guest-limit feedback feels immediate but non-blocking.
  const showToast = (toast: Omit<ToastItem, 'id'>) => {
    const toastId = createToastId()

    setToasts((current) => current.concat({ id: toastId, ...toast }))

    const timeoutId = window.setTimeout(() => {
      toastTimersRef.current.delete(toastId)
      setToasts((current) => current.filter((item) => item.id !== toastId))
    }, 3500)

    toastTimersRef.current.set(toastId, timeoutId)
  }

  // Clean up any scheduled toast timers when the controller unmounts so the guest warning queue never leaks background work.
  useEffect(() => {
    const timers = toastTimersRef.current

    return () => {
      timers.forEach((timeoutId) => window.clearTimeout(timeoutId))
      timers.clear()
    }
  }, [])

  // Notify guests when they hit the local document cap so the New action explains why it no longer creates files.
  const showGuestLimitToast = () => {
    showToast({
      tone: 'warning',
      title: 'Guest limit reached',
      description: 'Guest workspace supports up to 20 files. Sign up to save your history and create more.',
    })
  }

  // Keep the editor content aligned with the currently active document so opening a history row updates the workspace canvas instead of only the sidebar state.
  const syncMarkdownToActiveDocument = (nextMarkdown: string) => {
    setMarkdown(nextMarkdown)
    setDocuments((current) =>
      current.map((document) =>
        document.active ? { ...document, markdown: nextMarkdown } : document
      )
    )
  }

  // Keep the workspace editor pointed at a deterministic document after removing one or more rows so the sidebar and canvas do not drift apart.
  const deleteDocuments = (documentIds: string[]) => {
    if (documentIds.length === 0) {
      return
    }

    const removedDocumentIdSet = new Set(documentIds)
    const nextDocuments = documents.filter((document) => !removedDocumentIdSet.has(document.id))

    if (nextDocuments.length === 0) {
      const starterDocument = createStarterDocument(snapshot)

      setDocuments([starterDocument])
      setMarkdown(starterDocument.markdown ?? snapshot.editor.markdown)
      return
    }

    const nextActiveDocumentId = getNextActiveDocumentId(documents, documentIds)
    const resolvedDocuments = nextDocuments.map((document) => ({
      ...document,
      active: document.id === nextActiveDocumentId,
      selected: false,
    }) as DocumentRecord)
    const nextActiveDocument = resolvedDocuments.find((document) => document.id === nextActiveDocumentId)

    setDocuments(resolvedDocuments)
    setMarkdown(nextActiveDocument?.markdown ?? snapshot.editor.markdown)
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
    if (!isAuthenticated && documents.length >= MAX_GUEST_DOCUMENTS) {
      showGuestLimitToast()
      return
    }

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

  // Download the provided documents through the shared blob transport so the current markdown export and the future PDF export can share one path.
  const downloadDocuments = (documentIds: string[]) => {
    const targetDocuments = documents.filter((document) => documentIds.includes(document.id))

    if (targetDocuments.length === 0) {
      return
    }

    const markdownSource = buildDocumentMarkdownBundle(targetDocuments)
    const fileName = buildDocumentBundleFileName(targetDocuments, 'md')
    const blob = new Blob([markdownSource], { type: 'text/markdown;charset=utf-8' })

    downloadBlob({ blob, fileName })
  }

  // Copy the provided documents as a single markdown bundle so the row menu and the bulk rail share the same clipboard contract.
  const copyMarkdownDocuments = async (documentIds: string[]) => {
    const targetDocuments = documents.filter((document) => documentIds.includes(document.id))

    if (targetDocuments.length === 0) {
      return
    }

    const markdownSource = buildDocumentMarkdownBundle(targetDocuments)

    await copyTextToClipboard(markdownSource)
  }

  // Copy a shareable URL for one or more documents so the row menu and the bulk rail stay aligned with the cloud-backed workflow.
  const copyLinkDocuments = async (documentIds: string[]) => {
    if (documentIds.length === 0) {
      return
    }

    const urls = documentIds.map((documentId) => {
      const url = new URL(window.location.href)
      url.searchParams.set('state', 'authorized')
      url.searchParams.set('document', documentId)
      return url.toString()
    })

    await copyTextToClipboard(urls.join('\n'))
  }

  // Remove a document from the local workspace collection and keep the editor pointed at the next available active row.
  const handleDeleteDocument = (documentId: string) => {
    deleteDocuments([documentId])
  }

  // Remove the currently selected rows from the workspace collection so the bulk rail performs the same action as the row menu, only at batch scope.
  const handleDeleteSelectedDocuments = () => {
    deleteDocuments(selectedDocuments.map((document) => document.id))
  }

  // Download a single document by delegating to the shared bulk export path so the future PDF switch remains a one-place change.
  const handleDownloadDocument = (documentId: string) => {
    downloadDocuments([documentId])
  }

  // Download the current selected set by delegating to the same transport path as the row action.
  const handleDownloadSelectedDocuments = () => {
    downloadDocuments(selectedDocuments.map((document) => document.id))
  }

  // Copy a single document's markdown by delegating to the shared bundle builder so the menu and bulk rail stay in sync.
  const handleCopyMarkdownDocument = async (documentId: string) => {
    await copyMarkdownDocuments([documentId])
  }

  // Copy the currently selected markdown rows by delegating to the same clipboard helper as the row action.
  const handleCopyMarkdownSelectedDocuments = async () => {
    await copyMarkdownDocuments(selectedDocuments.map((document) => document.id))
  }

  // Copy a single shareable link by delegating to the shared link bundle path.
  const handleCopyLinkDocument = async (documentId: string) => {
    await copyLinkDocuments([documentId])
  }

  // Copy shareable links for the selected rows by using the same link builder as the per-row menu.
  const handleCopyLinkSelectedDocuments = async () => {
    await copyLinkDocuments(selectedDocuments.map((document) => document.id))
  }

  // Convert a template into a new active document so the Templates tab becomes a real entry point instead of a decorative list.
  const handleUseTemplate = (templateId: string) => {
    if (!isAuthenticated && documents.length >= MAX_GUEST_DOCUMENTS) {
      showGuestLimitToast()
      return
    }

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
      <div className="hidden h-full min-h-0 lg:flex lg:gap-2">
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
            canCopyLink={isAuthenticated}
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
            onDeleteSelected={handleDeleteSelectedDocuments}
            onDownloadSelected={handleDownloadSelectedDocuments}
            onCopyMarkdownSelected={handleCopyMarkdownSelectedDocuments}
            onCopyLinkSelected={handleCopyLinkSelectedDocuments}
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

      <ToastStack items={toasts} onDismiss={dismissToast} />

      <AuthModal
        open={isAuthModalOpen}
        onOpenChange={setIsAuthModalOpen}
        onAuthenticate={handleAuthenticate}
      />
    </>
  )
}





