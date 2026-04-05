/**
 * File: src/features/workspace-cloud-sync/model/use-workspace-cloud-sync.ts
 * Purpose: Client hook that keeps authenticated workspace documents in Supabase in sync with the live editor state.
 * Why it exists: the app already had local IndexedDB drafts, but signed-in users also need real DB and Storage writes so their changes survive across devices.
 * What it does: optionally hydrates from Supabase when the workspace is still pristine, then debounces saves and deletes so document create/edit/delete actions emit real remote requests.
 * Connected to: `workspace-shell-client.tsx`, the Supabase workspace document repository, and the shared cloud document helpers.
 */

import { useEffect, useMemo, useRef, type Dispatch, type SetStateAction } from 'react'
import type { DocumentRecord, WorkspaceSidebarSection, WorkspaceSnapshot } from '@/entities/document/model/types'
import {
  createWorkspaceDocumentsSignature,
  type WorkspaceCloudDocumentRepository,
  supabaseWorkspaceDocumentRepository,
} from './supabase-workspace-document-repository'

export interface UseWorkspaceCloudSyncParams {
  enabled: boolean
  userId: string | null
  initialDocuments: DocumentRecord[]
  documents: DocumentRecord[]
  editorMarkdown: string
  sidebarSection: WorkspaceSidebarSection
  setDocuments: Dispatch<SetStateAction<DocumentRecord[]>>
  setEditorMarkdown: Dispatch<SetStateAction<string>>
  setAccount: Dispatch<SetStateAction<WorkspaceSnapshot['account'] | undefined>>
  repository?: WorkspaceCloudDocumentRepository
}

// Keep the cloud sync layer separate from the local draft cache so authenticated workspaces can write to Supabase without disturbing the browser-side restore flow.
export function useWorkspaceCloudSync({
  enabled,
  userId,
  initialDocuments,
  documents,
  editorMarkdown,
  sidebarSection,
  setDocuments,
  setEditorMarkdown,
  setAccount,
  repository = supabaseWorkspaceDocumentRepository,
}: UseWorkspaceCloudSyncParams) {
  const hasLoadedRemoteRef = useRef(false)
  const lastSavedSignatureRef = useRef<string | null>(null)
  const lastSavedDocumentIdsRef = useRef<string[]>([])
  const saveTimerRef = useRef<number | null>(null)
  const initialDocumentsSignature = useMemo(() => createWorkspaceDocumentsSignature(initialDocuments), [initialDocuments])
  const liveDocumentsSignature = useMemo(() => createWorkspaceDocumentsSignature(documents), [documents])

  // Reset the cloud sync bookkeeping whenever the signed-in user changes so one account cannot leak its sync state into another.
  useEffect(() => {
    hasLoadedRemoteRef.current = false
    lastSavedSignatureRef.current = null
    lastSavedDocumentIdsRef.current = []
  }, [userId])

  // Hydrate the workspace from Supabase only when the current shell still matches the pristine server snapshot, which lets local drafts win without hiding the cloud source of truth for fresh sessions.
  useEffect(() => {
    if (!enabled || !userId || hasLoadedRemoteRef.current) {
      return
    }

    let isMounted = true

    const loadRemoteDocuments = async () => {
      if (liveDocumentsSignature !== initialDocumentsSignature) {
        hasLoadedRemoteRef.current = true
        return
      }

      const remoteDocuments = await repository.load(userId)

      if (!isMounted) {
        return
      }

      hasLoadedRemoteRef.current = true

      if (remoteDocuments.length === 0) {
        return
      }

      lastSavedSignatureRef.current = createWorkspaceDocumentsSignature(remoteDocuments)
      lastSavedDocumentIdsRef.current = remoteDocuments.map((document) => document.id)

      setDocuments(remoteDocuments)
      setEditorMarkdown(remoteDocuments.find((document) => document.active)?.markdown ?? remoteDocuments[0]?.markdown ?? '')
      setAccount((current) => current)
    }

    void loadRemoteDocuments()

    return () => {
      isMounted = false
    }
  }, [
    enabled,
    initialDocumentsSignature,
    liveDocumentsSignature,
    repository,
    setAccount,
    setDocuments,
    setEditorMarkdown,
    userId,
  ])

  // Debounce cloud writes so document edits, renames, creates, and deletes all batch into one remote save instead of spamming Supabase on every keystroke.
  useEffect(() => {
    if (!enabled || !userId || !hasLoadedRemoteRef.current) {
      return
    }

    const nextSignature = liveDocumentsSignature

    if (nextSignature === lastSavedSignatureRef.current) {
      return
    }

    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current)
    }

    saveTimerRef.current = window.setTimeout(() => {
      const previousDocumentIds = lastSavedDocumentIdsRef.current
      const currentDocumentIds = documents.map((document) => document.id)
      const removedDocumentIds = previousDocumentIds.filter((documentId) => !currentDocumentIds.includes(documentId))

      void Promise.resolve()
        .then(async () => {
          if (removedDocumentIds.length > 0) {
            await repository.delete(userId, removedDocumentIds)
          }

          if (documents.length > 0) {
            await repository.save(userId, documents)
          }

          lastSavedSignatureRef.current = nextSignature
          lastSavedDocumentIdsRef.current = currentDocumentIds
        })
        .catch((error) => {
          // Keep cloud sync silent in the UI, but make failures observable in the console so backend issues are still discoverable during debugging.
          console.error('[workspace-cloud-sync] remote save failed', error)
        })
    }, 700)

    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current)
      }
    }
  }, [documents, editorMarkdown, enabled, liveDocumentsSignature, repository, sidebarSection, userId])

  // Clear any pending sync debounce when the hook unmounts so the browser does not try to write a stale draft after the workspace leaves the page.
  useEffect(
    () => () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current)
      }
    },
    []
  )
}
