'use client'

/**
 * File: src/widgets/sidebar/ui/document-list-loading.tsx
 * Purpose: Loading placeholder for the sidebar history block while cloud documents are being hydrated.
 * Why it exists: the sidebar should not flash stale local rows before Supabase data finishes loading, especially for signed-in sessions that need the cloud snapshot to win.
 * What it does: shows a compact spinner and a few skeleton rows that match the height of the real document list block.
 * Connected to: `DocumentList`, the sidebar widget, and the workspace cloud sync hydration state.
 */

import { Spinner } from '@/shared/ui/spinner'

// Render a lightweight history placeholder so the sidebar can communicate that the document list is still waiting on cloud data.
export function DocumentListLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-[16px] border border-sidebar-border bg-white/[0.03] px-4 py-4 text-sidebar-muted-foreground">
        <Spinner size="sm" className="text-sidebar-foreground/70" />
        <span className="text-[14px] leading-[18px]">Loading cloud documents</span>
      </div>

      <div className="space-y-1.5">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-[67px] animate-pulse rounded-[12px] border border-sidebar-border bg-white/[0.03] px-4 py-3"
          >
            <div className="h-4 w-3/4 rounded-full bg-white/[0.08]" />
            <div className="mt-3 h-3 w-1/3 rounded-full bg-white/[0.06]" />
          </div>
        ))}
      </div>
    </div>
  )
}
