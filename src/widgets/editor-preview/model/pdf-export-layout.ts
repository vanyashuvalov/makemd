/**
 * File: src/widgets/editor-preview/model/pdf-export-layout.ts
 * Purpose: Export-page geometry used by the PDF preview surface and the html2pdf capture pipeline.
 * Why it exists: the PDF should size itself against the target paper format, not against the on-screen preview column.
 * What it does: defines a stable A4 portrait content width in CSS pixels and the page-break hints used by the export helper.
 * Connected to: `pdf-preview-surface.tsx`, `workspace-shell-client.tsx`, and `document-actions.ts`.
 */

const CSS_DPI = 96
const MM_PER_INCH = 25.4

// Convert a physical paper width in millimeters to the CSS pixel width html2canvas should capture for the PDF surface.
function millimetersToCssPixels(valueMm: number) {
  return Math.round((valueMm / MM_PER_INCH) * CSS_DPI)
}

// Keep the export surface aligned with A4 portrait so the rendered document fills the PDF page instead of inheriting the preview pane width.
export const DEFAULT_PDF_PAGE_WIDTH_PX = millimetersToCssPixels(210)

// Keep the export surface height available for future page-layout calculations and debugging even though the current capture path only needs width.
export const DEFAULT_PDF_PAGE_HEIGHT_PX = millimetersToCssPixels(297)

// Prefer CSS-driven pagination but keep legacy fallbacks enabled so html2pdf can split long documents more predictably across pages.
export const DEFAULT_PDF_PAGEBREAK_MODE = ['css', 'legacy'] as const

// Avoid splitting atomic blocks that read poorly when cut in half during PDF pagination.
export const DEFAULT_PDF_PAGEBREAK_AVOID_SELECTORS = ['pre', 'table', 'blockquote', 'img', '.page-break-avoid'] as const
