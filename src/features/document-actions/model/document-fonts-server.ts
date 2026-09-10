import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { documentFontCss } from '@/widgets/editor-preview/model/document-fonts'

let embeddedFonts: Promise<string> | undefined

// Embed the same bundled fonts in PDF HTML, without external font requests or auth cookies.
export function getEmbeddedDocumentFonts() {
  if (!embeddedFonts) {
    embeddedFonts = (async () => {
      let css = documentFontCss
      const paths = [
        ...new Set(css.match(/\/document-fonts\/[a-f0-9]+\.woff2/g) ?? []),
      ]
      const fonts = await Promise.all(
        paths.map(async (path) => ({
          path,
          data: await readFile(join(process.cwd(), 'public', path)),
        }))
      )
      for (const { path, data } of fonts)
        css = css.replaceAll(
          path,
          `data:font/woff2;base64,${data.toString('base64')}`
        )
      return css
    })().catch((error) => {
      embeddedFonts = undefined
      throw error
    })
  }
  return embeddedFonts
}
