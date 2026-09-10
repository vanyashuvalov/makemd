/* eslint-disable @next/next/no-head-element -- standalone print HTML */
import { MarkdownDocumentContent } from './markdown-document-content'
import { normalizePdfOptions, type PdfOptions } from '../model/pdf-options'
import { getDocumentTheme, type PdfPreviewTheme } from '../model/pdf-theme'

export function PdfMarkdownDocument({
  title,
  markdown,
  options,
  fontCss = '',
  theme,
}: {
  title: string
  markdown: string
  options?: PdfOptions
  theme?: PdfPreviewTheme
  fontCss?: string
}) {
  const settings = normalizePdfOptions(options)
  const colors = theme ?? getDocumentTheme(settings)
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>{title}</title>
        <style>{fontCss}</style>
        <style>{`
        @page { size: ${settings.paper} portrait; margin: ${settings.margins === 'compact' ? '12mm' : '18mm 16mm 20mm'}; }
        html, body { margin: 0; padding: 0; background: ${colors.background}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        p { orphans: 3; widows: 3; }
        h1, h2, h3, h4, h5, h6 { break-after: avoid-page; }
      `}</style>
      </head>
      <body>
        <MarkdownDocumentContent
          markdown={markdown}
          options={settings}
          theme={colors}
        />
      </body>
    </html>
  )
}
