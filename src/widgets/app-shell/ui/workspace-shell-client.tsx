'use client'

/**
 * File: src/widgets/app-shell/ui/workspace-shell-client.tsx
 * Purpose: Client-only workspace controller for auth, documents, favorites, and the editor/preview split.
 * Why it exists: the page needs a small client boundary for live editing while the sidebar rules, auth modal, and document actions stay interactive.
 * What it does: coordinates markdown state, document history, favorites, auth modal state, the read-only Help document, and the desktop/mobile workspace compositions.
 * Connected to: `MarkdownPane`, `PreviewPane`, `EditorPreview`, `ExportBar`, `HelpDocument`, `Sidebar`, `AuthModal`, and the workspace snapshot model.
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
  buildDocumentMarkdownBundle,
  copyTextToClipboard,
  downloadMarkdownAsPdf,
} from '@/features/document-actions/model/document-actions'
import { shouldConfirmDocumentDeletion } from '@/features/document-delete-confirmation/model/document-delete-confirmation'
import { DocumentDeleteConfirmationModal } from '@/features/document-delete-confirmation/ui/document-delete-confirmation-modal'
import { useDocumentSelection } from '@/features/document-selection/model/use-document-selection'
import { useWorkspaceFavorites } from '@/features/workspace-favorites/model/use-workspace-favorites'
import { useWorkspaceDraftPersistence } from '@/features/workspace-persistence/model/use-workspace-draft-persistence'
import { HelpDocument } from '@/widgets/help-document/ui/help-document'
import { Sidebar } from '@/widgets/sidebar/ui/sidebar'
import { AuthModal } from '@/features/auth/ui/auth-modal'
import { guestWorkspacePromptTitle, guestWorkspaceWarning } from '@/entities/document/model/mock'
import { mapSupabaseUserToWorkspaceAccount } from '@/shared/lib/supabase/account'
import { getSupabaseBrowserClient } from '@/shared/lib/supabase/browser-client'
import { useWorkspaceCloudSync } from '@/features/workspace-cloud-sync/model/use-workspace-cloud-sync'
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'

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

// Yield one animation frame before starting a heavier export so the loading spinner and processing toast can paint before Chromium work begins.
function nextAnimationFrame() {
  return new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()))
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
  helpMarkdown,
}: {
  snapshot: WorkspaceSnapshot
  helpMarkdown: string
}) {
  const [markdown, setMarkdown] = useState(snapshot.editor.markdown)
  const [isAuthenticated, setIsAuthenticated] = useState(snapshot.state === 'authorized')
  const [account, setAccount] = useState(snapshot.account)
  const [sidebarSection, setSidebarSection] = useState<WorkspaceSidebarSection>('history')
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  // Track whether the shell should show the read-only Help document instead of the normal editor/preview split.
  const [isHelpDocumentOpen, setIsHelpDocumentOpen] = useState(false)
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null)
  const [isSessionResolved, setIsSessionResolved] = useState(snapshot.state === 'authorized')
  const {
    documents,
    selectedCount,
    selectionMode,
    setAllSelected,
    setDocuments,
    toggleDocument,
  } = useDocumentSelection(snapshot.documents)

  const initialFavorites = snapshot.favorites ?? []
  const selectedDocuments = documents.filter((document) => document.selected)
  // Keep the local draft scope aligned with the live auth state so a sign-out can fall back to the guest cache without leaving the authorized key behind.
  const guestWorkspaceState = snapshot.state === 'empty' ? 'empty' : 'unauthorized'
  const workspacePersistenceScope = isAuthenticated ? 'authorized' : guestWorkspaceState
  const guestWarning = !isAuthenticated && documents.length >= 2 ? snapshot.warning ?? guestWorkspaceWarning : undefined
  const editorPlaceholder = isAuthenticated ? snapshot.prompt?.title ?? 'Start writing markdown' : guestWorkspacePromptTitle
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [isAuthBusy, setIsAuthBusy] = useState(false)
  const [authErrorMessage, setAuthErrorMessage] = useState<string | undefined>()
  const [pendingDeleteDocumentIds, setPendingDeleteDocumentIds] = useState<string[] | null>(null)
  const toastTimersRef = useRef<Map<string, number>>(new Map())
  const hasHydratedGuestTitleRef = useRef(false)
  const activeDocument = documents.find((document) => document.active) ?? documents[0]
  const activeExportTitle = activeDocument?.title ?? createDocumentTitle()

  // Keep a quiet browser draft in sync with the live workspace so refreshes, tab closes, and future cloud-sync handoffs can recover the same document collection without touching the visible UI state.
  useWorkspaceDraftPersistence({
    scope: workspacePersistenceScope,
    account,
    documents,
    editorMarkdown: markdown,
    sidebarSection,
    setAccount,
    setDocuments,
    setEditorMarkdown: setMarkdown,
    setSidebarSection,
  })

  // Keep authenticated workspaces connected to Supabase so every document mutation is mirrored into Postgres and Storage instead of only living in the local browser cache.
  const isHydratingRemoteDocuments = useWorkspaceCloudSync({
    enabled: isAuthenticated,
    userId: supabaseUserId,
    documents,
    editorMarkdown: markdown,
    sidebarSection,
    setDocuments,
    setEditorMarkdown: setMarkdown,
    setAccount,
  })
  const isDocumentsLoading = !isSessionResolved || (isAuthenticated && isHydratingRemoteDocuments)
  // Hydrate favorites through a separate cloud flow so reusable snapshots can load and save independently from the live document history.
  const {
    favorites: workspaceFavorites,
    isHydratingFavorites,
    createFavoriteFromDocument,
  } = useWorkspaceFavorites({
    enabled: isAuthenticated,
    userId: supabaseUserId,
    initialFavorites,
  })
  const isFavoritesLoading = !isSessionResolved || (isAuthenticated && isHydratingFavorites)

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

  // Hydrate the workspace from the current Supabase browser session and keep the signed-in identity synchronized whenever auth state changes in another tab or after a provider redirect.
  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    let isMounted = true

    // Fold the current Supabase session into the shell state so the workspace shows the real account and closes the auth modal once sign-in completes.
    const applyAuthenticatedSession = (sessionUser: User | null) => {
      if (!isMounted) {
        return
      }

      if (sessionUser) {
        setIsAuthenticated(true)
        setSupabaseUserId(sessionUser.id)
        setAccount(mapSupabaseUserToWorkspaceAccount(sessionUser))
        setIsAuthModalOpen(false)
        setSidebarSection('history')
        setAuthErrorMessage(undefined)
        setIsSessionResolved(true)
        return
      }

      setIsAuthenticated(false)
      setSupabaseUserId(null)
      setAccount(undefined)
      setIsAuthModalOpen(false)
      setIsSessionResolved(true)
    }

    void supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      applyAuthenticatedSession(session?.user ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      applyAuthenticatedSession(session?.user ?? null)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
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

  // Confirm that a document snapshot has been stored in the favorites collection so the document menu gives immediate feedback after the cloud write completes.
  const showFavoriteSavedToast = () => {
    showToast({
      tone: 'success',
      title: 'Saved to favorites',
      description: 'Open the Favorites tab to reuse it later.',
    })
  }

  // Announce the start of a PDF export so the user gets immediate feedback before Chromium finishes the server-side render.
  const showPdfProcessingToast = (count: number) => {
    showToast({
      tone: 'info',
      title: count === 1 ? 'Preparing PDF' : `Preparing ${count} PDFs`,
      description:
        count === 1
          ? 'The file is being processed. Please wait a couple of seconds.'
          : 'The files are being processed. Please wait a couple of seconds.',
    })
  }

  // Confirm the PDF export once the browser has received the generated blob so the workspace gives a clear completion signal.
  const showPdfDownloadedToast = (count: number) => {
    showToast({
      tone: 'success',
      title: count === 1 ? 'PDF downloaded' : `${count} PDFs downloaded`,
      description:
        count === 1
          ? 'The file has been saved to your downloads.'
          : 'The files have been saved to your downloads.',
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

    closeHelpDocument()
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

    closeHelpDocument()
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

  // Send one or more document markdown payloads to the server PDF route so the shared export flow always produces real PDF files instead of markdown bundles.
  const downloadDocumentPdfs = async (documentsToExport: DocumentRecord[]) => {
    if (documentsToExport.length === 0) {
      return
    }

    setIsDownloadingPdf(true)
    showPdfProcessingToast(documentsToExport.length)

    try {
      await nextAnimationFrame()
      for (const document of documentsToExport) {
        await downloadMarkdownAsPdf({
          title: document.title ?? createDocumentTitle(),
          markdown: document.markdown ?? '',
        })
      }

      showPdfDownloadedToast(documentsToExport.length)
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

    if (!targetDocument) {
      return
    }

    void downloadDocumentPdfs([targetDocument])
  }

  // Download the current selected set as one PDF per document so bulk export stays in the same output format as the single-document action.
  const handleDownloadSelectedDocuments = () => {
    void downloadDocumentPdfs(selectedDocuments)
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

  // Update a single document title without touching its markdown so the sidebar row and the export chip can be renamed independently of content.
  const handleRenameDocument = (documentId: string, nextTitle: string) => {
    const resolvedTitle = nextTitle.trim() || createDocumentTitle()

    setDocuments((current) =>
      current.map((document) =>
        document.id === documentId ? { ...document, title: resolvedTitle } : document
      )
    )
  }

  // Toggle the read-only Help document from the sidebar footer so the right-hand pane behaves like a workspace mode switch instead of a separate route.
  const toggleHelpDocument = () => {
    setIsHelpDocumentOpen((current) => !current)
  }

  // Return the shell to the editable workspace whenever the user opens or creates a real document from the sidebar controls.
  const closeHelpDocument = () => {
    setIsHelpDocumentOpen(false)
  }

  // Persist the active document title only, so the sidebar row and the export chip can rename together without tying the title to markdown content.
  const handleActiveDocumentTitleChange = (nextTitle: string) => {
    if (!activeDocument) {
      return
    }

    handleRenameDocument(activeDocument.id, nextTitle)
  }

  // Convert a favorite into a new active document so the Favorites tab becomes a real entry point instead of a decorative list.
  const handleUseFavorite = (favoriteId: string) => {
    if (!isAuthenticated && documents.length >= MAX_GUEST_DOCUMENTS) {
      showGuestLimitToast()
      return
    }

    const favorite = workspaceFavorites.find((item) => item.id === favoriteId)

    if (!favorite) {
      return
    }

    closeHelpDocument()
    const nextDocument: DocumentRecord = {
      id: createDocumentId(),
      title: createDocumentTitle(),
      updatedLabel: 'Just now',
      markdown: favorite.markdown,
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
    setMarkdown(favorite.markdown)
  }

  // Save the current document snapshot into the authenticated favorites collection so the row menu can turn any document into a reusable seed.
  const handleSaveDocumentToFavorites = (documentId: string) => {
    const targetDocument = documents.find((document) => document.id === documentId)

    if (!targetDocument) {
      return
    }

    void createFavoriteFromDocument(targetDocument)
      .then((savedFavorite) => {
        if (savedFavorite) {
          showFavoriteSavedToast()
        }
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Unable to save this favorite right now.'

        showToast({
          tone: 'warning',
          title: 'Could not save to favorites',
          description: message,
        })
      })
  }

  // Run email/password auth through Supabase so the modal can support both login and registration without owning credential storage itself.
  const handleEmailPasswordSubmit = async (email: string, password: string) => {
    const resolvedEmail = email.trim().toLowerCase()

    if (!resolvedEmail || !password) {
      setAuthErrorMessage('Enter both your email and password.')
      return
    }

    const supabase = getSupabaseBrowserClient()
    setIsAuthBusy(true)
    setAuthErrorMessage(undefined)

    const signInResult = await supabase.auth.signInWithPassword({
      email: resolvedEmail,
      password,
    })

    if (!signInResult.error) {
      setIsAuthBusy(false)
      return
    }

    const isMissingAccount = signInResult.error.message.toLowerCase().includes('invalid login credentials')

    if (!isMissingAccount) {
      setAuthErrorMessage(signInResult.error.message)
      setIsAuthBusy(false)
      return
    }

    const signUpResult = await supabase.auth.signUp({
      email: resolvedEmail,
      password,
    })

    if (signUpResult.error) {
      setAuthErrorMessage(signUpResult.error.message)
      setIsAuthBusy(false)
      return
    }

    if (!signUpResult.data.session) {
      setAuthErrorMessage('Check your email to confirm the account and finish signing in.')
    }

    setIsAuthBusy(false)
  }

  // Send Google sign-in through the Supabase OAuth flow so the workspace can reuse the same local auth modal and keep the redirect callback server-side.
  const handleGoogleSignIn = async () => {
    const supabase = getSupabaseBrowserClient()
    setIsAuthBusy(true)
    setAuthErrorMessage(undefined)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/`,
      },
    })

    if (error) {
      setAuthErrorMessage(error.message)
      setIsAuthBusy(false)
    }
  }

  // Sign out through Supabase so the session cookies disappear and the workspace falls back to the guest draft surface.
  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      showToast({
        tone: 'warning',
        title: 'Could not sign out',
        description: error.message,
      })
      return
    }

    setIsAuthModalOpen(false)
  }

  // Export the currently active document to a PDF through the server-side print route so the browser receives a real selectable document instead of a canvas capture.
  const handleDownloadActiveDocument = () => {
    if (!activeDocument) {
      return
    }

    void downloadDocumentPdfs([activeDocument])
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
            favorites={workspaceFavorites}
            warning={guestWarning}
            isDocumentsLoading={isDocumentsLoading}
            isFavoritesLoading={isFavoritesLoading}
            selectionMode={selectionMode}
            selectedCount={selectedCount}
            totalCount={documents.length}
            helperText={snapshot.selection?.helperText ?? 'Hold Ctrl to select many'}
            highlightActiveDocument={!isHelpDocumentOpen}
            onHelpClick={toggleHelpDocument}
            onSectionChange={(section) => {
              closeHelpDocument()
              setSidebarSection(section)
            }}
            onSignUpClick={() => setIsAuthModalOpen(true)}
            onSignOut={handleSignOut}
            onCreateDocument={handleCreateDocument}
            onUseFavorite={handleUseFavorite}
            onDownloadDocument={handleDownloadDocument}
            onDeleteDocument={handleDeleteDocument}
            onCopyMarkdownDocument={handleCopyMarkdownDocument}
            onSaveToFavorites={handleSaveDocumentToFavorites}
            onToggleAllSelection={setAllSelected}
            onToggleDocument={toggleDocument}
            onOpenDocument={handleOpenDocument}
            onDeleteSelected={handleDeleteSelectedDocuments}
            onDownloadSelected={handleDownloadSelectedDocuments}
            onRenameDocument={handleRenameDocument}
            onCopyMarkdownSelected={handleCopyMarkdownSelectedDocuments}
          />
        </div>

        <div className="min-h-0 min-w-0 flex-1">
          {isHelpDocumentOpen ? (
            <HelpDocument markdown={helpMarkdown} />
          ) : (
            <div className="grid h-full min-h-0 gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <MarkdownPane
                value={markdown}
                onChange={handleMarkdownChange}
                placeholder={editorPlaceholder}
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
          )}
        </div>
      </div>
      <div className="h-full min-h-0 lg:hidden">
        {isHelpDocumentOpen ? (
          <HelpDocument markdown={helpMarkdown} />
        ) : (
          <EditorPreview
            markdown={markdown}
            onMarkdownChange={handleMarkdownChange}
            onDownloadPdf={handleDownloadActiveDocument}
            isDownloadingPdf={isDownloadingPdf}
            placeholder={editorPlaceholder}
          />
        )}
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
        onOpenChange={(open) => {
          setIsAuthModalOpen(open)

          if (!open) {
            setAuthErrorMessage(undefined)
          }
        }}
        onEmailPasswordSubmit={handleEmailPasswordSubmit}
        onGoogleSignIn={handleGoogleSignIn}
        isLoading={isAuthBusy}
        errorMessage={authErrorMessage}
      />
    </>
  )
}








