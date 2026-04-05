/**
 * File: src/features/workspace-cloud-sync/model/supabase-workspace-document-repository.ts
 * Purpose: Supabase-backed document repository for workspace cloud sync.
 * Why it exists: authenticated users need a real remote store for document metadata and markdown bodies, while the local IndexedDB cache keeps the offline-first draft experience intact.
 * What it does: loads document rows from Postgres plus markdown blobs from Storage, writes document changes back to both stores, and deletes removed documents from both surfaces.
 * Connected to: the workspace cloud sync hook, Supabase Auth session state, the `documents` table, and the private `markdown-files` bucket.
 */

import type { DocumentRecord } from '@/entities/document/model/types'
import {
  createDocumentUpdatedAt,
  formatDocumentUpdatedLabel,
  sortDocumentsByUpdatedAt,
} from '@/entities/document/model/document-updated'
import { getSupabaseBrowserClient } from '@/shared/lib/supabase/browser-client'
import {
  createWorkspaceDocumentsSignature,
  getWorkspaceCloudDocumentId,
  getWorkspaceCloudDocumentStoragePath,
} from './workspace-cloud-document'

type SupabaseDocumentsRow = {
  id: string
  title: string
  storage_path: string
  updated_at: string | null
}

export interface WorkspaceCloudDocumentRepository {
  load: (userId: string) => Promise<DocumentRecord[]>
  save: (userId: string, documents: DocumentRecord[]) => Promise<void>
  delete: (userId: string, documentIds: string[]) => Promise<void>
}

// Convert a text payload into a storage-friendly blob so markdown bodies move through Supabase Storage as plain files instead of raw JSON strings.
function createMarkdownBlob(markdown: string) {
  return new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
}

// Load one markdown file from storage and fall back to an empty document body if the object is missing so a partially-synced cloud state still renders.
async function loadMarkdownFromStorage(storagePath: string) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.storage.from('markdown-files').download(storagePath)

  if (error || !data) {
    return ''
  }

  return await data.text()
}

// Build the browser-side repository around the shared Supabase client so the cloud sync hook can stay focused on orchestration instead of transport details.
export function createSupabaseWorkspaceDocumentRepository(): WorkspaceCloudDocumentRepository {
  return {
    async load(userId) {
      const supabase = getSupabaseBrowserClient()
      const { data: rows, error } = await supabase
        .from('documents')
        .select('id, title, storage_path, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (error || !rows?.length) {
        return []
      }

      const cloudRows = rows as SupabaseDocumentsRow[]
      const loadedDocuments = await Promise.all(
        cloudRows.map(async (row, index) => ({
          id: row.id,
          title: row.title,
          updatedAt: row.updated_at ?? createDocumentUpdatedAt(),
          updatedLabel: formatDocumentUpdatedLabel(row.updated_at),
          markdown: await loadMarkdownFromStorage(row.storage_path),
          active: index === 0,
          withMenu: true,
        }))
      )

      return sortDocumentsByUpdatedAt(loadedDocuments)
    },
    async save(userId, documents) {
      if (documents.length === 0) {
        return
      }

      const supabase = getSupabaseBrowserClient()
      const upsertRows = await Promise.all(
        documents.map(async (document) => {
          const cloudDocumentId = await getWorkspaceCloudDocumentId(document.id)

          return {
            id: cloudDocumentId,
            user_id: userId,
            title: document.title,
            storage_path: getWorkspaceCloudDocumentStoragePath(userId, cloudDocumentId),
          }
        })
      )

      const { error: upsertError } = await supabase.from('documents').upsert(upsertRows, {
        onConflict: 'id',
      })

      if (upsertError) {
        throw upsertError
      }

      await Promise.all(
        documents.map(async (document) => {
          const cloudDocumentId = await getWorkspaceCloudDocumentId(document.id)
          const storagePath = getWorkspaceCloudDocumentStoragePath(userId, cloudDocumentId)
          const { error: uploadError } = await supabase.storage.from('markdown-files').upload(
            storagePath,
            createMarkdownBlob(document.markdown ?? ''),
            {
              upsert: true,
              contentType: 'text/markdown',
            }
          )

          if (uploadError) {
            throw uploadError
          }
        })
      )
    },
    async delete(userId, documentIds) {
      if (documentIds.length === 0) {
        return
      }

      const supabase = getSupabaseBrowserClient()
      const cloudDocumentIds = await Promise.all(
        documentIds.map(async (documentId) => getWorkspaceCloudDocumentId(documentId))
      )
      const storagePaths = cloudDocumentIds.map((documentId) =>
        getWorkspaceCloudDocumentStoragePath(userId, documentId)
      )

      const { error: removeError } = await supabase.storage.from('markdown-files').remove(storagePaths)

      if (removeError) {
        throw removeError
      }

      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .eq('user_id', userId)
        .in('id', cloudDocumentIds)

      if (deleteError) {
        throw deleteError
      }
    },
  }
}

export const supabaseWorkspaceDocumentRepository = createSupabaseWorkspaceDocumentRepository()

// Export the current signature helper so the sync hook can compare the live workspace against the last payload it pushed to Supabase.
export { createWorkspaceDocumentsSignature }
