import { MarkdownDocumentContent } from './markdown-document-content'
import type { PdfOptions } from '../model/pdf-options'
import type { PdfPreviewTheme } from '../model/pdf-theme'

export function MarkdownRenderer({ markdown, options, theme }: {
  markdown: string
  options?: PdfOptions
  theme?: PdfPreviewTheme
  mobile?: boolean
  exportMode?: boolean
}) {
  return <MarkdownDocumentContent markdown={markdown} options={options} theme={theme} />
}
