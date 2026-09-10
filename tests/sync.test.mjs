import test, { afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { useState } from 'react'
import { useWorkspaceCloudSync } from '../src/features/workspace-cloud-sync/model/use-workspace-cloud-sync.ts'
import { mergeWorkspaceDocuments } from '../src/features/workspace-cloud-sync/model/merge-workspace-documents.ts'
import { createWorkspaceDocumentContentSignature as signature } from '../src/features/workspace-cloud-sync/model/workspace-cloud-document.ts'
import { useWorkspaceDraftPersistence } from '../src/features/workspace-persistence/model/use-workspace-draft-persistence.ts'
import { normalizeWorkspaceDraftRecord, createWorkspaceDraftRecord } from '../src/features/workspace-persistence/model/workspace-draft.ts'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost' })
Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true })
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true })
const { renderHook, act, waitFor, cleanup } = await import('@testing-library/react')
afterEach(cleanup)
const id = '02ea41f0-0551-4c98-a8ef-24d87a6cdc60'
const doc = (markdown = 'original') => ({ id, title: 'Draft', markdown, active: true, updatedLabel: 'Just now', updatedAt: '2026-09-10T10:00:00Z' })
const deferred = () => { let resolve; let reject; const promise = new Promise((a, b) => { resolve = a; reject = b }); return { promise, resolve, reject } }
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const repo = (overrides = {}) => ({ load: async () => [doc()], save: async () => [], delete: async () => {}, ...overrides })
function harness(repository, initial = [doc()]) {
  return renderHook(() => {
    const [documents, setDocuments] = useState(initial)
    const [markdown, setEditorMarkdown] = useState('')
    const [deletedDocumentIds, setDeletedDocumentIds] = useState([])
    const sync = useWorkspaceCloudSync({ enabled: true, userId: 'user-a', documents, deletedDocumentIds, setDeletedDocumentIds, setDocuments, setEditorMarkdown, repository })
    return { documents, markdown, setDocuments, ...sync }
  })
}

test('failed cloud hydration never saves or infers deletions; explicit retry recovers', async () => {
  let loads = 0, saves = 0, deletes = 0
  const hook = harness(repo({ load: async () => { if (++loads === 1) throw Error('offline'); return [] }, save: async () => { saves++; return [] }, delete: async () => { deletes++ } }))
  await waitFor(() => assert.equal(hook.result.current.status, 'error'))
  await act(async () => { await delay(850) })
  assert.equal(saves, 0); assert.equal(deletes, 0)
  act(() => hook.result.current.retry())
  await waitFor(() => assert.equal(saves, 1), { timeout: 2500 })
})

test('edits during a slow cloud load survive as a local copy', async () => {
  const load = deferred()
  const hook = harness(repo({ load: () => load.promise }))
  act(() => hook.result.current.setDocuments([doc('typed while loading')]))
  await act(async () => load.resolve([doc()]))
  assert.deepEqual(new Set(hook.result.current.documents.map((item) => item.markdown)), new Set(['original', 'typed while loading']))
  assert.equal(hook.result.current.markdown, 'typed while loading')
})

test('cloud writes are serialized and acknowledge only the snapshot sent', async () => {
  const first = deferred(); const sent = []; let active = 0, maximum = 0
  const hook = harness(repo({ save: async (_user, documents) => { active++; maximum = Math.max(maximum, active); sent.push(documents[0].markdown); if (sent.length === 1) await first.promise; active--; return [] } }))
  await waitFor(() => assert.equal(hook.result.current.status, 'saved'))
  act(() => hook.result.current.setDocuments((documents) => [{ ...documents[0], markdown: 'edit one' }]))
  await waitFor(() => assert.equal(sent.length, 1), { timeout: 2000 })
  act(() => hook.result.current.setDocuments((documents) => [{ ...documents[0], markdown: 'edit two' }]))
  await act(async () => { await delay(850) })
  assert.equal(sent.length, 1)
  await act(async () => first.resolve())
  await waitFor(() => assert.equal(sent.length, 2), { timeout: 2000 })
  assert.equal(maximum, 1); assert.deepEqual(sent, ['edit one', 'edit two'])
})

test('failed save is visible, preserves edits and retries without a busy loop', async () => {
  let attempts = 0
  const hook = harness(repo({ save: async () => { if (++attempts === 1) throw Error('offline'); return [] } }))
  await waitFor(() => assert.equal(hook.result.current.status, 'saved'))
  act(() => hook.result.current.setDocuments((documents) => [{ ...documents[0], markdown: 'keep me' }]))
  await waitFor(() => assert.equal(hook.result.current.status, 'error'), { timeout: 2000 })
  await act(async () => { await delay(850) })
  assert.equal(attempts, 1); assert.equal(hook.result.current.documents[0].markdown, 'keep me')
  act(() => hook.result.current.retry())
  await waitFor(() => assert.equal(hook.result.current.status, 'saved'), { timeout: 2000 })
  assert.equal(attempts, 2)
})

