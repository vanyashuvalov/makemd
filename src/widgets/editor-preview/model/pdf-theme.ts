/**
 * File: src/widgets/editor-preview/model/pdf-theme.ts
 * Purpose: Theme presets for the export-only PDF surface.
 * Why it exists: PDF styling is expected to evolve independently from the live preview, so the export layer needs a reusable theme object instead of hardcoded colors inside the renderer.
 * What it does: defines the shape of PDF theme tokens and ships the default preset used by the workspace today.
 * Connected to: `pdf-preview-surface.tsx`, `markdown-renderer.tsx`, and the workspace export flow.
 */

export type PdfPreviewTheme = {
  accent?: string
  background: string
  foreground: string
  mutedForeground: string
  border: string
  surface: string
  codeBackground: string
  codeForeground: string
  link: string
  linkDecoration: string
  quoteBorder: string
  tableHeaderBackground: string
  taskMarkerBackground: string
  taskMarkerBorder: string
  taskMarkerForeground: string
}

// Keep the default PDF preset close to the current preview surface so the first export matches the live document before user-level theme customization is introduced.
export const defaultPdfPreviewTheme: PdfPreviewTheme = {
  background: '#fffdf8',
  foreground: '#181717',
  mutedForeground: '#6d6860',
  border: '#d6cec1',
  surface: '#eee7dd',
  codeBackground: '#eee7dd',
  codeForeground: '#181717',
  link: '#0369a1',
  linkDecoration: '#0369a1',
  quoteBorder: '#d6cec1',
  tableHeaderBackground: '#eee7dd',
  taskMarkerBackground: '#181717',
  taskMarkerBorder: '#181717',
  taskMarkerForeground: '#ffffff',
}

export const documentAccentColors = { ink: '#181717', blue: '#275baf', green: '#2e6651', plum: '#78516f' } as const

export function getDocumentTheme(options: import('./pdf-options').PdfOptions): PdfPreviewTheme {
  const accent = options.textColor ?? documentAccentColors[options.accent]
  const white = options.surface === 'white'
  return {
    ...defaultPdfPreviewTheme,
    background: options.backgroundColor ?? (white ? '#ffffff' : '#fffdf8'),
    border: white ? '#dededb' : '#d6cec1',
    surface: white ? '#f4f4f2' : '#f0ebe2',
    codeBackground: white ? '#f4f4f2' : '#f0ebe2',
    tableHeaderBackground: white ? '#f4f4f2' : '#f0ebe2',
    link: accent,
    linkDecoration: accent,
    quoteBorder: accent,
    taskMarkerBackground: accent,
    taskMarkerBorder: accent,
    accent,
    ...(options.textColor ? {
      foreground: options.textColor,
      mutedForeground: options.textColor,
      codeForeground: options.textColor,
      taskMarkerForeground: options.backgroundColor ?? (white ? '#ffffff' : '#fffdf8'),
    } : {}),
    ...(options.backgroundColor ? {
      surface: blend(options.backgroundColor, options.textColor ?? '#181717', 0.07),
      codeBackground: blend(options.backgroundColor, options.textColor ?? '#181717', 0.07),
      tableHeaderBackground: blend(options.backgroundColor, options.textColor ?? '#181717', 0.07),
      border: blend(options.backgroundColor, options.textColor ?? '#181717', 0.25),
    } : {}),
  }
}

function blend(background: string, foreground: string, amount: number) {
  const channels = [1, 3, 5].map((offset) => {
    const bg = parseInt(background.slice(offset, offset + 2), 16)
    const fg = parseInt(foreground.slice(offset, offset + 2), 16)
    return Math.round(bg + (fg - bg) * amount).toString(16).padStart(2, '0')
  })
  return `#${channels.join('')}`
}
