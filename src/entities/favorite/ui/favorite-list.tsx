'use client'

/**
 * File: src/entities/favorite/ui/favorite-list.tsx
 * Purpose: Authenticated favorites surface shown in the sidebar tab.
 * Why it exists: favorites are a separate user-owned collection, independent from documents, and should create new documents on demand.
 * What it does: renders saved favorite snapshots, exposes the create-document action, and falls back to a loading or empty state when needed.
 * Connected to: the authenticated sidebar tab state, the workspace favorite repository, and the workspace document creation flow.
 */
import { IconStar } from '@tabler/icons-react'
import type { WorkspaceFavorite } from '@/entities/document/model/types'
import { Button } from '@/shared/ui/button'
import { Icon } from '@/shared/ui/icon'
import { cn } from '@/shared/lib/cn'
import { CollectionListLoading } from '@/shared/ui/collection-list-loading'

export interface FavoriteListProps {
  items: WorkspaceFavorite[]
  isLoading?: boolean
  onUseFavorite: (favoriteId: string) => void
}

export function FavoriteList({ items, isLoading = false, onUseFavorite }: FavoriteListProps) {
  // Keep favorites visually separate from history so saved snapshots behave like reusable seeds rather than document rows.
  if (isLoading) {
    return <CollectionListLoading label="Loading favorites" variant="cards" />
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[1rem] border border-sidebar-border bg-white/5 p-4 text-sm text-sidebar-muted-foreground">
        No favorites yet.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <article
          key={item.id}
          className={cn(
            'group rounded-[1rem] border border-sidebar-border bg-white/[0.04] p-4 transition-[background-color,border-color] duration-150 hover:bg-white/[0.07] hover:border-white/10'
          )}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-sidebar-foreground/60 group-hover:text-sidebar-foreground">
              <Icon icon={IconStar} size="md" />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="space-y-1">
                <h3 className="truncate text-[18px] font-normal leading-[22px] text-sidebar-foreground">
                  {item.title}
                </h3>
                <p className="text-[14px] leading-[17px] text-sidebar-muted-foreground">
                  {item.description}
                </p>
              </div>
              <Button variant="secondary" size="sm" className="w-full" onClick={() => onUseFavorite(item.id)}>
                Create document
              </Button>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
