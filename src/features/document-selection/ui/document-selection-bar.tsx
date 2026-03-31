'use client'

/**
 * File: src/features/document-selection/ui/document-selection-bar.tsx
 * Purpose: Bulk-selection strip for multi-document actions.
 * Why it exists: one of the Figma states shows selected rows and a row of actions for them.
 * What it does: displays the selection count and the current batch operations in a compact rail.
 * Connected to: the document list, the sidebar, and future bulk management features.
 */
import { Copy, Download, Link2, Trash2 } from 'lucide-react'
import { Checkbox } from '@/shared/ui/checkbox'
import { IconButton } from '@/shared/ui/icon-button'
import { Separator } from '@/shared/ui/separator'
import { cn } from '@/shared/lib/cn'

export interface DocumentSelectionBarProps {
  selectedCount: number
  className?: string
}

export function DocumentSelectionBar({ selectedCount, className }: DocumentSelectionBarProps) {
  // Render the compact selected-state toolbar that mirrors the unauthorized mockup with 2 selected items.
  return (
    <div
      className={cn(
        'flex h-14 items-center gap-3 rounded-[1rem] border border-sidebar-border bg-sidebar-muted px-4 text-sidebar-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
        className
      )}
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <Checkbox checked="indeterminate" aria-label="Selection summary" />
        <span>{selectedCount}</span>
      </div>

      <Separator orientation="vertical" className="mx-1 h-6 bg-sidebar-border" />

      <div className="flex items-center gap-2">
        <IconButton aria-label="Delete selected documents" size="sm" variant="ghost">
          <Trash2 className="h-4 w-4" />
        </IconButton>
        <IconButton aria-label="Download selected documents" size="sm" variant="ghost">
          <Download className="h-4 w-4" />
        </IconButton>
        <IconButton aria-label="Copy share link" size="sm" variant="ghost">
          <Link2 className="h-4 w-4" />
        </IconButton>
        <IconButton aria-label="Copy selected content" size="sm" variant="ghost">
          <Copy className="h-4 w-4" />
        </IconButton>
      </div>
    </div>
  )
}
