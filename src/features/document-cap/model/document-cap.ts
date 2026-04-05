/**
 * File: src/features/document-cap/model/document-cap.ts
 * Purpose: Shared document-cap rules for the workspace.
 * Why it exists: the app needs one reusable limit policy so create flows, favorite-to-document flows, and the overflow modal all agree on when the workspace is full.
 * What it does: defines the maximum document count, detects the cap condition, and picks the oldest documents that should be removed to make room.
 * Connected to: the workspace shell create handlers, the document-cap modal, and any future bulk cleanup or quota flows.
 */

import type { DocumentRecord } from '@/entities/document/model/types'
import { sortDocumentsByUpdatedAt } from '@/entities/document/model/document-updated'

export const MAX_DOCUMENT_COUNT = 100

export type DocumentCapPendingAction =
  | {
      kind: 'create'
    }
  | {
      kind: 'favorite'
      favoriteId: string
    }

// Check the current workspace size against the shared cap so every create path blocks at the same limit.
export function isDocumentCapReached(documentCount: number) {
  return documentCount >= MAX_DOCUMENT_COUNT
}

// Pick the oldest documents by update time so the cleanup modal always removes the least recent work first.
export function getOldestDocumentIds(documents: DocumentRecord[], count: number) {
  if (count <= 0 || documents.length === 0) {
    return []
  }

  return sortDocumentsByUpdatedAt(documents)
    .slice()
    .reverse()
    .slice(0, Math.min(count, documents.length))
    .map((document) => document.id)
}

