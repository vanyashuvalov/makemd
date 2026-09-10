export type PdfOptions = {
  paper: 'A4' | 'Letter'
  textSize: 'small' | 'normal' | 'large'
  margins: 'normal' | 'compact'
}

export const defaultPdfOptions: PdfOptions = { paper: 'A4', textSize: 'normal', margins: 'normal' }

// Only allow known values: these options enter a server-rendered stylesheet.
export function normalizePdfOptions(value: unknown): PdfOptions {
  const input = value && typeof value === 'object' ? value as Partial<PdfOptions> : {}
  return {
    paper: input.paper === 'Letter' ? 'Letter' : 'A4',
    textSize: input.textSize === 'small' || input.textSize === 'large' ? input.textSize : 'normal',
    margins: input.margins === 'compact' ? 'compact' : 'normal',
  }
}
