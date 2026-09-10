import test from 'node:test'
import assert from 'node:assert/strict'
import { createSupabaseWorkspaceDocumentRepository } from '../src/features/workspace-cloud-sync/model/supabase-workspace-document-repository.ts'
const id = '02ea41f0-0551-4c98-a8ef-24d87a6cdc60'

test('cloud list errors and missing bodies are not empty documents', async () => {
  const error = Error('unavailable')
  const client = {
    from: () => ({ select: () => ({ eq: () => ({ order: async () => ({ error }) }) }) }),
  }
  await assert.rejects(createSupabaseWorkspaceDocumentRepository(() => client).load('user'), /unavailable/)
  client.from = () => ({ select: () => ({ eq: () => ({ order: async () => ({ data: [{ id, title: 'Draft', storage_path: 'file.md' }] }) }) }) })
  client.storage = { from: () => ({ download: async () => ({ error }) }) }
  await assert.rejects(createSupabaseWorkspaceDocumentRepository(() => client).load('user'), /unavailable/)
})

test('failed upload batches wait for all writes and do not publish metadata', async () => {
  let finishSlow; let settled = false; let metadataWrites = 0; let calls = 0
  const slow = new Promise((resolve) => { finishSlow = resolve })
  const client = {
    storage: { from: () => ({ upload: async () => ++calls === 1 ? { error: Error('upload failed') } : slow }) },
    from: () => ({ upsert: async () => { metadataWrites++; return {} } }),
  }
  const repository = createSupabaseWorkspaceDocumentRepository(() => client)
  const result = repository.save('user', [{ id, title: 'A' }, { id: '17b13d26-009b-45c8-b8d8-dd8e80a892a8', title: 'B' }]).catch((error) => { settled = true; return error })
  await new Promise((resolve) => setTimeout(resolve, 20))
  assert.equal(settled, false)
  finishSlow({})
  assert.match((await result).message, /upload failed/)
  assert.equal(metadataWrites, 0)
})
