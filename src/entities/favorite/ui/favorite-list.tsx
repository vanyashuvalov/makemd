'use client'

/**
 * File: src/entities/favorite/ui/favorite-list.tsx
 * Purpose: Authenticated favorites surface shown in the sidebar tab.
 * Why it exists: favorites should reuse the same row presentation as documents while staying an independent cloud collection.
 * What it does: renders saved favorite snapshots as document-like rows, opens a new document on click, and exposes create/delete actions through the row menu.
 * Connected to: the authenticated sidebar tab state, the workspace favorite repository, the document row component, and the workspace document creation flow.
 */
import { IconFilePlus, IconStar, IconTrash } from '@tabler/icons-react'
import type { WorkspaceFavorite } from '@/entities/document/model/types'
import type { DocumentRecord } from '@/entities/document/model/types'
import { DocumentListItem } from '@/entities/document/ui/document-list-item'
import { CollectionListLoading } from '@/shared/ui/collection-list-loading'
import type { ContextMenuItem } from '@/shared/ui/context-menu'

export interface FavoriteListProps {
  items: WorkspaceFavorite[]
  isLoading?: boolean
  onUseFavorite: (favoriteId: string) => void
  onDeleteFavorite: (favoriteId: string) => void
}

// Render favorites with the same list-row component as documents so reusable snapshots feel like first-class workspace entries.
export function FavoriteList({
  items,
  isLoading = false,
  onUseFavorite,
  onDeleteFavorite,
}: FavoriteListProps) {
  if (isLoading) {
    return <CollectionListLoading label="Loading favorites" variant="rows" />
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[1rem] border border-sidebar-border bg-white/5 p-4 text-sm text-sidebar-muted-foreground">
        No favorites yet.
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      {items.map((item) => {
        const favoriteRow: DocumentRecord = {
          id: item.id,
          title: item.title,
          updatedLabel: item.description,
          active: false,
          selected: false,
        }

        const menuItems: ContextMenuItem[] = [
          {
            key: 'create-document',
            label: 'Create document',
            icon: IconFilePlus,
            onSelect: () => onUseFavorite(item.id),
          },
          {
            key: 'delete',
            label: 'Delete',
            icon: IconTrash,
            destructive: true,
            onSelect: () => onDeleteFavorite(item.id),
          },
        ]

        return (
          <DocumentListItem
            key={item.id}
            item={favoriteRow}
            leadingIcon={IconStar}
            menuItems={menuItems}
            onOpenDocument={() => onUseFavorite(item.id)}
          />
        )
      })}
    </div>
  )
}
