'use client'

/**
 * File: src/features/document-actions/model/document-actions.ts
 * Purpose: Workspace document action helpers shared by row menus, bulk actions, and future export flows.
 * Why it exists: document actions need a single place for clipboard, download, and filename behavior so the sidebar stays composable.
 * What it does: provides reusable helpers for copying text, downloading blobs, and building stable document filenames.
 * Connected to: document row menus, the workspace controller, and future PDF/markdown export implementations.
 */
import {
  buildDocumentFileName,
} from '@/shared/lib/document-file-name'

export type DocumentDownloadBlob = {
  blob: Blob
  fileName: string
}

export type DocumentActionSource = {
  title: string
  markdown?: string
}

// Build a stable bundle filename for single-document and multi-document actions so bulk export and copy flows keep the same naming rules.
export function buildDocumentBundleFileName(documents: DocumentActionSource[], extension: string) {
  if (documents.length === 1) {
    return buildDocumentFileName(documents[0].title, extension)
  }

  return `selected-documents.${extension}`
}

// Merge one or more markdown documents into a single clipboard-friendly bundle so bulk copy and future PDF export share one content shape.
export function buildDocumentMarkdownBundle(documents: DocumentActionSource[]) {
  if (documents.length === 0) {
    return ''
  }

  if (documents.length === 1) {
    return documents[0].markdown ?? ''
  }

  return documents
    .map((document) => `# ${document.title}\n\n${document.markdown ?? ''}`.trim())
    .join('\n\n---\n\n')
}

// Copy plain text content into the clipboard so row menus can expose a reusable copy action without re-implementing clipboard mechanics.
export async function copyTextToClipboard(text: string) {
  if (!navigator.clipboard?.writeText) {
    throw new Error('Clipboard API is not available in this browser.')
  }

  await navigator.clipboard.writeText(text)
}

export type PdfExportRequest = {
  title: string
  markdown: string
}

// Request a server-rendered PDF, then download the returned blob so the browser export path stays selectable and printable instead of rasterized.
export async function downloadMarkdownAsPdf({ title, markdown }: PdfExportRequest) {
  const fileName = buildDocumentFileName(title, 'pdf')
  const response = await fetch('/api/export/pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      markdown,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(errorText || 'Unable to generate PDF.')
  }

  const blob = await response.blob()
  downloadBlob({ blob, fileName })
}

// Trigger a file download from an already prepared blob so the current markdown download and any future binary export can share the same transport path.
export function downloadBlob({ blob, fileName }: DocumentDownloadBlob) {
  const url = URL.createObjectURL(blob)
  const anchor = window.document.createElement('a')

  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}














