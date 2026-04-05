/**
 * File: src/features/pdf-download-limit/model/pdf-download-limit.ts
 * Purpose: Shared PDF download quota helpers for guest cookie tracking and reusable limit messaging.
 * Why it exists: the export route needs one compact model for the 50-per-day rule that both the server and browser helpers can understand without duplicating date and message logic.
 * What it does: stores the daily cap constant, parses and updates the guest quota cookie, and formats the user-facing limit message.
 * Connected to: `app/api/export/pdf/route.tsx`, `document-actions.ts`, and the authenticated quota repository.
 */

export const PDF_DOWNLOAD_DAILY_LIMIT = 50
export const PDF_DOWNLOAD_GUEST_COOKIE_NAME = 'mk_pdf_download_usage'

export type PdfDownloadUsage = {
  dateKey: string
  count: number
}

export type PdfDownloadUsageClaim = {
  allowed: boolean
  usage: PdfDownloadUsage
  cookieValue: string
  remaining: number
}

// Keep the quota keyed to UTC so the limit resets consistently for both browser and server code regardless of the user's timezone.
export function getPdfDownloadUtcDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

// Parse the guest cookie into a structured counter so the server route can increment or roll it back without depending on browser-only state.
export function parsePdfDownloadUsageCookie(cookieValue: string | null | undefined): PdfDownloadUsage {
  const todayKey = getPdfDownloadUtcDateKey()

  if (!cookieValue) {
    return { dateKey: todayKey, count: 0 }
  }

  const [dateKey, rawCount] = cookieValue.split(':')
  const parsedCount = Number.parseInt(rawCount ?? '', 10)

  if (!dateKey || Number.isNaN(parsedCount) || parsedCount < 0) {
    return { dateKey: todayKey, count: 0 }
  }

  if (dateKey !== todayKey) {
    return { dateKey: todayKey, count: 0 }
  }

  return { dateKey, count: parsedCount }
}

// Serialize the guest quota back into a compact cookie payload so the route can persist the latest count after a successful export.
export function serializePdfDownloadUsageCookie(usage: PdfDownloadUsage) {
  return `${usage.dateKey}:${usage.count}`
}

// Claim a guest PDF download slot for the current UTC day so the route can enforce the same cap for anonymous browsers without needing a database write.
export function claimGuestPdfDownloadUsage(
  cookieValue: string | null | undefined,
  dailyLimit = PDF_DOWNLOAD_DAILY_LIMIT,
  date = new Date()
): PdfDownloadUsageClaim {
  const dateKey = getPdfDownloadUtcDateKey(date)
  const currentUsage = parsePdfDownloadUsageCookie(cookieValue)
  const nextUsage = currentUsage.dateKey === dateKey ? currentUsage : { dateKey, count: 0 }

  if (nextUsage.count >= dailyLimit) {
    return {
      allowed: false,
      usage: nextUsage,
      cookieValue: serializePdfDownloadUsageCookie(nextUsage),
      remaining: 0,
    }
  }

  const claimedUsage = {
    dateKey,
    count: nextUsage.count + 1,
  }

  return {
    allowed: true,
    usage: claimedUsage,
    cookieValue: serializePdfDownloadUsageCookie(claimedUsage),
    remaining: Math.max(dailyLimit - claimedUsage.count, 0),
  }
}

// Roll back the guest counter if the export fails after a slot has already been consumed, so failed renders do not burn the whole browser quota.
export function releaseGuestPdfDownloadUsage(
  usage: PdfDownloadUsage,
  dailyLimit = PDF_DOWNLOAD_DAILY_LIMIT,
  date = new Date()
): PdfDownloadUsageClaim {
  const dateKey = getPdfDownloadUtcDateKey(date)
  const nextUsage = usage.dateKey === dateKey ? usage : { dateKey, count: 0 }
  const releasedUsage = {
    dateKey,
    count: Math.max(nextUsage.count - 1, 0),
  }

  return {
    allowed: true,
    usage: releasedUsage,
    cookieValue: serializePdfDownloadUsageCookie(releasedUsage),
    remaining: Math.max(dailyLimit - releasedUsage.count, 0),
  }
}

// Format one consistent message so the route, browser helper, and toast layer can all describe the same limit in human language.
export function createPdfDownloadLimitMessage(dailyLimit = PDF_DOWNLOAD_DAILY_LIMIT) {
  return `You have reached the daily PDF download limit of ${dailyLimit}. Try again tomorrow.`
}
