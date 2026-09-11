export type PdfOptions = {
  paper: 'A4' | 'Letter'
  textSize: 'small' | 'normal' | 'large'
  margins: 'normal' | 'compact'
  font: 'sans' | 'serif' | 'mono'
  accent: 'ink' | 'blue' | 'green' | 'plum'
  surface: 'white' | 'warm'
  spacing: 'relaxed' | 'compact'
  textColor?: string
  backgroundColor?: string
  marginHorizontal?: number
  marginVertical?: number
}

export const defaultPdfOptions: PdfOptions = {
  paper: 'A4',
  textSize: 'normal',
  margins: 'normal',
  font: 'sans',
  accent: 'ink',
  surface: 'warm',
  spacing: 'relaxed',
}

export const documentPresets = {
  Clean: { font: 'sans', accent: 'ink', surface: 'warm', spacing: 'relaxed' },
  Editorial: {
    font: 'serif',
    accent: 'plum',
    surface: 'warm',
    spacing: 'relaxed',
  },
  Mono: { font: 'mono', accent: 'green', surface: 'white', spacing: 'compact' },
} as const

// Only known values can enter document styles or the PDF stylesheet.
export function normalizePdfOptions(value: unknown): PdfOptions {
  const input =
    value && typeof value === 'object' ? (value as Partial<PdfOptions>) : {}
  return {
    paper: input.paper === 'Letter' ? 'Letter' : 'A4',
    textSize:
      input.textSize === 'small' || input.textSize === 'large'
        ? input.textSize
        : 'normal',
    margins: input.margins === 'compact' ? 'compact' : 'normal',
    font: input.font === 'serif' || input.font === 'mono' ? input.font : 'sans',
    accent:
      input.accent === 'blue' ||
      input.accent === 'green' ||
      input.accent === 'plum'
        ? input.accent
        : 'ink',
    surface: input.surface === 'white' ? 'white' : 'warm',
    spacing: input.spacing === 'compact' ? 'compact' : 'relaxed',
    ...normalizeColor('textColor', input.textColor),
    ...normalizeColor('backgroundColor', input.backgroundColor),
    ...normalizeMargin('marginHorizontal', input.marginHorizontal),
    ...normalizeMargin('marginVertical', input.marginVertical),
  }
}

export function hasCustomDocumentStyle(value: unknown) {
  return (
    JSON.stringify(normalizePdfOptions(value)) !==
    JSON.stringify(defaultPdfOptions)
  )
}

// Optional fields preserve the serialized shape of previously saved styles.
function normalizeColor(key: 'textColor' | 'backgroundColor', value: unknown) {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)
    ? { [key]: value.toLowerCase() }
    : {}
}

function normalizeMargin(key: 'marginHorizontal' | 'marginVertical', value: unknown) {
  return typeof value === 'number' && Number.isFinite(value)
    ? { [key]: Math.min(40, Math.max(0, Math.round(value))) }
    : {}
}

export function getDocumentMargins(options: PdfOptions) {
  return {
    horizontal: options.marginHorizontal ?? (options.margins === 'compact' ? 12 : 16),
    top: options.marginVertical ?? (options.margins === 'compact' ? 12 : 18),
    bottom: options.marginVertical ?? (options.margins === 'compact' ? 12 : 20),
  }
}
