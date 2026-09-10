import {
  hasCustomDocumentStyle,
  normalizePdfOptions,
  type PdfOptions,
} from '@/widgets/editor-preview/model/pdf-options'

// A versioned Markdown comment keeps styles portable without changing the DB schema.
const STYLE_PREFIX = '<!-- makemd:style:v1 '
export function encodeDocumentFile(markdown: string, options?: PdfOptions) {
  return hasCustomDocumentStyle(options)
    ? `${STYLE_PREFIX}${JSON.stringify(normalizePdfOptions(options))} -->\n\n${markdown}`
    : markdown
}

export function decodeDocumentFile(source: string): {
  markdown: string
  options: PdfOptions
} {
  const text = source.replace(/^\uFEFF/, '')
  if (text.startsWith(STYLE_PREFIX)) {
    const end = text.indexOf(' -->\n\n', STYLE_PREFIX.length)
    if (end > 0 && end < 1024) {
      try {
        const options = JSON.parse(text.slice(STYLE_PREFIX.length, end))
        if (options && typeof options === 'object' && !Array.isArray(options)) {
          return {
            markdown: text.slice(end + 6),
            options: normalizePdfOptions(options),
          }
        }
      } catch {
        /* Preserve malformed or unrelated Markdown verbatim. */
      }
    }
  }
  return { markdown: text, options: normalizePdfOptions(null) }
}
