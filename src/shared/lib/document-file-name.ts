/**
 * File: src/shared/lib/document-file-name.ts
 * Purpose: File-name normalization helper shared by browser and server export flows.
 * Why it exists: document exports need one stable naming rule so the PDF route and the client download helper do not drift apart.
 * What it does: converts a human-readable title into a file-safe base name and appends the requested extension.
 * Connected to: document actions, PDF export routing, and any future download/export surfaces.
 */

// Normalize user-facing document titles into a predictable file name that stays valid across browser and OS download targets without stripping non-Latin characters or human-readable spacing.
export function buildDocumentFileName(title: string, extension: string) {
  const normalizedTitle = title
    .normalize('NFKC')
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .replace(/ +/g, ' ')
    .replace(/^ +| +$/g, '')
    .toLowerCase()

  return `${normalizedTitle || 'document'}.${extension}`
}
