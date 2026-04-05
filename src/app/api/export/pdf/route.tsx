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
import { createSupabaseServerClient } from '@/shared/lib/supabase/server-client'
import { PdfMarkdownDocument } from '@/widgets/editor-preview/ui/pdf-markdown-document'
import { defaultPdfPreviewTheme } from '@/widgets/editor-preview/model/pdf-theme'
import {
  PDF_DOWNLOAD_DAILY_LIMIT,
  PDF_DOWNLOAD_GUEST_COOKIE_NAME,
  claimGuestPdfDownloadUsage,
  createPdfDownloadLimitMessage,
  releaseGuestPdfDownloadUsage,
} from '@/features/pdf-download-limit/model/pdf-download-limit'
import {
  claimAuthenticatedPdfDownloadSlot,
  releaseAuthenticatedPdfDownloadSlot,
} from '@/features/pdf-download-limit/model/supabase-pdf-download-limit-repository'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type PdfExportRequest = {
  title?: string
  markdown?: string
}

// Reject any PDF export call that does not originate from the Makemd site and does not carry the app-only handshake header, while still allowing same-origin form submissions from iPhone fallback flows.
function isAllowedPdfExportRequest(request: NextRequest) {
  const requestOrigin = request.nextUrl.origin
  const requestOriginHeader = request.headers.get('origin')
  const requestRefererHeader = request.headers.get('referer')
  const requestAppHeader = request.headers.get(PDF_EXPORT_APP_HEADER_NAME)
  const hasTrustedOrigin = requestOriginHeader === requestOrigin || Boolean(requestRefererHeader?.startsWith(requestOrigin))
  const isFormSubmission = request.headers.get('content-type')?.includes('application/x-www-form-urlencoded') || request.headers.get('content-type')?.includes('multipart/form-data')

  if (!hasTrustedOrigin) {
    return false
  }

  return requestAppHeader === PDF_EXPORT_APP_HEADER_VALUE || isFormSubmission
}

// Build the Content-Disposition header for a PDF attachment so browsers save the generated document using the same filename the UI expects.
function createPdfAttachmentDisposition(fileName: string) {
  const escapedFileName = fileName.replaceAll('"', '')
  return `attachment; filename="${escapedFileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
}

async function readPdfExportRequest(request: NextRequest) {
  const contentType = request.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return (await request.json().catch(() => null)) as PdfExportRequest | null
  }

  const formData = await request.formData().catch(() => null)

  if (!formData) {
    return null
  }

  return {
    title: typeof formData.get('title') === 'string' ? String(formData.get('title')) : undefined,
    markdown: typeof formData.get('markdown') === 'string' ? String(formData.get('markdown')) : undefined,
  }
}

// Build the guest quota cookie options so anonymous browsers keep their daily count across requests without exposing the counter to client-side JavaScript.
function createGuestPdfDownloadCookieOptions(request: NextRequest) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: request.nextUrl.protocol === 'https:',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  }
}

export async function POST(request: NextRequest) {
  if (!isAllowedPdfExportRequest(request)) {
    return NextResponse.json({ error: 'PDF export is only available from the Makemd app.' }, { status: 403 })
  }

  const body = await readPdfExportRequest(request)
  const markdown = body?.markdown

  if (typeof markdown !== 'string') {
    return NextResponse.json({ error: 'Missing markdown content.' }, { status: 400 })
  }

  const title = typeof body?.title === 'string' && body.title.trim() ? body.title.trim() : createDocumentTitle()
  const fileName = buildDocumentFileName(title, 'pdf')
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const guestQuotaCookie = request.cookies.get(PDF_DOWNLOAD_GUEST_COOKIE_NAME)?.value ?? null
  const isAuthenticatedRequest = Boolean(user)
  const guestQuotaClaim = isAuthenticatedRequest ? null : claimGuestPdfDownloadUsage(guestQuotaCookie, PDF_DOWNLOAD_DAILY_LIMIT)

  // Reserve a slot before the browser work begins so the route can enforce the quota without paying the Chromium cost for requests that are already over the daily cap.
  if (!isAuthenticatedRequest && !guestQuotaClaim?.allowed) {
    const response = NextResponse.json(
      { error: createPdfDownloadLimitMessage(PDF_DOWNLOAD_DAILY_LIMIT) },
      { status: 429 }
    )

    response.cookies.set(PDF_DOWNLOAD_GUEST_COOKIE_NAME, guestQuotaClaim!.cookieValue, createGuestPdfDownloadCookieOptions(request))
    return response
  }

  // Reserve the authenticated user's daily slot through Supabase so signed-in browsers share one durable quota across tabs and refreshes.
  let authenticatedQuotaReserved = false

  if (isAuthenticatedRequest) {
    const quotaState = await claimAuthenticatedPdfDownloadSlot(supabase, PDF_DOWNLOAD_DAILY_LIMIT)

    if (!quotaState.allowed) {
      return NextResponse.json({ error: createPdfDownloadLimitMessage(PDF_DOWNLOAD_DAILY_LIMIT) }, { status: 429 })
    }

    authenticatedQuotaReserved = true
  }

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

    const response = new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': createPdfAttachmentDisposition(fileName),
      },
    })

    if (guestQuotaClaim) {
      response.cookies.set(PDF_DOWNLOAD_GUEST_COOKIE_NAME, guestQuotaClaim.cookieValue, createGuestPdfDownloadCookieOptions(request))
    }

    return response
  } catch (error) {
    if (authenticatedQuotaReserved) {
      await releaseAuthenticatedPdfDownloadSlot(supabase, PDF_DOWNLOAD_DAILY_LIMIT).catch((releaseError: unknown) => {
        console.error('[pdf-export] quota rollback failed', releaseError)
      })
    }

    if (guestQuotaClaim) {
      const rolledBackGuestQuota = releaseGuestPdfDownloadUsage(guestQuotaClaim.usage, PDF_DOWNLOAD_DAILY_LIMIT)
      const response = NextResponse.json({ error: 'Unable to generate PDF.' }, { status: 500 })
      response.cookies.set(PDF_DOWNLOAD_GUEST_COOKIE_NAME, rolledBackGuestQuota.cookieValue, createGuestPdfDownloadCookieOptions(request))
      console.error('[pdf-export] route failed', error)
      return response
    }

    console.error('[pdf-export] route failed', error)
    return NextResponse.json({ error: 'Unable to generate PDF.' }, { status: 500 })
  }
}
