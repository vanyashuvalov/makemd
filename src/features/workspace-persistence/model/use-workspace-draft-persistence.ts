'use client'

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import type { DocumentRecord, WorkspaceSidebarSection, WorkspaceSnapshot } from '@/entities/document/model/types'
import { canonicalizeWorkspaceDraft } from './canonicalize-workspace-draft'
import { createWorkspaceDocumentId } from '@/entities/document/model/document-id'
import { createDocumentTitle } from '@/entities/document/model/document-title'
import { createWorkspaceDraftRecord, getWorkspaceDraftStorageKey, normalizeWorkspaceDraftRecord, requestPersistentWorkspaceStorage, type WorkspaceDraftScope } from './workspace-draft'
import { indexedDbWorkspaceDraftRepository, type WorkspaceDraftRepository } from './indexeddb-workspace-draft-repository'

export function useWorkspaceDraftPersistence({ enabled, scope, account, documents, editorMarkdown, sidebarSection, deletedDocumentIds, setDeletedDocumentIds, setDocuments, setEditorMarkdown, setSidebarSection, repository = indexedDbWorkspaceDraftRepository }: {
  enabled: boolean
  scope: WorkspaceDraftScope
  account?: WorkspaceSnapshot['account']
  documents: DocumentRecord[]
  editorMarkdown: string
  sidebarSection: WorkspaceSidebarSection
  deletedDocumentIds: string[]
  setDeletedDocumentIds: Dispatch<SetStateAction<string[]>>
  setDocuments: Dispatch<SetStateAction<DocumentRecord[]>>
  setEditorMarkdown: Dispatch<SetStateAction<string>>
  setSidebarSection: Dispatch<SetStateAction<WorkspaceSidebarSection>>
  repository?: WorkspaceDraftRepository
}) {
  const storageKey = getWorkspaceDraftStorageKey(scope, account?.email)
  const [restoredKey, setRestoredKey] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'saving' | 'saved' | 'error'>('loading')
  const latestSave = useRef(0)
  const ready = enabled && restoredKey === storageKey

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    // Status reflects an external storage operation, including account-scope changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus('loading')
    void repository.load(storageKey).then(async (raw) => {
      if (cancelled) return
      const draft = await canonicalizeWorkspaceDraft(normalizeWorkspaceDraftRecord(raw))
      if (cancelled) return
      // Each identity owns its cache. Never move or delete another account's draft on login/logout.
      const restored = draft?.documents ?? (scope === 'authorized' ? [] : [{ id: createWorkspaceDocumentId(), title: createDocumentTitle(), markdown: '', updatedAt: new Date().toISOString(), updatedLabel: 'Just now', active: true, withMenu: true }])
      setDeletedDocumentIds(draft?.deletedDocumentIds ?? [])
      setDocuments(restored)
      setEditorMarkdown(draft?.editorMarkdown ?? '')
      setSidebarSection(draft?.sidebarSection ?? 'history')
      setRestoredKey(storageKey)
      setStatus('saved')
    }).catch(() => {
      if (!cancelled) {
        // A failed read must not be followed by an overwrite of an unread cache.
        setDocuments([])
        setEditorMarkdown('')
        setStatus('error')
      }
    })
    return () => { cancelled = true }
  }, [enabled, scope, storageKey, repository, setDocuments, setEditorMarkdown, setSidebarSection, setDeletedDocumentIds])

  useEffect(() => {
    if (!ready) return
    const draft = createWorkspaceDraftRecord({ scope, account, sidebarSection, documents, editorMarkdown, deletedDocumentIds })
    const sequence = ++latestSave.current
    // eslint-disable-next-line react-hooks/set-state-in-effect -- expose the pending durable write
    setStatus('saving')
    // Start the IndexedDB transaction on every change. A debounce loses the last keystrokes on refresh.
    void repository.save(storageKey, draft).then(() => {
      if (sequence === latestSave.current) setStatus('saved')
    }).catch(() => {
      if (sequence === latestSave.current) setStatus('error')
    })
  }, [ready, scope, account, sidebarSection, documents, editorMarkdown, storageKey, repository, deletedDocumentIds])

  useEffect(() => { if (ready) void requestPersistentWorkspaceStorage() }, [ready])
  return { ready, status }
}
