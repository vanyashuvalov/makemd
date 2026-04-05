/**
 * File: src/features/workspace-cloud-sync/model/use-workspace-cloud-sync.ts
 * Purpose: Client hook that keeps authenticated workspace documents in Supabase in sync with the live editor state.
 * Why it exists: the app already had local IndexedDB drafts, but signed-in users also need real DB and Storage writes so their changes survive across devices.
 * What it does: hydrates the authenticated workspace from Supabase, then debounces saves and deletes so document create/edit/delete actions emit real remote requests.
 * Connected to: `workspace-shell-client.tsx`, the Supabase workspace document repository, and the shared cloud document helpers.
 */

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import type { DocumentRecord, WorkspaceSidebarSection, WorkspaceSnapshot } from '@/entities/document/model/types'
import { formatDocumentUpdatedLabel, sortDocumentsByUpdatedAt } from '@/entities/document/model/document-updated'
import {
  createWorkspaceDocumentContentSignature,
  createWorkspaceDocumentsSignature,
} from './workspace-cloud-document'
import {
  supabaseWorkspaceDocumentRepository,
  type WorkspaceCloudDocumentRepository,
} from './supabase-workspace-document-repository'

export interface UseWorkspaceCloudSyncParams {
  enabled: boolean
  userId: string | null
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
  const lastSavedDocumentSignaturesRef = useRef<Map<string, string>>(new Map())
  const saveTimerRef = useRef<number | null>(null)
  const [isHydratingRemote, setIsHydratingRemote] = useState(false)
  const liveDocumentsSignature = createWorkspaceDocumentsSignature(documents)
  // Reset the cloud sync bookkeeping whenever the signed-in user changes so one account cannot leak its sync state into another.
  useEffect(() => {
    hasLoadedRemoteRef.current = false
    lastSavedSignatureRef.current = null
    lastSavedDocumentIdsRef.current = []
    lastSavedDocumentSignaturesRef.current = new Map()
    setIsHydratingRemote(false)
  }, [userId])

  // Hydrate the workspace from Supabase as soon as an authenticated session is available so cloud rows become the source of truth before the shell starts saving local mutations.
  useEffect(() => {
    if (!enabled || !userId || hasLoadedRemoteRef.current) {
      return
    }

    let isMounted = true

    const loadRemoteDocuments = async () => {
      setIsHydratingRemote(true)

      try {
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
        lastSavedDocumentSignaturesRef.current = new Map(
          remoteDocuments.map((document) => [document.id, createWorkspaceDocumentContentSignature(document)])
        )

        setDocuments(remoteDocuments)
        setEditorMarkdown(remoteDocuments.find((document) => document.active)?.markdown ?? remoteDocuments[0]?.markdown ?? '')
        setAccount((current) => current)
      } catch (error) {
        // Keep the workspace usable when the initial cloud hydrate fails so the local draft can still continue syncing once the browser regains a stable connection.
        console.error('[workspace-cloud-sync] remote hydrate failed', error)
      } finally {
        if (isMounted) {
          hasLoadedRemoteRef.current = true
          setIsHydratingRemote(false)
        }
      }
    }

    void loadRemoteDocuments()

    return () => {
      isMounted = false
    }
  }, [
    enabled,
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
      const previousDocumentSignatures = lastSavedDocumentSignaturesRef.current
      const changedDocuments = documents.filter((document) => {
        const nextDocumentSignature = createWorkspaceDocumentContentSignature(document)
        return previousDocumentSignatures.get(document.id) !== nextDocumentSignature
      })
      const nextDocumentSignatureMap = new Map(
        documents.map((document) => [document.id, createWorkspaceDocumentContentSignature(document)])
      )

      void Promise.resolve()
        .then(async () => {
          if (removedDocumentIds.length > 0) {
            await repository.delete(userId, removedDocumentIds)
          }

          if (changedDocuments.length > 0) {
            const savedTimestamps = await repository.save(userId, changedDocuments)
            const savedTimestampMap = new Map<string, string>(
              savedTimestamps.map((item) => [item.id, item.updatedAt])
            )

            // Merge the DB-provided timestamps back into local state so the sidebar labels and sort order reflect the same `updated_at` values that Supabase just wrote.
            if (savedTimestampMap.size > 0) {
              setDocuments((current) =>
                sortDocumentsByUpdatedAt(
                  current.map((document) => {
                    const updatedAt = savedTimestampMap.get(document.id)

                    if (!updatedAt) {
                      return document
                    }

                    return {
                      ...document,
                      updatedAt,
                      updatedLabel: formatDocumentUpdatedLabel(updatedAt),
                    }
                  })
                )
              )
            }
          }

          lastSavedSignatureRef.current = nextSignature
          lastSavedDocumentIdsRef.current = currentDocumentIds
          lastSavedDocumentSignaturesRef.current = nextDocumentSignatureMap
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
  }, [documents, editorMarkdown, enabled, liveDocumentsSignature, repository, setDocuments, sidebarSection, userId])

  // Clear any pending sync debounce when the hook unmounts so the browser does not try to write a stale draft after the workspace leaves the page.
  useEffect(
    () => () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current)
      }
    },
    []
  )

  return isHydratingRemote
}
