/**
 * File: src/app/api/export/pdf/route.tsx
 * Purpose: Server-side PDF export endpoint for markdown documents.
 * Why it exists: the workspace needs a trusted PDF generation path that can validate the caller and return a browser-printable attachment.
 * What it does: validates the app-only handshake, renders markdown to HTML, prints it through Chromium, and returns the PDF bytes.
 * Connected to: `features/document-actions/model/document-actions.ts`, `features/document-actions/model/pdf-browser.ts`, and the PDF preview widgets.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createDocumentTitle } from '@/entities/document/model/document-title'
import { buildDocumentFileName } from '@/shared/lib/document-file-name'
import { PDF_EXPORT_APP_HEADER_NAME, PDF_EXPORT_APP_HEADER_VALUE } from '@/shared/lib/pdf-export-handshake'
import { runPdfTask } from '@/features/document-actions/model/pdf-browser'
import { PdfMarkdownDocument } from '@/widgets/editor-preview/ui/pdf-markdown-document'
import { defaultPdfPreviewTheme } from '@/widgets/editor-preview/model/pdf-theme'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type PdfExportRequest = {
  title?: string
  markdown?: string
}

// Reject any PDF export call that does not originate from the Makemd site and does not carry the app-only handshake header.
function isAllowedPdfExportRequest(request: NextRequest) {
  const requestOrigin = request.nextUrl.origin
  const requestOriginHeader = request.headers.get('origin')
  const requestRefererHeader = request.headers.get('referer')
  const requestAppHeader = request.headers.get(PDF_EXPORT_APP_HEADER_NAME)
  const hasTrustedOrigin = requestOriginHeader === requestOrigin || Boolean(requestRefererHeader?.startsWith(requestOrigin))

  return hasTrustedOrigin && requestAppHeader === PDF_EXPORT_APP_HEADER_VALUE
}

// Build the Content-Disposition header for a PDF attachment so browsers save the generated document using the same filename the UI expects.
function createPdfAttachmentDisposition(fileName: string) {
  const escapedFileName = fileName.replaceAll('"', '')
  return `attachment; filename="${escapedFileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
}

export async function POST(request: NextRequest) {
  if (!isAllowedPdfExportRequest(request)) {
    return NextResponse.json({ error: 'PDF export is only available from the Makemd app.' }, { status: 403 })
  }

  const body = (await request.json().catch(() => null)) as PdfExportRequest | null
  const markdown = body?.markdown

  if (typeof markdown !== 'string') {
    return NextResponse.json({ error: 'Missing markdown content.' }, { status: 400 })
  }

  const title = typeof body?.title === 'string' && body.title.trim() ? body.title.trim() : createDocumentTitle()
  const fileName = buildDocumentFileName(title, 'pdf')

  try {
    const { renderToStaticMarkup } = await import('react-dom/server')
    const html = renderToStaticMarkup(
      <PdfMarkdownDocument title={title} markdown={markdown} theme={defaultPdfPreviewTheme} />
    )

    const pdfBuffer = await runPdfTask(async ({ page }) => {
      // Feed Chromium a complete HTML document so print mode can calculate page breaks against the same semantic markdown tree the app shows on screen.
      await page.setContent(`<!doctype html>${html}`, {
        waitUntil: 'load',
      })

      return page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: '18mm',
          right: '16mm',
          bottom: '20mm',
          left: '16mm',
        },
      })
    })

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': createPdfAttachmentDisposition(fileName),
      },
    })
  } catch (error) {
    console.error('[pdf-export] route failed', error)
    return NextResponse.json({ error: 'Unable to generate PDF.' }, { status: 500 })
  }
}
