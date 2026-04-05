/**
 * File: src/features/workspace-persistence/model/indexeddb-workspace-draft-repository.ts
 * Purpose: Browser-only IndexedDB implementation for the workspace draft repository contract.
 * Why it exists: the persistence hook needs a quiet, durable local store now, while future cloud sync can reuse the same repository shape with a different backing implementation.
 * What it does: opens a single IndexedDB database, stores one draft per workspace key, and fails softly so persistence never blocks editing.
 * Connected to: `workspace-draft.ts`, the workspace persistence hook, and the client shell that restores and saves local drafts.
 */

import type { WorkspaceDraftRecord } from './workspace-draft'

export interface WorkspaceDraftRepository {
  load: (storageKey: string) => Promise<WorkspaceDraftRecord | null>
  save: (storageKey: string, draft: WorkspaceDraftRecord) => Promise<void>
  delete: (storageKey: string) => Promise<void>
}

const DATABASE_NAME = 'makemd-workspace-drafts'
const DATABASE_VERSION = 1
const STORE_NAME = 'drafts'

let databasePromise: Promise<IDBDatabase> | null = null

// Open the workspace draft database once per browser session so repeated saves reuse the same IndexedDB connection instead of paying the setup cost on every keystroke.
function openWorkspaceDraftDatabase() {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB is not available in this environment'))
  }

  if (!databasePromise) {
    databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)

      request.onupgradeneeded = () => {
        const database = request.result

        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME)
        }
      }

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new Error('Failed to open the workspace draft database'))
      request.onblocked = () => reject(new Error('Workspace draft database upgrade was blocked'))
    }).catch((error) => {
      databasePromise = null
      throw error
    })
  }

  return databasePromise
}

// Wait for a transaction to finish so save/delete calls only resolve after IndexedDB has actually committed the write.
function waitForTransaction(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('Workspace draft transaction failed'))
    transaction.onabort = () => reject(transaction.error ?? new Error('Workspace draft transaction aborted'))
  })
}

// Build the local repository implementation with soft-failure behavior so persistence never interrupts editing even if the browser storage stack is unavailable.
export function createIndexedDbWorkspaceDraftRepository(): WorkspaceDraftRepository {
  return {
    async load(storageKey) {
      try {
        const database = await openWorkspaceDraftDatabase()

        return await new Promise<WorkspaceDraftRecord | null>((resolve, reject) => {
          const transaction = database.transaction(STORE_NAME, 'readonly')
          const store = transaction.objectStore(STORE_NAME)
          const request = store.get(storageKey)

          request.onsuccess = () => resolve((request.result as WorkspaceDraftRecord | undefined) ?? null)
          request.onerror = () => reject(request.error ?? new Error('Failed to load the workspace draft'))
          transaction.onerror = () => reject(transaction.error ?? new Error('Workspace draft read transaction failed'))
          transaction.onabort = () => reject(transaction.error ?? new Error('Workspace draft read transaction aborted'))
        })
      } catch {
        return null
      }
    },
    async save(storageKey, draft) {
      try {
        const database = await openWorkspaceDraftDatabase()
        const transaction = database.transaction(STORE_NAME, 'readwrite')
        const store = transaction.objectStore(STORE_NAME)

        store.put(draft, storageKey)
        await waitForTransaction(transaction)
      } catch {
        // Ignore storage failures so the editor still works if IndexedDB is blocked or temporarily unavailable.
      }
    },
    async delete(storageKey) {
      try {
        const database = await openWorkspaceDraftDatabase()
        const transaction = database.transaction(STORE_NAME, 'readwrite')
        const store = transaction.objectStore(STORE_NAME)

        store.delete(storageKey)
        await waitForTransaction(transaction)
      } catch {
        // Ignore deletion failures for the same reason as saves: draft persistence should stay invisible and non-blocking.
      }
    },
  }
}

export const indexedDbWorkspaceDraftRepository = createIndexedDbWorkspaceDraftRepository()
