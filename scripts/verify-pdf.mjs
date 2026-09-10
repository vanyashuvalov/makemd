import { mkdir, writeFile } from 'node:fs/promises'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { PdfMarkdownDocument } from '../src/widgets/editor-preview/ui/pdf-markdown-document.tsx'
import { getEmbeddedDocumentFonts } from '../src/features/document-actions/model/document-fonts-server.ts'
import { runPdfTask } from '../src/features/document-actions/model/pdf-browser.ts'

await mkdir('qa-output', { recursive: true })
const intro = Array.from({ length: 8 }, (_, i) => `Paragraph ${i + 1}. Проверка переноса текста. This paragraph verifies printable text and page breaks. `.repeat(3)).join('\n\n')
const rows = Array.from({ length: 90 }, (_, i) => `| ROW-${String(i + 1).padStart(3, '0')} | Table content ${i + 1} |`).join('\n')
const code = Array.from({ length: 100 }, (_, i) => `const codeLine${i + 1} = "long code block stays readable";`).join('\n')
const fontCss = await getEmbeddedDocumentFonts()
const markdown = `# PDF regression\n\n${intro}\n\n## TABLE-HEADING\n\n| Row | Content |\n| --- | --- |\n${rows}\n\n## Code\n\n\`\`\`js\n${code}\n\`\`\`\n\nEND-OF-DOCUMENT`
await runPdfTask(async ({ browser, page }) => {
  try {
    for (const paper of ['A4', 'Letter']) {
      const html = renderToStaticMarkup(React.createElement(PdfMarkdownDocument, { title: 'PDF verification', markdown, fontCss, options: { paper, textSize: 'normal', margins: 'normal' } }))
      await page.setContent(`<!doctype html>${html}`, { waitUntil: 'load' })
      await page.evaluate(() => document.fonts.ready)
      await writeFile(`qa-output/long-${paper}.pdf`, await page.pdf({ printBackground: true, preferCSSPageSize: true }))
      console.log(`Rendered long-${paper}.pdf`)
    }
  } finally { await browser.close() }
})
