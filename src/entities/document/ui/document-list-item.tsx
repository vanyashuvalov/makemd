'use client'

/**
 * File: src/entities/document/ui/document-list-item.tsx
 * Purpose: Single history row for the document sidebar.
 * Why it exists: the Figma design repeats the same row structure many times with only state changes.
 * What it does: renders title, date, active state, selection checkbox, and an optional overflow action.
 * Connected to: `DocumentHistoryList`, the selection feature, and the sidebar widget.
 */
import { IconDotsVertical, IconFileText } from '@tabler/icons-react'
import { Checkbox } from '@/shared/ui/checkbox'
import { IconButton } from '@/shared/ui/icon-button'
import { Icon } from '@/shared/ui/icon'
import { cn } from '@/shared/lib/cn'
import type { DocumentRecord } from '../model/types'

export interface DocumentListItemProps {
  item: DocumentRecord
  selectionMode?: boolean
  onOpenDocument?: (documentId: string) => void
  onToggleSelected?: (documentId: string) => void
}

export function DocumentListItem({
  item,
  selectionMode = false,
  onOpenDocument,
  onToggleSelected,
}: DocumentListItemProps) {
  const isSelected = Boolean(item.selected)
  const rowTone = item.selected || item.active ? 'bg-white/[0.15]' : 'bg-transparent'
  const showOverflow = !item.selected
  const handleRowClick = () => {
    if (selectionMode) {
      onToggleSelected?.(item.id)
      return
    }

    onOpenDocument?.(item.id)
  }

  // Render a single history row that can visually switch between the default, selected, and active states from the mockup.
  return (
    <article
      className={cn(
        'group flex min-h-[67px] cursor-pointer items-center gap-3 rounded-[12px] px-4 py-3 transition-[background-color] duration-150 active:bg-white/[0.08]',
        rowTone,
        !item.selected && !item.active ? 'hover:bg-white/[0.05]' : null
      )}
      onClick={handleRowClick}
    >
      {selectionMode ? (
        <Checkbox
          checked={isSelected}
          aria-label={`Select ${item.title}`}
          onClick={(event) => event.stopPropagation()}
          onCheckedChange={() => onToggleSelected?.(item.id)}
        />
      ) : (
        <div
          className={cn(
            'text-sidebar-foreground/60 transition-colors duration-150',
            !item.selected && !item.active ? 'group-hover:text-sidebar-foreground' : null
          )}
        >
          <Icon icon={IconFileText} size="md" />
        </div>
      )}

      <div className="min-w-0 flex-1 space-y-1">
        <h3 className="truncate text-[18px] font-normal leading-[22px] text-sidebar-foreground">
          {item.title}
        </h3>
        <p className="text-[14px] leading-[17px] text-sidebar-muted-foreground">
          {item.updatedLabel}
        </p>
      </div>

      {showOverflow ? (
        <IconButton
          aria-label={`Open actions for ${item.title}`}
          size="icon"
          variant="ghost"
          onClick={(event) => event.stopPropagation()}
          className={cn(
            'opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-hover:text-sidebar-foreground',
            item.active ? 'text-sidebar-foreground' : 'text-sidebar-muted-foreground'
          )}
        >
          <Icon icon={IconDotsVertical} size="md" />
        </IconButton>
      ) : null}
    </article>
  )
}
