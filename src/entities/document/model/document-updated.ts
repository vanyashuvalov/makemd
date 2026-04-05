/**
 * File: src/entities/document/model/document-updated.ts
 * Purpose: Shared helpers for document freshness timestamps and ordering.
 * Why it exists: the sidebar, persistence layer, and cloud sync all need the same updated-time rules so document rows stay sorted and labeled consistently.
 * What it does: creates an ISO timestamp for the last edit time, formats that timestamp for the row subtitle, and sorts documents by recency.
 * Connected to: document creation and mutation flows, local draft persistence, cloud sync hydration, and the history list UI.
 */

import type { DocumentRecord } from './types'

// Format the row subtitle from a single timestamp source so the sidebar always shows the last edit time in the same human-readable style.
export function formatDocumentUpdatedLabel(updatedAt: string | Date | null | undefined) {
  if (!updatedAt) {
    return 'Just now'
  }

  const date = updatedAt instanceof Date ? updatedAt : new Date(updatedAt)

  if (Number.isNaN(date.getTime())) {
    return 'Just now'
  }

  const day = new Intl.DateTimeFormat('en-GB', { day: '2-digit' }).format(date)
  const month = new Intl.DateTimeFormat('en-GB', { month: 'short' }).format(date)
  const time = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)

  return `${day} ${month} • ${time}`
}

// Generate a canonical ISO timestamp for a document row so edits, renames, and new documents can all share the same update field.
export function createDocumentUpdatedAt(date = new Date()) {
  return date.toISOString()
}

// Sort document rows by the most recent update time so the sidebar always surfaces the freshest work first, regardless of where the rows came from.
export function sortDocumentsByUpdatedAt(documents: DocumentRecord[]) {
  return [...documents].sort((left, right) => {
    const leftTime = left.updatedAt ? Date.parse(left.updatedAt) : Number.NEGATIVE_INFINITY
    const rightTime = right.updatedAt ? Date.parse(right.updatedAt) : Number.NEGATIVE_INFINITY

    if (Number.isNaN(leftTime) && Number.isNaN(rightTime)) {
      return left.title.localeCompare(right.title)
    }

    if (Number.isNaN(leftTime)) {
      return 1
    }

    if (Number.isNaN(rightTime)) {
      return -1
    }

    if (leftTime !== rightTime) {
      return rightTime - leftTime
    }

    return left.title.localeCompare(right.title)
  })
}
