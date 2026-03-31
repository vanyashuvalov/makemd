'use client'

/**
 * File: src/features/document-selection/ui/document-selection-bar.tsx
 * Purpose: Bulk-selection strip for multi-document actions.
 * Why it exists: one of the Figma states shows selected rows and a row of actions for them.
 * What it does: displays the selection count and the current batch operations in a compact rail.
 * Connected to: the document list, the sidebar, and future bulk management features.
 */
import { IconCopy, IconDownload, IconLink, IconTrash } from '@tabler/icons-react'
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
        'flex h-14 items-center gap-3 rounded-[1rem] border border-sidebar-border bg-sidebar-muted px-4 text-sidebar-foreground',
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
          <IconTrash className="h-4 w-4" />
        </IconButton>
        <IconButton aria-label="Download selected documents" size="sm" variant="ghost">
          <IconDownload className="h-4 w-4" />
        </IconButton>
        <IconButton aria-label="Copy share link" size="sm" variant="ghost">
          <IconLink className="h-4 w-4" />
        </IconButton>
        <IconButton aria-label="Copy selected content" size="sm" variant="ghost">
          <IconCopy className="h-4 w-4" />
        </IconButton>
      </div>
    </div>
  )
}
