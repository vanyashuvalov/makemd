import type { DocumentRecord } from '@/entities/document/model/types'
import { createWorkspaceDocumentId } from '@/entities/document/model/document-id'
import { sortDocumentsByUpdatedAt } from '@/entities/document/model/document-updated'
import { createWorkspaceDocumentContentSignature as signature } from './workspace-cloud-document'

// Keep both versions when cloud content and an unsent local draft have diverged.
export function mergeWorkspaceDocuments(local: DocumentRecord[], remote: DocumentRecord[], deletedIds: string[] = []) {
  const deleted = new Set(deletedIds)
  const byId = new Map<string, DocumentRecord>(remote.filter((document) => !deleted.has(document.id)).map((document) => [document.id, {
    ...document, cloudSyncedSignature: signature(document),
  }]))
  let activeId = local.find((document) => document.active)?.id
  for (const document of local) {
    if (deleted.has(document.id)) continue
    const saved = byId.get(document.id)
    const localSignature = signature(document)
    if (!saved) {
      // An unchanged cached document missing from the server was deleted on another device.
      if (!document.cloudSyncedSignature || localSignature !== document.cloudSyncedSignature) byId.set(document.id, document)
    } else if (localSignature === signature(saved)) {
      byId.set(document.id, { ...document, cloudSyncedSignature: localSignature })
    } else if (localSignature !== document.cloudSyncedSignature) {
      if (signature(saved) === document.cloudSyncedSignature) {
        byId.set(document.id, document)
      } else {
        const copy = { ...document, id: createWorkspaceDocumentId(), title: `${document.title} (local copy)`, cloudSyncedSignature: undefined }
        byId.set(copy.id, copy)
        if (document.active) activeId = copy.id
      }
    }
  }
  const merged = sortDocumentsByUpdatedAt([...byId.values()])
  if (!merged.some((document) => document.id === activeId)) activeId = merged[0]?.id
  return merged.map((document) => ({ ...document, active: document.id === activeId, selected: false }))
}
