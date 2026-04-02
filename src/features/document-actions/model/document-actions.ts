'use client'

/**
 * File: src/features/document-actions/model/document-actions.ts
 * Purpose: Workspace document action helpers shared by row menus, bulk actions, and future export flows.
 * Why it exists: document actions need a single place for clipboard, download, and filename behavior so the sidebar stays composable.
 * What it does: provides reusable helpers for copying text, downloading blobs, and building stable document filenames.
 * Connected to: document row menus, the workspace controller, and future PDF/markdown export implementations.
 */
import { getMarkdownTitle } from '@/entities/document/model/markdown'

export type DocumentDownloadBlob = {
  blob: Blob
  fileName: string
}

export type DocumentActionSource = {
  title: string
  markdown?: string
  customExportTitle?: string
}

// Resolve the display title for exports and chips so the controller can reuse one rule for derived markdown headings and user-pinned overrides.
export function getDocumentExportTitle(
  document: DocumentActionSource | undefined,
  markdown: string,
  fallback: string
) {
  if (document?.customExportTitle) {
    return document.customExportTitle
  }

  return getMarkdownTitle(markdown, document?.title ?? fallback)
}

// Normalize user-provided titles into file-safe names so future exports stay predictable across browser and OS targets.
export function buildDocumentFileName(title: string, extension: string) {
  const normalizedTitle = title.replace(/[^\w.-]+/g, '-').toLowerCase()
  return `${normalizedTitle}.${extension}`
}

// Build a stable bundle filename for single-document and multi-document actions so bulk export and copy flows keep the same naming rules.
export function buildDocumentBundleFileName(documents: DocumentActionSource[], extension: string) {
  if (documents.length === 1) {
    return buildDocumentFileName(documents[0].customExportTitle ?? documents[0].title, extension)
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

// Export a rendered markdown preview surface to a PDF download so row actions and the preview chrome can share the same visual output path.
export async function downloadElementAsPdf(element: HTMLElement, fileName: string) {
  const { default: html2pdf } = await import('html2pdf.js')

  await html2pdf()
    .set({
      filename: fileName,
      margin: [0, 0, 0, 0],
      image: {
        type: 'jpeg',
        quality: 0.98,
      },
      html2canvas: {
        scale: Math.min(window.devicePixelRatio || 2, 2),
        useCORS: true,
        backgroundColor: '#ffffff',
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
      },
    })
    .from(element)
    .save()
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
