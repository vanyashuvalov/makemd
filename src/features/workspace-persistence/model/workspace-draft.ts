/**
 * File: src/features/workspace-persistence/model/workspace-draft.ts
 * Purpose: Shared data model and helpers for the browser-backed workspace draft cache.
 * Why it exists: the workspace needs one versioned draft shape that can later be reused by local IndexedDB persistence and future cloud sync without rewriting the serialization rules.
 * What it does: defines the persisted draft payload, builds a stable storage key, normalizes restored payloads, and requests durable browser storage when available.
 * Connected to: `use-workspace-draft-persistence.ts`, the IndexedDB repository, and the workspace shell state wiring.
 */

import type { WorkspaceSnapshot, WorkspaceSidebarSection, DocumentRecord, WorkspaceStateKey } from '@/entities/document/model/types'
import { normalizeWorkspaceDocumentIds } from '@/entities/document/model/document-id'
import { sortDocumentsByUpdatedAt } from '@/entities/document/model/document-updated'

export type WorkspaceDraftScope = WorkspaceStateKey

export type WorkspaceDraftDocument = Pick<
  DocumentRecord,
  'id' | 'title' | 'updatedAt' | 'updatedLabel' | 'markdown' | 'active' | 'withMenu'
>

export interface WorkspaceDraftRecord {
  version: 1
  scope: WorkspaceDraftScope
  account?: WorkspaceSnapshot['account']
  sidebarSection: WorkspaceSidebarSection
  editorMarkdown: string
  documents: WorkspaceDraftDocument[]
  savedAt: number
}

// Keep every browser draft under a predictable versioned key so guest, empty, and authenticated workspaces can evolve independently without clobbering one another.
export function getWorkspaceDraftStorageKey(scope: WorkspaceDraftScope, accountEmail?: string) {
  if (scope === 'authorized') {
    const normalizedEmail = accountEmail?.trim().toLowerCase()

    return normalizedEmail ? `makemd:workspace-draft:v1:authorized:${encodeURIComponent(normalizedEmail)}` : 'makemd:workspace-draft:v1:authorized'
  }

  return `makemd:workspace-draft:v1:${scope}`
}

// Clone the current workspace into a persistence-friendly payload so IndexedDB stores only the durable document state and not transient selection or toast UI.
export function createWorkspaceDraftRecord({
  scope,
  account,
  sidebarSection,
  documents,
  editorMarkdown,
}: {
  scope: WorkspaceDraftScope
  account?: WorkspaceSnapshot['account']
  sidebarSection: WorkspaceSidebarSection
  documents: DocumentRecord[]
  editorMarkdown: string
}): WorkspaceDraftRecord {

  return {
    version: 1,
    scope,
    account,
    sidebarSection,
    editorMarkdown,
    documents: documents.map((document) => ({
      id: document.id,
      title: document.title,
      updatedAt: document.updatedAt,
      updatedLabel: document.updatedLabel,
      markdown: document.markdown ?? '',
      active: Boolean(document.active),
      withMenu: Boolean(document.withMenu),
    })),
    savedAt: Date.now(),
  }
}

// Rebuild a usable draft payload from IndexedDB so the workspace can restore the last local state without trusting stale or partially written records.
export function normalizeWorkspaceDraftRecord(draft: WorkspaceDraftRecord | null | undefined): WorkspaceDraftRecord | null {
  if (!draft || draft.version !== 1) {
    return null
  }

  const documents = sortDocumentsByUpdatedAt(
    normalizeWorkspaceDocumentIds(
      draft.documents
        .filter((document) => Boolean(document.id && document.title))
        .map((document) => ({
          id: document.id,
          title: document.title,
          updatedAt: document.updatedAt,
          updatedLabel: document.updatedLabel,
          markdown: document.markdown ?? '',
          active: Boolean(document.active),
          withMenu: Boolean(document.withMenu),
        }))
    )
  )

  if (documents.length === 0) {
    return null
  }

  const activeDocumentExists = documents.some((document) => document.active)

  return {
    ...draft,
    documents: activeDocumentExists
      ? documents
      : documents.map((document, index) => ({
          ...document,
          active: index === 0,
        })),
    editorMarkdown: draft.editorMarkdown ?? documents.find((document) => document.active)?.markdown ?? documents[0].markdown ?? '',
  }
}

// Ask the browser for persistent storage after the user has interacted with the workspace so the draft cache is less likely to be evicted under storage pressure.
export async function requestPersistentWorkspaceStorage() {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) {
    return false
  }

  try {
    return await navigator.storage.persist()
  } catch {
    return false
  }
}

