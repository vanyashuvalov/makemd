/**
 * File: src/features/workspace-favorites/model/use-workspace-favorites.ts
 * Purpose: Client hook that hydrates and mutates the authenticated favorites collection.
 * Why it exists: favorites are a separate cloud-backed collection and should load quietly without mixing into the document sync hook.
 * What it does: loads favorites from Supabase on sign-in, keeps them in local state, and exposes a save action for the document row menu.
 * Connected to: `workspace-shell-client.tsx`, the favorites sidebar tab, and the Supabase favorites repository.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { DocumentRecord, WorkspaceFavorite } from '@/entities/document/model/types'
import {
  createWorkspaceFavoriteFromDocument,
  type WorkspaceFavoriteInput,
} from './workspace-favorite'
import {
  supabaseWorkspaceFavoriteRepository,
  type WorkspaceFavoriteRepository,
} from './supabase-workspace-favorite-repository'

export interface UseWorkspaceFavoritesParams {
  enabled: boolean
  userId: string | null
  initialFavorites?: WorkspaceFavorite[]
  repository?: WorkspaceFavoriteRepository
}

export interface UseWorkspaceFavoritesResult {
  favorites: WorkspaceFavorite[]
  isHydratingFavorites: boolean
  saveFavorite: (favorite: WorkspaceFavoriteInput) => Promise<WorkspaceFavorite | null>
  renameFavorite: (favoriteId: string, nextTitle: string) => Promise<WorkspaceFavorite | null>
  deleteFavorite: (favoriteId: string) => Promise<boolean>
  createFavoriteFromDocument: (document: DocumentRecord) => Promise<WorkspaceFavorite | null>
}

// Merge the remote favorites into the current state while preserving any optimistic local saves that landed before the initial hydrate completed.
function mergeWorkspaceFavorites(
  remoteFavorites: WorkspaceFavorite[],
  currentFavorites: WorkspaceFavorite[]
) {
  const currentById = new Map(currentFavorites.map((favorite) => [favorite.id, favorite]))
  const remoteIds = new Set(remoteFavorites.map((favorite) => favorite.id))
  const mergedFavorites = remoteFavorites.map((favorite) => currentById.get(favorite.id) ?? favorite)

  currentFavorites.forEach((favorite) => {
    if (!remoteIds.has(favorite.id)) {
      mergedFavorites.push(favorite)
    }
  })

  return mergedFavorites
}

export function useWorkspaceFavorites({
  enabled,
  userId,
  initialFavorites = [],
  repository = supabaseWorkspaceFavoriteRepository,
}: UseWorkspaceFavoritesParams): UseWorkspaceFavoritesResult {
  const initialFavoritesRef = useRef(initialFavorites)
  const hasLoadedRemoteRef = useRef(false)
  const [favorites, setFavorites] = useState<WorkspaceFavorite[]>(initialFavorites)
  const [isHydratingFavorites, setIsHydratingFavorites] = useState(Boolean(enabled && userId))

  // Keep the latest fallback snapshot available so signing out can return to the local shell state without leaking the previous account's favorites.
  useEffect(() => {
    initialFavoritesRef.current = initialFavorites
  }, [initialFavorites])

  // Reset the favorites collection whenever the auth scope changes so the next hydrate starts from the correct user or guest fallback.
  useEffect(() => {
    hasLoadedRemoteRef.current = false
    setFavorites(initialFavoritesRef.current)
    setIsHydratingFavorites(Boolean(enabled && userId))
  }, [enabled, userId])

  // Hydrate favorites from Supabase as soon as the authenticated user is known so the sidebar can show cloud-backed snapshots instead of stale browser-only rows.
  useEffect(() => {
    if (!enabled || !userId || hasLoadedRemoteRef.current) {
      return
    }

    let isMounted = true

    const loadFavorites = async () => {
      setIsHydratingFavorites(true)

      try {
        const remoteFavorites = await repository.load(userId)

        if (!isMounted) {
          return
        }

        hasLoadedRemoteRef.current = true
        setFavorites((current) => mergeWorkspaceFavorites(remoteFavorites, current))
      } catch (error) {
        // Keep favorites quiet in the UI when the initial hydrate fails so the sidebar stays usable even if the network is flaky.
        console.error('[workspace-favorites] remote hydrate failed', error)
      } finally {
        if (isMounted) {
          hasLoadedRemoteRef.current = true
          setIsHydratingFavorites(false)
        }
      }
    }

    void loadFavorites()

    return () => {
      isMounted = false
    }
  }, [enabled, repository, userId])

  // Save one favorite snapshot into Supabase and mirror the returned row back into local state so the sidebar updates immediately after the write succeeds.
  const saveFavorite = useCallback(
    async (favorite: WorkspaceFavoriteInput) => {
      if (!enabled || !userId) {
        return null
      }

      const savedFavorite = await repository.save(userId, favorite)

      setFavorites((current) => mergeWorkspaceFavorites([savedFavorite], current))

      return savedFavorite
    },
    [enabled, repository, userId]
  )

  // Rename a favorite snapshot in Supabase and mirror the new title back into local state so the sidebar row updates immediately after the write succeeds.
  const renameFavorite = useCallback(
    async (favoriteId: string, nextTitle: string) => {
      if (!enabled || !userId) {
        return null
      }

      const renamedFavorite = await repository.rename(userId, favoriteId, nextTitle)

      setFavorites((current) =>
        current.map((favorite) => (favorite.id === favoriteId ? renamedFavorite : favorite))
      )

      return renamedFavorite
    },
    [enabled, repository, userId]
  )

  // Remove one saved favorite from Supabase and mirror the deletion into local state so the sidebar tab stays in sync with the cloud collection.
  const deleteFavorite = useCallback(
    async (favoriteId: string) => {
      if (!enabled || !userId) {
        return false
      }

      await repository.delete(userId, favoriteId)
      setFavorites((current) => current.filter((favorite) => favorite.id !== favoriteId))

      return true
    },
    [enabled, repository, userId]
  )

  // Convert a live document payload into a favorite snapshot so the document menu can save reusable seeds without knowing repository details.
  const createFavoriteFromDocument = useCallback(
    async (document: DocumentRecord) => {
      return saveFavorite(createWorkspaceFavoriteFromDocument(document))
    },
    [saveFavorite]
  )

  return {
    favorites,
    isHydratingFavorites,
    saveFavorite,
    renameFavorite,
    deleteFavorite,
    createFavoriteFromDocument,
  }
}
