/**
 * File: src/entities/document/model/document-id.ts
 * Purpose: Shared helpers for generating and repairing workspace document identifiers.
 * Why it exists: document ids feed both local state and Supabase storage paths, so they must stay unique and stable across create/restore flows.
 * What it does: creates collision-resistant ids for new documents and normalizes collections that accidentally contain duplicate ids.
 * Connected to: the workspace shell, browser draft restore, and cloud sync hydration.
 */

import type { DocumentRecord } from './types'

// Generate a collision-resistant document id so repeated creates in the same millisecond do not reuse the same local identifier.
export function createWorkspaceDocumentId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `doc-${crypto.randomUUID()}`
  }

  return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// Rebuild a document collection with unique ids so downstream storage paths and database keys never collide after a stale restore or a bad local draft.
export function normalizeWorkspaceDocumentIds(documents: DocumentRecord[]) {
  const seenIds = new Set<string>()

  return documents.map((document) => {
    if (!seenIds.has(document.id)) {
      seenIds.add(document.id)
      return document
    }

    const nextId = createWorkspaceDocumentId()
    seenIds.add(nextId)

    return {
      ...document,
      id: nextId,
    }
  })
}
