import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizePdfOptions } from '../src/widgets/editor-preview/model/pdf-options.ts'
test('PDF settings accept only bounded presets', () => {
  assert.deepEqual(normalizePdfOptions({ paper: 'Letter', margins: 'compact', textSize: 'large' }), { paper: 'Letter', margins: 'compact', textSize: 'large' })
  assert.deepEqual(normalizePdfOptions({ paper: 'A4; color: red', textSize: 999, margins: null }), { paper: 'A4', textSize: 'normal', margins: 'normal' })
})
