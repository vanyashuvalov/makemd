/**
 * File: src/features/workspace-favorites/model/workspace-favorite.ts
 * Purpose: Shared helpers for turning a document snapshot into a reusable favorite snapshot.
 * Why it exists: the shell, repository, and sidebar card all need one canonical way to derive favorite descriptions and content hashes.
 * What it does: builds a short display snippet from markdown, creates a favorite input payload from a document, and computes a stable content hash.
 * Connected to: the workspace favorites hook, the Supabase favorites repository, and the sidebar favorites list.
 */

import type { DocumentRecord, WorkspaceFavorite } from '@/entities/document/model/types'
import { parseMarkdownBlocks } from '@/entities/document/model/markdown'

export type WorkspaceFavoriteInput = Pick<WorkspaceFavorite, 'title' | 'description' | 'markdown'>

// Normalize markdown into a compact human-readable snippet so favorites can show a helpful description without storing extra UI-only state.
function createMarkdownSnippet(markdown: string) {
  const normalizedMarkdown = markdown.replace(/\r\n/g, '\n').trim()

  if (!normalizedMarkdown) {
    return 'Saved favorite'
  }

  const blocks = parseMarkdownBlocks(normalizedMarkdown)
  const primaryBlock = blocks.find((block) => block.type === 'paragraph') ?? blocks.find((block) => block.type === 'heading')
  const rawSnippet =
    primaryBlock && primaryBlock.type === 'heading' ? primaryBlock.text : primaryBlock?.type === 'paragraph' ? primaryBlock.text : normalizedMarkdown
  const compactSnippet = rawSnippet.replace(/\s+/g, ' ').replace(/^#+\s*/, '').trim()

  if (!compactSnippet) {
    return 'Saved favorite'
  }

  return compactSnippet.length > 120 ? `${compactSnippet.slice(0, 117).trimEnd()}...` : compactSnippet
}

// Convert a live document row into the favorite payload that can be persisted without keeping a back-reference to the source document.
export function createWorkspaceFavoriteFromDocument(document: DocumentRecord): WorkspaceFavoriteInput {
  return {
    title: document.title.trim() || 'Untitled favorite',
    description: createWorkspaceFavoriteDescription(document.markdown ?? ''),
    markdown: document.markdown ?? '',
  }
}

// Reuse the same excerpt builder for both optimistic toasts and persisted favorites so the visible card description always matches the saved payload.
export function createWorkspaceFavoriteDescription(markdown: string) {
  return createMarkdownSnippet(markdown)
}

// Compute a stable hash for a favorite so Supabase can deduplicate repeated saves of the same snapshot without linking it back to the source document row.
export async function createWorkspaceFavoriteContentHash(input: WorkspaceFavoriteInput) {
  const normalizedInput = `${input.title.trim().toLowerCase()}\n${input.markdown.replace(/\r\n/g, '\n')}`
  const inputBytes = new TextEncoder().encode(`makemd:favorites:${normalizedInput}`)

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', inputBytes)
    return bytesToHex(new Uint8Array(digest).slice(0, 16))
  }

  return bytesToHex(createFallbackHashBytes(inputBytes))
}

// Format a hash byte array into a plain hex string so the content hash stays compact and database-friendly.
function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

// Provide a deterministic fallback hash for environments where SubtleCrypto is not available.
function createFallbackHashBytes(inputBytes: Uint8Array) {
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
