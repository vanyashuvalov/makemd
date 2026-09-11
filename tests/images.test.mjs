import test from 'node:test'
import assert from 'node:assert/strict'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { MarkdownDocumentContent } from '../src/widgets/editor-preview/ui/markdown-document-content.tsx'
import { isImageFile } from '../src/features/document-images/model/document-images.ts'

test('embedded raster images render while executable data URLs remain blocked', () => {
  const data = 'data:image/png;base64,iVBORw0KGgo='
  const html = renderToStaticMarkup(createElement(MarkdownDocumentContent, { markdown: `![Photo](${data})\n\n[bad](javascript:alert)\n\n![bad](data:text/html;base64,YQ==)` }))
  assert.ok(html.includes(`src="${data}"`))
  assert.ok(!html.includes('href="javascript:'))
  assert.ok(!html.includes('src="data:text/html'))
  assert.ok(!html.includes('crossOrigin'))
})

test('image files are recognized without accepting arbitrary dropped files', () => {
  assert.equal(isImageFile(new File([''], 'photo.PNG')), true)
  assert.equal(isImageFile(new File([''], 'clipboard', { type: 'image/webp' })), true)
  assert.equal(isImageFile(new File([''], 'script.svg', { type: 'image/svg+xml' })), false)
  assert.equal(isImageFile(new File([''], 'document.pdf', { type: 'application/pdf' })), false)
})