test('merge retains conflicts, applies cloud updates and respects deletions', () => {
  const base = doc(); const cached = { ...base, cloudSyncedSignature: signature(base) }
  assert.equal(mergeWorkspaceDocuments([cached], [doc('remote')])[0].markdown, 'remote')
  assert.equal(mergeWorkspaceDocuments([{ ...cached, markdown: 'local' }], [base])[0].markdown, 'local')
  assert.equal(mergeWorkspaceDocuments([{ ...cached, markdown: 'local' }], [doc('remote')]).length, 2)
  assert.equal(mergeWorkspaceDocuments([cached], []).length, 0)
  assert.equal(mergeWorkspaceDocuments([], [base], [id]).length, 0)
})

test('content signatures cannot collide through title/markdown delimiters', () => {
  assert.notEqual(signature({ ...doc('b::c'), title: 'a' }), signature({ ...doc('c'), title: 'a::b' }))
})

test('local cache restores signed-in drafts and retains separate account scopes', async () => {
  const saves = new Map(); const removed = []
  const repository = { load: async (key) => saves.get(key) ?? null, save: async (key, draft) => { saves.set(key, draft) }, delete: async (key) => { removed.push(key) } }
  const hook = renderHook(({ email }) => {
    const [documents, setDocuments] = useState([doc()]); const [markdown, setEditorMarkdown] = useState(''); const [section, setSidebarSection] = useState('history'); const [deletedDocumentIds, setDeletedDocumentIds] = useState([])
    const state = useWorkspaceDraftPersistence({ enabled: true, scope: 'authorized', account: { email, name: email }, documents, editorMarkdown: markdown, sidebarSection: section, deletedDocumentIds, setDeletedDocumentIds, setDocuments, setEditorMarkdown, setSidebarSection, repository })
    return { ...state, documents, setDocuments }
  }, { initialProps: { email: 'a@example.com' } })
  await waitFor(() => assert.equal(hook.result.current.ready, true))
  act(() => hook.result.current.setDocuments([doc('account A offline')]))
  await waitFor(() => assert.ok([...saves.values()].some((draft) => draft.documents[0]?.markdown === 'account A offline')))
  hook.rerender({ email: 'b@example.com' })
  await waitFor(() => assert.equal(hook.result.current.documents.length, 0))
  hook.rerender({ email: 'a@example.com' })
  await waitFor(() => assert.equal(hook.result.current.documents[0]?.markdown, 'account A offline'))
  assert.equal(removed.length, 0)
})

test('draft serialization preserves cloud acknowledgement and offline deletions', () => {
  const document = { ...doc(), cloudSyncedSignature: signature(doc()) }
  const restored = normalizeWorkspaceDraftRecord(createWorkspaceDraftRecord({ scope: 'authorized', sidebarSection: 'history', documents: [document], editorMarkdown: document.markdown, deletedDocumentIds: ['deleted'] }))
  assert.equal(restored.documents[0].cloudSyncedSignature, document.cloudSyncedSignature)
  assert.deepEqual(restored.deletedDocumentIds, ['deleted'])
  assert.equal(normalizeWorkspaceDraftRecord({ version: 1, documents: null }), null)
})

test('a new server snapshot cannot reset live documents', async () => {
  const { useDocumentSelection } = await import('../src/features/document-selection/model/use-document-selection.ts')
  const hook = renderHook(({ initial }) => useDocumentSelection(initial), { initialProps: { initial: [doc('server seed')] } })
  act(() => hook.result.current.setDocuments([doc('local edit')]))
  hook.rerender({ initial: [doc('refreshed server seed')] })
  assert.equal(hook.result.current.documents[0].markdown, 'local edit')
})

test('legacy IDs, acknowledgements and pending deletions migrate to the same cloud IDs', async () => {
  const { canonicalizeWorkspaceDraft } = await import('../src/features/workspace-persistence/model/canonicalize-workspace-draft.ts')
  const { getWorkspaceCloudDocumentId } = await import('../src/features/workspace-cloud-sync/model/workspace-cloud-document.ts')
  const old = { ...doc(), id: 'doc-legacy', options: { font: 'serif' } }
  const migrated = await canonicalizeWorkspaceDraft({ documents: [{ ...old, cloudSyncedSignature: signature(old) }], deletedDocumentIds: ['doc-deleted'] })
  assert.equal(migrated.documents[0].id, await getWorkspaceCloudDocumentId(old.id))
  assert.equal(migrated.documents[0].cloudSyncedSignature, signature(migrated.documents[0]))
  assert.deepEqual(migrated.deletedDocumentIds, [await getWorkspaceCloudDocumentId('doc-deleted')])
})
