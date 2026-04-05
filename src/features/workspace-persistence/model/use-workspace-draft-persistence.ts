/**
 * File: src/features/workspace-persistence/model/use-workspace-draft-persistence.ts
 * Purpose: Client hook that restores and autosaves the workspace draft in the browser.
 * Why it exists: the workspace should survive refreshes and tab closes quietly, while leaving room for a future cloud-backed repository with the same contract.
 * What it does: loads one local draft on mount, keeps it in IndexedDB with a debounce, and deletes superseded drafts when the persistence scope changes.
 * Connected to: `workspace-shell-client.tsx`, the local IndexedDB repository, and the shared draft serialization helpers.
 */

import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react'
import type { DocumentRecord, WorkspaceSidebarSection, WorkspaceSnapshot } from '@/entities/document/model/types'
import {
  createWorkspaceDraftRecord,
  getWorkspaceDraftStorageKey,
  normalizeWorkspaceDraftRecord,
  requestPersistentWorkspaceStorage,
  type WorkspaceDraftRecord,
  type WorkspaceDraftScope,
} from './workspace-draft'
import { indexedDbWorkspaceDraftRepository, type WorkspaceDraftRepository } from './indexeddb-workspace-draft-repository'

export interface UseWorkspaceDraftPersistenceParams {
  scope: WorkspaceDraftScope
  account?: WorkspaceSnapshot['account']
  documents: DocumentRecord[]
  editorMarkdown: string
  sidebarSection: WorkspaceSidebarSection
  setAccount: Dispatch<SetStateAction<WorkspaceSnapshot['account'] | undefined>>
  setDocuments: Dispatch<SetStateAction<DocumentRecord[]>>
  setEditorMarkdown: Dispatch<SetStateAction<string>>
  setSidebarSection: Dispatch<SetStateAction<WorkspaceSidebarSection>>
  repository?: WorkspaceDraftRepository
}

// Restore the last local draft once per browser session, then keep writing changes back to the same repository key so refreshes and tab restarts preserve the live workspace state.
export function useWorkspaceDraftPersistence({
  scope,
  account,
  documents,
  editorMarkdown,
  sidebarSection,
  setAccount,
  setDocuments,
  setEditorMarkdown,
  setSidebarSection,
  repository = indexedDbWorkspaceDraftRepository,
}: UseWorkspaceDraftPersistenceParams) {
  const storageKey = getWorkspaceDraftStorageKey(scope, account?.email)
  const hasRestoredRef = useRef(false)
  const lastSavedStorageKeyRef = useRef<string | null>(null)
  const saveTimerRef = useRef<number | null>(null)
  const requestPersistenceOnceRef = useRef(false)
  const repositoryRef = useRef(repository)
  const applyRestoredDraftRef = useRef((draft: WorkspaceDraftRecord) => {
    setAccount(draft.account)
    setSidebarSection(draft.sidebarSection)
    setDocuments(
      draft.documents.map((document) => ({
        id: document.id,
        title: document.title,
        updatedAt: document.updatedAt,
        updatedLabel: document.updatedLabel,
        markdown: document.markdown,
        active: document.active,
        withMenu: document.withMenu,
        selected: false,
      }))
    )
    setEditorMarkdown(draft.editorMarkdown)
  })

  useEffect(() => {
    repositoryRef.current = repository
  }, [repository])

  useEffect(() => {
    applyRestoredDraftRef.current = (draft: WorkspaceDraftRecord) => {
      setAccount(draft.account)
      setSidebarSection(draft.sidebarSection)
      setDocuments(
        draft.documents.map((document) => ({
          id: document.id,
          title: document.title,
          updatedAt: document.updatedAt,
          updatedLabel: document.updatedLabel,
          markdown: document.markdown,
          active: document.active,
          withMenu: document.withMenu,
          selected: false,
        }))
      )
      setEditorMarkdown(draft.editorMarkdown)
    }
  }, [setAccount, setDocuments, setEditorMarkdown, setSidebarSection])

  // Load the current browser draft only once so the workspace quietly restores the last local session without repeatedly overwriting the live editor with storage reads.
  useEffect(() => {
    if (hasRestoredRef.current) {
      return
    }

    let isMounted = true

    const restoreDraft = async () => {
      const restoredDraft = await repositoryRef.current.load(storageKey)

      if (!isMounted) {
        return
      }

      hasRestoredRef.current = true
      lastSavedStorageKeyRef.current = storageKey

      const normalizedDraft = normalizeWorkspaceDraftRecord(restoredDraft)

      if (normalizedDraft) {
        applyRestoredDraftRef.current(normalizedDraft)

        if (!requestPersistenceOnceRef.current) {
          requestPersistenceOnceRef.current = true
          void requestPersistentWorkspaceStorage()
        }
      }
    }

    void restoreDraft()

    return () => {
      isMounted = false
    }
  }, [storageKey])

  // Persist the current workspace snapshot after a short pause so typing, renaming, opening, and deleting documents all feed the same browser-backed draft without spamming writes on every keystroke.
  useEffect(() => {
    if (!hasRestoredRef.current) {
      return
    }

    const draft = createWorkspaceDraftRecord({
      scope,
      account,
      sidebarSection,
      documents,
      editorMarkdown,
    })

    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current)
    }

    saveTimerRef.current = window.setTimeout(() => {
      const previousStorageKey = lastSavedStorageKeyRef.current

      void repositoryRef.current.save(storageKey, draft).then(() => {
        lastSavedStorageKeyRef.current = storageKey

        if (!requestPersistenceOnceRef.current) {
          requestPersistenceOnceRef.current = true
          void requestPersistentWorkspaceStorage()
        }

        if (previousStorageKey && previousStorageKey !== storageKey) {
          void repositoryRef.current.delete(previousStorageKey)
        }
      })
    }, 250)

    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current)
      }
    }
  }, [account, documents, editorMarkdown, scope, sidebarSection, storageKey])

  // Clear any pending debounce timer when the hook unmounts so the browser does not keep a stray timeout alive after the workspace leaves the page.
  useEffect(
    () => () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current)
      }
    },
    []
  )
}
