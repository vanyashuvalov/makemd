'use client'

/**
 * File: src/entities/document/ui/document-list-item.tsx
 * Purpose: Single history row for the document sidebar.
 * Why it exists: the Figma design repeats the same row structure many times with only state changes.
 * What it does: renders title, date, active state, selection checkbox, and an optional overflow action.
 * Connected to: `DocumentHistoryList`, the selection feature, the contextual menu primitive, and the sidebar widget.
 */
import * as React from 'react'
import {
  IconCopy,
  IconDotsVertical,
  IconDownload,
  IconFileText,
  IconPencil,
  IconStar,
  IconTrash,
} from '@tabler/icons-react'
import { Checkbox } from '@/shared/ui/checkbox'
import { IconButton } from '@/shared/ui/icon-button'
import { Icon } from '@/shared/ui/icon'
import { ContextMenu, type ContextMenuItem } from '@/shared/ui/context-menu'
import { cn } from '@/shared/lib/cn'
import type { DocumentRecord } from '../model/types'

export interface DocumentListItemProps {
  item: DocumentRecord
  selectionMode?: boolean
  canSaveToFavorites?: boolean
  onOpenDocument?: (documentId: string) => void
  onToggleSelected?: (documentId: string) => void
  onDownloadDocument?: (documentId: string) => void
  onDeleteDocument?: (documentId: string) => void
  onRenameDocument?: (documentId: string, nextTitle: string) => void
  onCopyMarkdown?: (documentId: string) => void
  onSaveToFavorites?: (documentId: string) => void
}

export function DocumentListItem({
  item,
  selectionMode = false,
  canSaveToFavorites = false,
  onOpenDocument,
  onToggleSelected,
  onDownloadDocument,
  onDeleteDocument,
  onRenameDocument,
  onCopyMarkdown,
  onSaveToFavorites,
}: DocumentListItemProps) {
  const menuButtonRef = React.useRef<HTMLButtonElement | null>(null)
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const [isRenaming, setIsRenaming] = React.useState(false)
  const [draftTitle, setDraftTitle] = React.useState(item.title)
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const isSelected = Boolean(item.selected)
  const rowTone = item.selected || item.active ? 'bg-white/[0.15]' : 'bg-transparent'
  const showOverflow = !item.selected

  // Keep the inline editor aligned with the current row title unless the user is actively renaming the document.
  React.useEffect(() => {
    if (!isRenaming) {
      setDraftTitle(item.title)
    }
  }, [isRenaming, item.title])

  // Focus the inline title field when rename mode opens so the user can type immediately inside the list row.
  React.useEffect(() => {
    if (!isRenaming) {
      return
    }

    inputRef.current?.focus()
    inputRef.current?.select()
  }, [isRenaming])

  // Commit the renamed title back to the shared workspace state so the sidebar, export chip, and document model stay in sync.
  const commitRename = () => {
    const nextTitle = draftTitle.trim() || item.title
    onRenameDocument?.(item.id, nextTitle)
    setIsRenaming(false)
  }

  // Cancel rename mode and restore the current document title when the user dismisses the inline editor.
  const cancelRename = () => {
    setDraftTitle(item.title)
    setIsRenaming(false)
  }

  // Route document clicks through the selection mode first so bulk selection stays consistent with the Figma interaction model.
  const handleRowClick = () => {
    if (isRenaming) {
      return
    }

    if (isMenuOpen) {
      return
    }

    if (selectionMode) {
      onToggleSelected?.(item.id)
      return
    }

    onOpenDocument?.(item.id)
  }

  const menuItems: ContextMenuItem[] = [
    {
      key: 'rename',
      label: 'Rename',
      icon: IconPencil,
      onSelect: () => setIsRenaming(true),
    },
    {
      key: 'download',
      label: 'Download pdf',
      icon: IconDownload,
      onSelect: () => onDownloadDocument?.(item.id),
    },
    {
      key: 'copy-md',
      label: 'Copy Markdown',
      icon: IconCopy,
      onSelect: () => onCopyMarkdown?.(item.id),
    },
    ...(canSaveToFavorites
      ? [
          {
            key: 'save-to-favorites',
            label: 'Save to favorites',
            icon: IconStar,
            onSelect: () => onSaveToFavorites?.(item.id),
          },
        ]
      : []),
    {
      key: 'delete',
      label: 'Delete',
      icon: IconTrash,
      onSelect: () => onDeleteDocument?.(item.id),
      destructive: true,
    },
  ]

  // Render a single history row that can visually switch between the default, selected, and active states from the mockup.
  return (
    <>
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
              'text-sidebar-foreground/60 transition-colors duration-150 group-hover:text-sidebar-foreground'
            )}
          >
            <Icon icon={IconFileText} size="md" />
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-1">
          {isRenaming ? (
            <input
              ref={inputRef}
              value={draftTitle}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => setDraftTitle(event.target.value)}
              onBlur={commitRename}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  commitRename()
                }

                if (event.key === 'Escape') {
                  event.preventDefault()
                  cancelRename()
                }
              }}
              className="w-full border-none bg-transparent p-0 text-[18px] leading-[22px] font-normal text-sidebar-foreground outline-none placeholder:text-sidebar-muted-foreground"
              aria-label={`Rename ${item.title}`}
            />
          ) : (
            <h3 className="truncate text-[18px] font-normal leading-[22px] text-sidebar-foreground">
              {item.title}
            </h3>
          )}
          <p className="text-[14px] leading-[17px] text-sidebar-muted-foreground">
            {item.updatedLabel}
          </p>
        </div>

        {showOverflow ? (
          <IconButton
            ref={menuButtonRef}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            aria-label={`Open actions for ${item.title}`}
            size="icon"
            variant="ghost"
            onClick={(event) => {
              event.stopPropagation()
              setIsMenuOpen((current) => !current)
            }}
            className={cn(
              'opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-hover:text-sidebar-foreground',
              item.active ? 'text-sidebar-foreground' : 'text-sidebar-muted-foreground'
            )}
          >
            <Icon icon={IconDotsVertical} size="md" />
          </IconButton>
        ) : null}
      </article>

      <ContextMenu
        open={isMenuOpen}
        anchorRef={menuButtonRef}
        onOpenChange={setIsMenuOpen}
        items={menuItems}
      />
    </>
  )
}
