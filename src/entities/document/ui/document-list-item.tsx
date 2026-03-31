'use client'

/**
 * File: src/entities/document/ui/document-list-item.tsx
 * Purpose: Single history row for the document sidebar.
 * Why it exists: the Figma design repeats the same row structure many times with only state changes.
 * What it does: renders title, date, active state, selection checkbox, and an optional overflow action.
 * Connected to: `DocumentHistoryList`, the selection feature, and the sidebar widget.
 */
import { FileText, MoreVertical } from 'lucide-react'
import { Checkbox } from '@/shared/ui/checkbox'
import { IconButton } from '@/shared/ui/icon-button'
import { cn } from '@/shared/lib/cn'
import type { DocumentRecord } from '../model/types'

export interface DocumentListItemProps {
  item: DocumentRecord
  selectionMode?: boolean
}

export function DocumentListItem({ item, selectionMode = false }: DocumentListItemProps) {
  const isSelected = Boolean(item.selected)

  // Render a single history row that can visually switch between the default, selected, and active states from the mockup.
  return (
    <article
      className={cn(
        'group flex cursor-pointer items-start gap-3 rounded-[0.95rem] px-4 py-3.5 transition-[transform,background-color,box-shadow] duration-150 hover:-translate-y-px active:translate-x-px active:translate-y-px',
        item.active
          ? 'bg-white/[0.12] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
          : isSelected
            ? 'bg-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
            : 'hover:bg-white/[0.05] active:bg-white/[0.08]'
      )}
    >
      {selectionMode ? (
        <Checkbox
          checked={item.active ? 'indeterminate' : item.selected ?? false}
          aria-label={`Select ${item.title}`}
        />
      ) : (
        <div className="mt-0.5 text-sidebar-foreground/80">
          <FileText className="h-5 w-5" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[15px] font-medium leading-5 text-sidebar-foreground">
          {item.title}
        </h3>
        <p className="mt-1 text-[11px] leading-4 text-sidebar-muted-foreground">
          {item.updatedLabel}
        </p>
      </div>

      {item.withMenu ? (
        <IconButton
          aria-label={`Open actions for ${item.title}`}
          size="sm"
          variant="ghost"
          className={cn(
            'mt-0.5 opacity-80 transition-opacity group-hover:opacity-100',
            item.active ? 'text-sidebar-foreground' : 'text-sidebar-muted-foreground group-hover:text-sidebar-foreground'
          )}
        >
          <MoreVertical className="h-4 w-4" />
        </IconButton>
      ) : null}
    </article>
  )
}
