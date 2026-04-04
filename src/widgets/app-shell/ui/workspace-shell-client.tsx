'use client'

/**
 * File: src/widgets/app-shell/ui/workspace-shell-client.tsx
 * Purpose: Client-only workspace controller for auth, documents, templates, and the editor/preview split.
 * Why it exists: the page needs a small client boundary for live editing while the sidebar rules, auth modal, and document actions stay interactive.
 * What it does: coordinates markdown state, document history, templates, auth modal state, and the desktop/mobile workspace compositions.
 * Connected to: `MarkdownPane`, `PreviewPane`, `EditorPreview`, `ExportBar`, `Sidebar`, `AuthModal`, and the workspace snapshot model.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { EditorPreview, MarkdownPane, PreviewPane } from '@/widgets/editor-preview/ui/editor-preview'
import { ToastStack, type ToastItem } from '@/shared/ui/toast'
import { ExportBar } from '@/widgets/export-bar/ui/export-bar'
import type {
  DocumentRecord,
  WorkspaceSnapshot,
  WorkspaceSidebarSection,
} from '@/entities/document/model/types'
import {
  createDocumentTitle,
  getDocumentStarterMarkdown,
} from '@/entities/document/model/document-title'
import {
  buildDocumentBundleFileName,
  buildDocumentMarkdownBundle,
  copyTextToClipboard,
  downloadMarkdownAsPdf,
  downloadBlob,
} from '@/features/document-actions/model/document-actions'
import { shouldConfirmDocumentDeletion } from '@/features/document-delete-confirmation/model/document-delete-confirmation'
import { DocumentDeleteConfirmationModal } from '@/features/document-delete-confirmation/ui/document-delete-confirmation-modal'
import { useDocumentSelection } from '@/features/document-selection/model/use-document-selection'
import { Sidebar } from '@/widgets/sidebar/ui/sidebar'
import { AuthModal, type AuthModalAccount } from '@/features/auth/ui/auth-modal'

const DESKTOP_SIDEBAR_WIDTH = 360
const MAX_GUEST_DOCUMENTS = 20
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

// Generate a local identifier for newly created workspace documents so each draft can be tracked independently in the sidebar state.
function createDocumentId() {
  return `doc-${Date.now()}`
}

// Allocate a stable toast identifier so the workspace can add and remove transient feedback without colliding across renders.
function createToastId() {
  return 'toast-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8)
}

// Restore a starter document when the last file is deleted so the workspace never falls into an empty dead-end state.
function createStarterDocument(snapshot: WorkspaceSnapshot): DocumentRecord {
  return {
    id: createDocumentId(),
    title: createDocumentTitle(),
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

// Render the interactive workspace controller that keeps the sidebar, markdown editor, and export bar synchronized around one document model.
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
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [pendingDeleteDocumentIds, setPendingDeleteDocumentIds] = useState<string[] | null>(null)
  const toastTimersRef = useRef<Map<string, number>>(new Map())
  const hasHydratedGuestTitleRef = useRef(false)
  const activeDocument = documents.find((document) => document.active) ?? documents[0]
  const activeExportTitle = activeDocument?.title ?? createDocumentTitle()

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
  const showToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const toastId = createToastId()

    setToasts((current) => current.concat({ id: toastId, ...toast }))

    const timeoutId = window.setTimeout(() => {
      toastTimersRef.current.delete(toastId)
      setToasts((current) => current.filter((item) => item.id !== toastId))
    }, 3500)

    toastTimersRef.current.set(toastId, timeoutId)
  }, [])

  // Clean up any scheduled toast timers when the controller unmounts so the guest warning queue never leaks background work.
  useEffect(() => {
    const timers = toastTimersRef.current

    return () => {
      timers.forEach((timeoutId) => window.clearTimeout(timeoutId))
      timers.clear()
    }
  }, [])

  // Replace the server-rendered guest document title with a client-local timestamp once the workspace hydrates so the first visible document uses the user's clock instead of the server clock.
  useIsomorphicLayoutEffect(() => {
    if (snapshot.state === 'authorized' || hasHydratedGuestTitleRef.current) {
      return
    }

    hasHydratedGuestTitleRef.current = true
    const hydratedTitle = createDocumentTitle()

    setDocuments((current) =>
      current.map((document) =>
        document.active ? { ...document, title: hydratedTitle } : document
      )
    )
  }, [setDocuments, snapshot.state])

  // Notify guests when they hit the local document cap so the New action explains why it no longer creates files.
  const showGuestLimitToast = () => {
    showToast({
      tone: 'warning',
      title: 'Guest limit reached',
      description: 'Guest workspace supports up to 20 files. Sign up to save your history and create more.',
    })
  }

  // Announce successful markdown clipboard copies through the shared toast stack so every copy entry point gives the same confirmation.
  const showMarkdownCopiedToast = () => {
    showToast({
      tone: 'success',
      title: 'Markdown copied',
      description: 'The document content is now in your clipboard.',
    })
  }

  // Announce the start of a PDF export so the user gets immediate feedback before Chromium finishes the server-side render.
  const showPdfProcessingToast = () => {
    showToast({
      tone: 'info',
      title: 'Preparing PDF',
      description: 'The file is being processed. Please wait a couple of seconds.',
    })
  }

  // Confirm the PDF export once the browser has received the generated blob so the workspace gives a clear completion signal.
  const showPdfDownloadedToast = () => {
    showToast({
      tone: 'success',
      title: 'PDF downloaded',
      description: 'The file has been saved to your downloads.',
    })
  }

  // Keep the editor content aligned with the currently active document so opening a history row updates the workspace canvas instead of only the sidebar state.
  const syncMarkdownToActiveDocument = (nextMarkdown: string) => {
    setMarkdown(nextMarkdown)
    setDocuments((current) =>
      current.map((document) => (document.active ? { ...document, markdown: nextMarkdown } : document))
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

  // Decide whether a delete request needs a confirmation step so long documents do not disappear without an extra warning.
  const requestDeleteDocuments = (documentIds: string[]) => {
    if (documentIds.length === 0) {
      return
    }

    const targetDocuments = documents.filter((document) => documentIds.includes(document.id))

    if (targetDocuments.length === 0) {
      return
    }

    if (shouldConfirmDocumentDeletion(targetDocuments)) {
      setPendingDeleteDocumentIds(documentIds)
      return
    }

    deleteDocuments(documentIds)
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
    const nextMarkdown = getDocumentStarterMarkdown()
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

  // Download the provided documents through the shared blob transport so multi-select actions can still export a merged markdown bundle.
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

  // Send a single document markdown payload to the server PDF route so the shared export flow can print the current document as a real PDF.
  const downloadDocumentPdf = async (document: DocumentRecord | undefined) => {
    if (!document) {
      return
    }

    const markdownSource = document.markdown ?? ''

    await downloadMarkdownAsPdf({
      title: document.title ?? createDocumentTitle(),
      markdown: markdownSource,
    })
  }

  // Run a PDF download with shared loading and feedback state so desktop and mobile export controls stay in sync while the browser saves the file.
  const handleDownloadPdfDocument = async (document: DocumentRecord | undefined) => {
    if (!document || isDownloadingPdf) {
      return
    }

    setIsDownloadingPdf(true)
    showPdfProcessingToast()

    try {
      await downloadDocumentPdf(document)
      showPdfDownloadedToast()
    } catch {
      showToast({
        tone: 'warning',
        title: 'PDF export failed',
        description: 'Unable to generate the PDF right now.',
      })
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  // Copy the provided documents as a single markdown bundle so the row menu and the bulk rail share the same clipboard contract.
  const copyMarkdownDocuments = async (documentIds: string[]) => {
    const targetDocuments = documents.filter((document) => documentIds.includes(document.id))

    if (targetDocuments.length === 0) {
      return
    }

    const markdownSource = buildDocumentMarkdownBundle(targetDocuments)

    await copyTextToClipboard(markdownSource)
    showMarkdownCopiedToast()
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
    requestDeleteDocuments([documentId])
  }

  // Remove the currently selected rows from the workspace collection so the bulk rail performs the same action as the row menu, only at batch scope.
  const handleDeleteSelectedDocuments = () => {
    requestDeleteDocuments(selectedDocuments.map((document) => document.id))
  }

  // Download a single document as PDF so the row menu captures the formatted preview instead of a raw markdown bundle.
  const handleDownloadDocument = (documentId: string) => {
    const targetDocument = documents.find((document) => document.id === documentId)

    void handleDownloadPdfDocument(targetDocument)
  }

  // Download the current selected set, falling back to the legacy markdown bundle when more than one document is selected.
  const handleDownloadSelectedDocuments = () => {
    if (selectedDocuments.length === 1) {
      void handleDownloadPdfDocument(selectedDocuments[0])
      return
    }

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

  // Copy the active document markdown so the export toolbar can reuse the same clipboard contract as the sidebar actions.
  const handleCopyActiveDocument = async () => {
    if (!activeDocument) {
      return
    }

    await copyMarkdownDocuments([activeDocument.id])
  }

  // Copy a single shareable link by delegating to the shared link bundle path.
  const handleCopyLinkDocument = async (documentId: string) => {
    await copyLinkDocuments([documentId])
  }

  // Copy shareable links for the selected rows by using the same link builder as the per-row menu.
  const handleCopyLinkSelectedDocuments = async () => {
    await copyLinkDocuments(selectedDocuments.map((document) => document.id))
  }

  // Update a single document title without touching its markdown so the sidebar row and the export chip can be renamed independently of content.
  const handleRenameDocument = (documentId: string, nextTitle: string) => {
    const resolvedTitle = nextTitle.trim() || createDocumentTitle()

    setDocuments((current) =>
      current.map((document) =>
        document.id === documentId ? { ...document, title: resolvedTitle } : document
      )
    )
  }

  // Persist the active document title only, so the sidebar row and the export chip can rename together without tying the title to markdown content.
  const handleActiveDocumentTitleChange = (nextTitle: string) => {
    if (!activeDocument) {
      return
    }

    handleRenameDocument(activeDocument.id, nextTitle)
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
      title: createDocumentTitle(),
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

  // Export the currently active document to a PDF through the server-side print route so the browser receives a real selectable document instead of a canvas capture.
  const handleDownloadActiveDocument = () => {
    void handleDownloadPdfDocument(activeDocument)
  }

  // Route textarea edits through the shared sync helper so the active document markdown stays in sync with the current editor value.
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
            onRenameDocument={handleRenameDocument}
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
              <ExportBar
                title={activeExportTitle}
                onTitleChange={handleActiveDocumentTitleChange}
                onCopyMarkdown={handleCopyActiveDocument}
                onDownloadPdf={handleDownloadActiveDocument}
                isDownloadingPdf={isDownloadingPdf}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="h-full min-h-0 lg:hidden">
        <EditorPreview
          markdown={markdown}
          onMarkdownChange={handleMarkdownChange}
          onDownloadPdf={handleDownloadActiveDocument}
          isDownloadingPdf={isDownloadingPdf}
          placeholder={snapshot.prompt?.title ?? 'Start writing markdown'}
        />
      </div>

      <ToastStack items={toasts} onDismiss={dismissToast} />

      <DocumentDeleteConfirmationModal
        open={pendingDeleteDocumentIds !== null}
        documentCount={pendingDeleteDocumentIds?.length ?? 0}
        onCancel={() => setPendingDeleteDocumentIds(null)}
        onConfirm={() => {
          if (!pendingDeleteDocumentIds) {
            return
          }

          deleteDocuments(pendingDeleteDocumentIds)
          setPendingDeleteDocumentIds(null)
        }}
      />

      <AuthModal
        open={isAuthModalOpen}
        onOpenChange={setIsAuthModalOpen}
        onAuthenticate={handleAuthenticate}
      />
    </>
  )
}





