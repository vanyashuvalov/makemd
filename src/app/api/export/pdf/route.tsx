import { NextRequest, NextResponse } from 'next/server'
import { renderToStaticMarkup } from 'react-dom/server'
import { createDocumentTitle } from '@/entities/document/model/document-title'
import { buildDocumentFileName } from '@/shared/lib/document-file-name'
import { launchPdfBrowser } from '@/features/document-actions/model/pdf-browser'
import { PdfMarkdownDocument } from '@/widgets/editor-preview/ui/pdf-markdown-document'
import { defaultPdfPreviewTheme } from '@/widgets/editor-preview/model/pdf-theme'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type PdfExportRequest = {
  title?: string
  markdown?: string
}

// Build the Content-Disposition header for a PDF attachment so browsers save the generated document using the same filename the UI expects.
function createPdfAttachmentDisposition(fileName: string) {
  const escapedFileName = fileName.replaceAll('"', '')
  return `attachment; filename="${escapedFileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as PdfExportRequest | null
  const markdown = body?.markdown

  if (typeof markdown !== 'string') {
    return NextResponse.json({ error: 'Missing markdown content.' }, { status: 400 })
  }

  const title = typeof body?.title === 'string' && body.title.trim() ? body.title.trim() : createDocumentTitle()
  const fileName = buildDocumentFileName(title, 'pdf')
  let browser: Awaited<ReturnType<typeof launchPdfBrowser>> | null = null

  try {
    browser = await launchPdfBrowser()
    const page = await browser.newPage()
    const html = renderToStaticMarkup(
      <PdfMarkdownDocument title={title} markdown={markdown} theme={defaultPdfPreviewTheme} />
    )

    // Feed Chromium a complete HTML document so print mode can calculate page breaks against the same semantic markdown tree the app shows on screen.
    await page.setContent(`<!doctype html>${html}`, {
      waitUntil: 'networkidle',
    })

    const pdfBuffer = await page.pdf({
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

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': createPdfAttachmentDisposition(fileName),
      },
    })
  } catch (error) {
    console.error('[pdf-export] route failed', error)
    return NextResponse.json({ error: 'Unable to generate PDF.' }, { status: 500 })
  } finally {
    await browser?.close()
  }
}
