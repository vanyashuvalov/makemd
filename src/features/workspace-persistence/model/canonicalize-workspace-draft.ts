import { getWorkspaceCloudDocumentId } from '@/features/workspace-cloud-sync/model/workspace-cloud-document'
import type { WorkspaceDraftRecord } from './workspace-draft'

// Older clients used doc-prefixed IDs locally but hashed UUIDs in cloud storage.
// Migrate both documents and tombstones together before cloud hydration starts.
export async function canonicalizeWorkspaceDraft(draft: WorkspaceDraftRecord | null) {
  if (!draft) return null
  const documents = await Promise.all(draft.documents.map(async (document) => {
    const id = await getWorkspaceCloudDocumentId(document.id)
    let cloudSyncedSignature = document.cloudSyncedSignature
    if (id !== document.id && cloudSyncedSignature) {
      try {
        const fields = JSON.parse(cloudSyncedSignature)
        if (Array.isArray(fields) && fields[0] === document.id) {
          fields[0] = id
          cloudSyncedSignature = JSON.stringify(fields)
        }
      } catch { /* Unknown legacy signatures remain dirty, preserving their content. */ }
    }
    return { ...document, id, cloudSyncedSignature }
  }))
  const deletedDocumentIds = await Promise.all((draft.deletedDocumentIds ?? []).map(getWorkspaceCloudDocumentId))
  return { ...draft, documents, deletedDocumentIds }
}
