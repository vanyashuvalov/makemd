/**
 * File: src/shared/lib/document-file-name.ts
 * Purpose: File-name normalization helper shared by browser and server export flows.
 * Why it exists: document exports need one stable naming rule so the PDF route and the client download helper do not drift apart.
 * What it does: converts a human-readable title into a file-safe base name and appends the requested extension.
 * Connected to: document actions, PDF export routing, and any future download/export surfaces.
 */

// Normalize user-facing document titles into a predictable file name that stays valid across browser and OS download targets.
export function buildDocumentFileName(title: string, extension: string) {
  const normalizedTitle = title.replace(/[^\w.-]+/g, '-').toLowerCase()
  return `${normalizedTitle}.${extension}`
}
