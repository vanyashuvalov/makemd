/**
 * File: src/widgets/editor-preview/model/pdf-theme.ts
 * Purpose: Theme presets for the export-only PDF surface.
 * Why it exists: PDF styling is expected to evolve independently from the live preview, so the export layer needs a reusable theme object instead of hardcoded colors inside the renderer.
 * What it does: defines the shape of PDF theme tokens and ships the default preset used by the workspace today.
 * Connected to: `pdf-preview-surface.tsx`, `markdown-renderer.tsx`, and the workspace export flow.
 */

export type PdfPreviewTheme = {
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
