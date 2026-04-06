/**
 * File: src/features/pdf-download-limit/model/supabase-pdf-download-limit-repository.ts
 * Purpose: Supabase-backed daily PDF quota repository for authenticated workspace users.
 * Why it exists: the export route needs an atomic counter that survives refreshes and concurrent requests without exposing direct table writes to the browser.
 * What it does: claims and releases one daily download slot through the Supabase RPC functions defined in the database migration.
 * Connected to: `app/api/export/pdf/route.tsx`, `pdf-download-limit.ts`, and the authenticated workspace session.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { PDF_DOWNLOAD_DAILY_LIMIT } from './pdf-download-limit'

export type PdfDownloadQuotaState = {
  allowed: boolean
  usedCount: number
  remainingCount: number
  dailyLimit: number
  quotaDate: string
}

type PdfDownloadQuotaRpcRow = {
  allowed: boolean
  used_count: number
  daily_limit: number
  remaining_count: number
  quota_day: string
}

// Normalize the RPC response into a stable shape so the route can reason about quota state without depending on raw Supabase row names.
function mapPdfDownloadQuotaRow(row: PdfDownloadQuotaRpcRow | null | undefined): PdfDownloadQuotaState {
  if (!row) {
    return {
      allowed: false,
      usedCount: 0,
      remainingCount: PDF_DOWNLOAD_DAILY_LIMIT,
      dailyLimit: PDF_DOWNLOAD_DAILY_LIMIT,
      quotaDate: new Date().toISOString().slice(0, 10),
    }
  }

  return {
    allowed: row.allowed,
    usedCount: row.used_count,
    remainingCount: row.remaining_count,
    dailyLimit: row.daily_limit,
    quotaDate: row.quota_day,
  }
}

// Claim a quota slot through Supabase so authenticated users are rate-limited by durable database state instead of a client-side counter.
export async function claimAuthenticatedPdfDownloadSlot(
  supabase: SupabaseClient,
  dailyLimit = PDF_DOWNLOAD_DAILY_LIMIT
): Promise<PdfDownloadQuotaState> {
  const { data, error } = await supabase
    .rpc('claim_pdf_download_quota', { p_daily_limit: dailyLimit })
    .single<PdfDownloadQuotaRpcRow>()

  if (error) {
    throw error
  }

  return mapPdfDownloadQuotaRow(data)
}

// Release a previously claimed quota slot if PDF generation fails after the slot was reserved, keeping the counter aligned with actual export outcomes.
export async function releaseAuthenticatedPdfDownloadSlot(
  supabase: SupabaseClient,
  dailyLimit = PDF_DOWNLOAD_DAILY_LIMIT
): Promise<PdfDownloadQuotaState> {
  const { data, error } = await supabase
    .rpc('release_pdf_download_quota', { p_daily_limit: dailyLimit })
    .single<PdfDownloadQuotaRpcRow>()

  if (error) {
    throw error
  }

  return mapPdfDownloadQuotaRow(data)
}
