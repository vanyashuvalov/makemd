'use client'

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import type { DocumentRecord } from '@/entities/document/model/types'
import { normalizeWorkspaceDocumentIds } from '@/entities/document/model/document-id'
import { createWorkspaceDocumentContentSignature as signature } from './workspace-cloud-document'
import { mergeWorkspaceDocuments } from './merge-workspace-documents'
import { supabaseWorkspaceDocumentRepository, type WorkspaceCloudDocumentRepository } from './supabase-workspace-document-repository'

export type CloudSyncStatus = 'idle' | 'loading' | 'saving' | 'saved' | 'error'

export function useWorkspaceCloudSync({ enabled, userId, documents, deletedDocumentIds, setDeletedDocumentIds, setDocuments, setEditorMarkdown, repository = supabaseWorkspaceDocumentRepository }: {
  enabled: boolean
  userId: string | null
  documents: DocumentRecord[]
  deletedDocumentIds: string[]
  setDeletedDocumentIds: Dispatch<SetStateAction<string[]>>
  setDocuments: Dispatch<SetStateAction<DocumentRecord[]>>
  setEditorMarkdown: Dispatch<SetStateAction<string>>
  repository?: WorkspaceCloudDocumentRepository
}) {
  const [status, setStatus] = useState<CloudSyncStatus>('idle')
  const [revision, setRevision] = useState(0)
  const latest = useRef(documents)
  const latestDeleted = useRef(deletedDocumentIds)
  const session = useRef({ generation: 0, hydrated: false, saving: false, baseline: new Map<string, string>() })
  useEffect(() => { latest.current = documents; latestDeleted.current = deletedDocumentIds }, [documents, deletedDocumentIds])
  const retry = useCallback(() => setRevision((value) => value + 1), [])

  useEffect(() => {
    session.current = { generation: session.current.generation + 1, hydrated: false, saving: false, baseline: new Map() }
    setStatus('idle')
    return () => { session.current.generation += 1 }
  }, [enabled, userId])

  useEffect(() => {
    if (!enabled || !userId || session.current.hydrated) return
    let cancelled = false
    const generation = session.current.generation
    setStatus('loading')
    void repository.load(userId).then((rows) => {
      if (cancelled || generation !== session.current.generation) return
      const remote = normalizeWorkspaceDocumentIds(rows)
      const merged = mergeWorkspaceDocuments(latest.current, remote, latestDeleted.current)
      session.current.baseline = new Map(remote.map((document) => [document.id, signature(document)]))
      session.current.hydrated = true
      setDocuments(merged)
      setEditorMarkdown(merged.find((document) => document.active)?.markdown ?? '')
      setStatus('saved')
      setRevision((value) => value + 1)
    }).catch(() => {
      if (!cancelled && generation === session.current.generation) setStatus('error')
      // Do not allow writes after a failed load: an incomplete list cannot prove a deletion.
    })
    return () => { cancelled = true }
  }, [enabled, userId, repository, setDocuments, setEditorMarkdown, revision])

  useEffect(() => {
    if (!enabled || !userId || !session.current.hydrated || session.current.saving) return
    const current = session.current
    const changed = documents.filter((document) => current.baseline.get(document.id) !== signature(document))
    const ids = new Set(documents.map((document) => document.id))
    const removed = [...new Set([...deletedDocumentIds, ...current.baseline.keys()].filter((id) => !ids.has(id)))]
    if (!changed.length && !removed.length) return
    const generation = current.generation
    const timer = window.setTimeout(() => {
      current.saving = true
      setStatus('saving')
      void (async () => {
        try {
          if (changed.length) await repository.save(userId, changed)
          if (removed.length) await repository.delete(userId, removed)
          if (generation !== session.current.generation) return
          // Only acknowledge the snapshot actually sent; newer edits remain dirty.
          changed.forEach((document) => current.baseline.set(document.id, signature(document)))
          removed.forEach((id) => current.baseline.delete(id))
          const acknowledged = new Map(changed.map((document) => [document.id, signature(document)]))
          setDocuments((latestDocuments) => latestDocuments.map((document) => acknowledged.has(document.id) ? { ...document, cloudSyncedSignature: acknowledged.get(document.id) } : document))
          if (removed.length) setDeletedDocumentIds((latestIds) => latestIds.filter((id) => !removed.includes(id)))
          setStatus('saved')
          setRevision((value) => value + 1)
        } catch {
          if (generation === session.current.generation) setStatus('error')
        } finally {
          current.saving = false
        }
      })()
    }, 700)
    return () => window.clearTimeout(timer)
  }, [documents, deletedDocumentIds, enabled, userId, repository, revision, setDocuments, setDeletedDocumentIds])

  useEffect(() => {
    window.addEventListener('online', retry)
    const timer = window.setInterval(() => { if (navigator.onLine) retry() }, 30000)
    return () => { window.removeEventListener('online', retry); window.clearInterval(timer) }
  }, [retry])

  const pending = deletedDocumentIds.length > 0 || documents.some((document) => session.current.baseline.get(document.id) !== signature(document)) || session.current.baseline.size !== documents.length
  return { status: status === 'saved' && pending ? 'saving' as const : status, retry, isHydrating: enabled && (status === 'idle' || status === 'loading') }
}
