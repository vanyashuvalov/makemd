'use client'

/**
 * File: src/entities/document/ui/document-history-list.tsx
 * Purpose: Renders the document history stack shown in the sidebar.
 * Why it exists: the product is document-centric, so the list is a core entity view rather than a one-off widget.
 * What it does: maps workspace documents into their repeated row presentation and exposes selection mode.
 * Connected to: `WorkspaceSnapshot`, `DocumentListItem`, and the sidebar state that owns history navigation.
 */
import type { DocumentRecord } from '../model/types'
import { DocumentListItem } from './document-list-item'

export interface DocumentHistoryListProps {
  items: DocumentRecord[]
  selectionMode?: boolean
  canCopyLink?: boolean
  canSaveToFavorites?: boolean
  onOpenItem?: (documentId: string) => void
  onToggleItem?: (documentId: string) => void
  onDownloadItem?: (documentId: string) => void
  onDeleteItem?: (documentId: string) => void
  onRenameItem?: (documentId: string, nextTitle: string) => void
  onCopyMarkdownItem?: (documentId: string) => void
  onCopyLinkItem?: (documentId: string) => void
  onSaveToFavoritesItem?: (documentId: string) => void
}

export function DocumentHistoryList({
  items,
  selectionMode = false,
  canCopyLink = false,
  canSaveToFavorites = false,
  onOpenItem,
  onToggleItem,
  onDownloadItem,
  onDeleteItem,
  onRenameItem,
  onCopyMarkdownItem,
  onCopyLinkItem,
  onSaveToFavoritesItem,
}: DocumentHistoryListProps) {
  // Render the repeated history rows with a single source of truth for title, timestamp, and active state.
  return (
    <div className="space-y-1.5">
      {items.map((item) => (
        <DocumentListItem
          key={item.id}
          item={item}
          selectionMode={selectionMode}
          canCopyLink={canCopyLink}
          canSaveToFavorites={canSaveToFavorites}
          onOpenDocument={onOpenItem}
          onToggleSelected={onToggleItem}
          onDownloadDocument={onDownloadItem}
          onDeleteDocument={onDeleteItem}
          onRenameDocument={onRenameItem}
          onCopyMarkdown={onCopyMarkdownItem}
          onCopyLink={onCopyLinkItem}
          onSaveToFavorites={onSaveToFavoritesItem}
        />
      ))}
    </div>
  )
}
