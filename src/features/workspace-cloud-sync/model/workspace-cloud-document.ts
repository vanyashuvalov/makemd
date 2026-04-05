/**
 * File: src/features/workspace-cloud-sync/model/workspace-cloud-document.ts
 * Purpose: Shared helpers for translating workspace documents into Supabase-friendly cloud payloads.
 * Why it exists: cloud sync needs one reusable path builder, fingerprint helper, and label formatter so the shell does not duplicate storage or diff logic.
 * What it does: derives stable storage paths, compares document collections, and formats remote timestamps for the history list.
 * Connected to: the Supabase workspace document repository and the workspace cloud sync hook.
 */

import type { DocumentRecord } from '@/entities/document/model/types'

// Keep every uploaded markdown file under one predictable user-owned folder so the DB row and storage object can always be matched back together.
export function getWorkspaceCloudDocumentStoragePath(userId: string, documentId: string) {
  return `${userId}/documents/${documentId}.md`
}

// Reduce a document collection to a deterministic signature so the sync hook can skip duplicate writes and notice when rows were deleted.
export function createWorkspaceDocumentsSignature(documents: DocumentRecord[]) {
  return documents
    .map((document) =>
      [
        document.id,
        document.title,
        document.active ? '1' : '0',
        document.withMenu ? '1' : '0',
        document.markdown ?? '',
      ].join('::')
    )
    .join('||')
}

// Format a remote timestamp into the same readable history label style used by the mock data so cloud-loaded documents blend into the existing sidebar UI.
export function formatWorkspaceCloudUpdatedLabel(updatedAt: string | null | undefined) {
  if (!updatedAt) {
    return 'Just now'
  }

  const date = new Date(updatedAt)

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
