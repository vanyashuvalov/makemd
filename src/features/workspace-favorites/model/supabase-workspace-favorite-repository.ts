/**
 * File: src/features/workspace-favorites/model/supabase-workspace-favorite-repository.ts
 * Purpose: Supabase-backed favorite repository for authenticated workspace users.
 * Why it exists: favorites need durable cloud storage that is separate from documents, so the sidebar can reuse them across sessions without tying them to one source row.
 * What it does: loads favorites from Postgres, upserts favorite snapshots by content hash, and keeps the transport details out of the shell.
 * Connected to: the workspace favorites hook, Supabase Auth session state, and the `document_favorites` table added by the database migration.
 */

import type { WorkspaceFavorite } from '@/entities/document/model/types'
import { getSupabaseBrowserClient } from '@/shared/lib/supabase/browser-client'
import {
  createWorkspaceFavoriteContentHash,
  type WorkspaceFavoriteInput,
} from './workspace-favorite'

type SupabaseFavoriteRow = {
  id: string
  title: string
  description: string
  markdown: string
}

export interface WorkspaceFavoriteRepository {
  load: (userId: string) => Promise<WorkspaceFavorite[]>
  save: (userId: string, favorite: WorkspaceFavoriteInput) => Promise<WorkspaceFavorite>
}

// Build the browser-side favorite repository around the shared Supabase client so the hook can stay focused on state orchestration.
export function createSupabaseWorkspaceFavoriteRepository(): WorkspaceFavoriteRepository {
  return {
    async load(userId) {
      const supabase = getSupabaseBrowserClient()
      const { data: rows, error } = await supabase
        .from('document_favorites')
        .select('id, title, description, markdown')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (error || !rows?.length) {
        return []
      }

      return (rows as SupabaseFavoriteRow[]).map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        markdown: row.markdown,
      }))
    },
    async save(userId, favorite) {
      const supabase = getSupabaseBrowserClient()
      const contentHash = await createWorkspaceFavoriteContentHash(favorite)

      const { data, error } = await supabase
        .from('document_favorites')
        .upsert(
          {
            user_id: userId,
            title: favorite.title,
            description: favorite.description,
            markdown: favorite.markdown,
            content_hash: contentHash,
          },
          {
            onConflict: 'user_id,content_hash',
          }
        )
        .select('id, title, description, markdown')
        .single()

      if (error || !data) {
        throw error ?? new Error('Failed to save favorite snapshot.')
      }

      const row = data as SupabaseFavoriteRow

      return {
        id: row.id,
        title: row.title,
        description: row.description,
        markdown: row.markdown,
      }
    },
  }
}

export const supabaseWorkspaceFavoriteRepository = createSupabaseWorkspaceFavoriteRepository()
