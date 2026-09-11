import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizePdfOptions, defaultPdfOptions, documentPresets } from '../src/widgets/editor-preview/model/pdf-options.ts'
import { encodeDocumentFile, decodeDocumentFile } from '../src/entities/document/lib/document-file.ts'
import { createWorkspaceDocumentContentSignature as signature } from '../src/features/workspace-cloud-sync/model/workspace-cloud-document.ts'
import { createWorkspaceDraftRecord, normalizeWorkspaceDraftRecord } from '../src/features/workspace-persistence/model/workspace-draft.ts'

test('PDF settings accept only bounded presets', () => {
  assert.deepEqual(normalizePdfOptions({ paper: 'Letter', margins: 'compact', textSize: 'large' }), { ...defaultPdfOptions, paper: 'Letter', margins: 'compact', textSize: 'large' })
  assert.deepEqual(normalizePdfOptions({ paper: 'A4; color: red', font: 'url(evil)', accent: '</style>', textSize: 999, margins: null }), defaultPdfOptions)
})

test('styled Markdown roundtrips exactly, including Cyrillic and the first character', () => {
  const markdown = '# Заголовок\n\nText with <!-- a comment --> and `code`.\n'
  const options = { ...defaultPdfOptions, ...documentPresets.Editorial, paper: 'Letter', textSize: 'large' }
  const encoded = encodeDocumentFile(markdown, options)
  assert.deepEqual(decodeDocumentFile(encoded), { markdown, options })
  assert.equal(encodeDocumentFile(markdown), markdown)
  assert.equal(decodeDocumentFile('\uFEFF'+encoded).markdown, markdown)
  const invalid = '<!-- makemd:style:v1 {broken} -->\n\n# Keep this'
  assert.equal(decodeDocumentFile(invalid).markdown, invalid)
})

test('styles are durable in drafts and participate in cloud sync without invalidating legacy defaults', () => {
  const document = { id: '02ea41f0-0551-4c98-a8ef-24d87a6cdc60', title: 'A', markdown: 'Body', updatedLabel: 'now', active: true }
  assert.equal(signature(document), JSON.stringify([document.id, 'A', 'Body']))
  assert.equal(signature({ ...document, options: defaultPdfOptions }), signature(document))
  const styled = { ...document, options: { ...defaultPdfOptions, ...documentPresets.Mono } }
  assert.notEqual(signature(styled), signature(document))
  const draft = normalizeWorkspaceDraftRecord(createWorkspaceDraftRecord({ scope: 'unauthorized', documents: [styled], editorMarkdown: 'Body', sidebarSection: 'history' }))
  assert.deepEqual(draft.documents[0].options, styled.options)
})

test('custom colors and continuous margins are safe and survive document export', () => {
  const options = normalizePdfOptions({ textColor: '#F0EEDD', backgroundColor: '#202020', marginHorizontal: 24, marginVertical: 0 })
  assert.equal(options.textColor, '#f0eedd')
  assert.equal(options.backgroundColor, '#202020')
  assert.equal(options.marginHorizontal, 24)
  assert.equal(options.marginVertical, 0)
  assert.deepEqual(decodeDocumentFile(encodeDocumentFile('# Текст', options)), { markdown: '# Текст', options })
  const rejected = normalizePdfOptions({ textColor: '</style>', backgroundColor: 'url(https://example.com)', marginHorizontal: Infinity, marginVertical: '16; color: red' })
  assert.deepEqual(rejected, defaultPdfOptions)
  const bounded = normalizePdfOptions({ marginHorizontal: -20, marginVertical: 500 })
  assert.equal(bounded.marginHorizontal, 0)
  assert.equal(bounded.marginVertical, 40)
})
