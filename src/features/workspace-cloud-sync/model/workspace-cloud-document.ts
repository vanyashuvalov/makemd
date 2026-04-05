/**
 * File: src/features/workspace-cloud-sync/model/workspace-cloud-document.ts
 * Purpose: Shared helpers for translating workspace documents into Supabase-friendly cloud payloads.
 * Why it exists: cloud sync needs one reusable path builder, fingerprint helper, and label formatter so the shell does not duplicate storage or diff logic.
 * What it does: derives stable storage paths, compares document collections, and formats remote timestamps for the history list.
 * Connected to: the Supabase workspace document repository and the workspace cloud sync hook.
 */

import type { DocumentRecord } from '@/entities/document/model/types'
import { formatDocumentUpdatedLabel } from '@/entities/document/model/document-updated'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// Keep every uploaded markdown file under one predictable user-owned folder so the DB row and storage object can always be matched back together.
export function getWorkspaceCloudDocumentStoragePath(userId: string, documentId: string) {
  return `${userId}/documents/${documentId}.md`
}

// Convert any local workspace document id into a stable UUID-compatible cloud id so the Postgres primary key can keep using a native uuid column without the UI having to know about that storage detail.
export async function getWorkspaceCloudDocumentId(documentId: string) {
  if (UUID_PATTERN.test(documentId)) {
    return documentId.toLowerCase()
  }

  const nextBytes = await getWorkspaceCloudDocumentIdBytes(documentId)
  return formatUuidBytes(nextBytes)
}

// Hash an arbitrary workspace id into 16 stable bytes so the browser repo can always write a UUID-shaped key even when Web Crypto is unavailable.
async function getWorkspaceCloudDocumentIdBytes(documentId: string) {
  const inputBytes = new TextEncoder().encode(`makemd:${documentId}`)

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', inputBytes)
    return new Uint8Array(digest).slice(0, 16)
  }

  return createFallbackUuidBytes(inputBytes)
}

// Format a 16-byte hash into the canonical UUID shape that Supabase expects for the documents primary key.
function formatUuidBytes(bytes: Uint8Array) {
  const nextBytes = Array.from(bytes)

  nextBytes[6] = (nextBytes[6] & 0x0f) | 0x40
  nextBytes[8] = (nextBytes[8] & 0x3f) | 0x80

  const hex = nextBytes.map((byte) => byte.toString(16).padStart(2, '0'))

  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-')
}

// Provide a deterministic fallback hash path so cloud id generation still works in environments where SubtleCrypto is missing.
function createFallbackUuidBytes(inputBytes: Uint8Array) {
  let a = 0x243f6a88
  let b = 0x85a308d3
  let c = 0x13198a2e
  let d = 0x03707344

  for (const byte of inputBytes) {
    a = Math.imul(a ^ byte, 0x9e3779b1)
    b = Math.imul(b ^ byte, 0x85ebca6b)
    c = Math.imul(c ^ byte, 0xc2b2ae35)
    d = Math.imul(d ^ byte, 0x27d4eb2f)
  }

  const bytes = new Uint8Array(16)
  const words = [a, b, c, d]

  words.forEach((word, wordIndex) => {
    const offset = wordIndex * 4
    bytes[offset] = (word >>> 24) & 0xff
    bytes[offset + 1] = (word >>> 16) & 0xff
    bytes[offset + 2] = (word >>> 8) & 0xff
    bytes[offset + 3] = word & 0xff
  })

  return bytes
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
  return formatDocumentUpdatedLabel(updatedAt)
}



