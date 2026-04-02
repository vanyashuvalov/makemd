'use client'

/**
 * File: src/features/document-actions/model/document-actions.ts
 * Purpose: Workspace document action helpers shared by row menus, bulk actions, and future export flows.
 * Why it exists: document actions need a single place for clipboard, download, and filename behavior so the sidebar stays composable.
 * What it does: provides reusable helpers for copying text, downloading blobs, and building stable document filenames.
 * Connected to: document row menus, the workspace controller, and future PDF/markdown export implementations.
 */

export type DocumentDownloadBlob = {
  blob: Blob
  fileName: string
}

// Normalize user-provided titles into file-safe names so future exports stay predictable across browser and OS targets.
export function buildDocumentFileName(title: string, extension: string) {
  const normalizedTitle = title.replace(/[^\w.-]+/g, '-').toLowerCase()
  return `${normalizedTitle}.${extension}`
}

// Copy plain text content into the clipboard so row menus can expose a reusable copy action without re-implementing clipboard mechanics.
export async function copyTextToClipboard(text: string) {
  if (!navigator.clipboard?.writeText) {
    throw new Error('Clipboard API is not available in this browser.')
  }

  await navigator.clipboard.writeText(text)
}

// Trigger a file download from an already prepared blob so the current markdown download and the future PDF export can share the same transport path.
export function downloadBlob({ blob, fileName }: DocumentDownloadBlob) {
  const url = URL.createObjectURL(blob)
  const anchor = window.document.createElement('a')

  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}
