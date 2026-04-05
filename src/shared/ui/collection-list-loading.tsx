'use client'

/**
 * File: src/shared/ui/collection-list-loading.tsx
 * Purpose: Shared loading placeholder for sidebar collection blocks.
 * Why it exists: both document history and favorites need the same quiet loading treatment, but each surface uses a different visual skeleton.
 * What it does: renders a spinner, a loading label, and either row-shaped or card-shaped skeleton blocks based on the requested variant.
 * Connected to: sidebar collection loading states, `DocumentListLoading`, and the favorites list loading surface.
 */

import { Spinner } from '@/shared/ui/spinner'
import { cn } from '@/shared/lib/cn'

export interface CollectionListLoadingProps {
  label: string
  variant?: 'rows' | 'cards'
}

// Render a lightweight collection placeholder so the sidebar can communicate that the remote snapshot is still loading without flashing stale content.
export function CollectionListLoading({ label, variant = 'rows' }: CollectionListLoadingProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-[16px] border border-sidebar-border bg-white/[0.03] px-4 py-4 text-sidebar-muted-foreground">
        <Spinner size="sm" className="text-sidebar-foreground/70" />
        <span className="text-[14px] leading-[18px]">{label}</span>
      </div>

      <div className={cn(variant === 'rows' ? 'space-y-1.5' : 'space-y-2')}>
        {Array.from({ length: 3 }).map((_, index) =>
          variant === 'rows' ? (
            <div
              key={index}
              className="h-[67px] animate-pulse rounded-[12px] border border-sidebar-border bg-white/[0.03] px-4 py-3"
            >
              <div className="h-4 w-3/4 rounded-full bg-white/[0.08]" />
              <div className="mt-3 h-3 w-1/3 rounded-full bg-white/[0.06]" />
            </div>
          ) : (
            <div key={index} className="rounded-[1rem] border border-sidebar-border bg-white/[0.03] p-4">
              <div className="h-4 w-3/4 rounded-full bg-white/[0.08]" />
              <div className="mt-3 h-3 w-full rounded-full bg-white/[0.06]" />
              <div className="mt-2 h-3 w-2/3 rounded-full bg-white/[0.06]" />
              <div className="mt-4 h-9 rounded-[0.85rem] bg-white/[0.08]" />
            </div>
          )
        )}
      </div>
    </div>
  )
}
