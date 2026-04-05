'use client'

/**
 * File: src/features/document-actions/model/document-actions.ts
 * Purpose: Workspace document action helpers shared by row menus, bulk actions, and future export flows.
 * Why it exists: document actions need a single place for clipboard, download, and filename behavior so the sidebar stays composable.
 * What it does: provides reusable helpers for copying text, downloading blobs, and building stable document filenames.
 * Connected to: document row menus, the workspace controller, the shared PDF export handshake, and future PDF/markdown export implementations.
 */
import { buildDocumentFileName } from '@/shared/lib/document-file-name'
import { isIOSLikeDevice } from '@/shared/lib/browser-platform'
import { buildMarkdownHtmlComment } from '@/shared/lib/markdown-comments'
import {
  PDF_EXPORT_APP_HEADER_NAME,
  PDF_EXPORT_APP_HEADER_VALUE,
} from '@/shared/lib/pdf-export-handshake'

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
    .map((document) => `${buildMarkdownHtmlComment(document.title)}\n\n${document.markdown ?? ''}`.trim())
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

// Build the request headers for the PDF export path so every caller includes the same app-only handshake.
export function createPdfExportRequestHeaders() {
  return {
    'Content-Type': 'application/json',
    [PDF_EXPORT_APP_HEADER_NAME]: PDF_EXPORT_APP_HEADER_VALUE,
  }
}

// Request a server-rendered PDF, then download the returned blob so the browser export path stays selectable and printable instead of rasterized.
export async function downloadMarkdownAsPdf({ title, markdown }: PdfExportRequest) {
  if (isIOSLikeDevice()) {
    submitPdfDownloadForm({ title, markdown })
    return
  }

  const fileName = buildDocumentFileName(title, 'pdf')
  const response = await fetch('/api/export/pdf', {
    method: 'POST',
    headers: createPdfExportRequestHeaders(),
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

// Submit the PDF request as a same-origin form post so iPhone Safari can handle the attachment response more reliably than a blob URL download.
function submitPdfDownloadForm({ title, markdown }: PdfExportRequest) {
  const form = window.document.createElement('form')
  const targetName = `pdf-download-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const iframe = window.document.createElement('iframe')

  iframe.name = targetName
  iframe.style.display = 'none'

  form.method = 'POST'
  form.action = '/api/export/pdf'
  form.target = targetName
  form.style.display = 'none'

  const titleInput = window.document.createElement('input')
  titleInput.type = 'hidden'
  titleInput.name = 'title'
  titleInput.value = title

  const markdownInput = window.document.createElement('textarea')
  markdownInput.name = 'markdown'
  markdownInput.value = markdown

  form.append(titleInput, markdownInput)
  window.document.body.append(iframe, form)
  form.submit()

  window.setTimeout(() => {
    iframe.remove()
    form.remove()
  }, 5000)
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
