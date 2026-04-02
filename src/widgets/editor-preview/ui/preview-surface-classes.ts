/**
 * File: src/widgets/editor-preview/ui/preview-surface-classes.ts
 * Purpose: Shared layout tokens for the preview panel and the PDF export surface.
 * Why it exists: the right preview pane and the exported PDF should use the same inner spacing rules so the captured document matches the on-screen rendering.
 * What it does: exposes the frame and body class names for the preview shell, the scrollable preview body, and the export-only markdown surface.
 * Connected to: `editor-preview.tsx`, `pdf-preview-surface.tsx`, and the workspace export flow.
 */

// Keep the preview chrome in one place so the desktop preview pane and any future preview variants stay visually aligned.
export const PREVIEW_FRAME_CLASSNAME =
  'flex h-full min-h-0 overflow-hidden rounded-[16px] border border-border bg-card'

// Keep the live preview body spacing identical across the desktop preview and the export-only surface so the markdown text lands at the same offsets.
export const PREVIEW_BODY_CLASSNAME =
  'h-full min-h-0 w-full overflow-y-auto bg-card px-8 py-8 pb-24'

// Keep the mobile preview body on the same rhythm as the desktop preview while using slightly tighter padding for the smaller viewport.
export const PREVIEW_BODY_MOBILE_CLASSNAME = 'px-6 py-6 pb-20'

// Keep the export-only markdown surface on the same card background and padding as the preview body so html2pdf captures the same document geometry the user sees on the right.
export const PDF_EXPORT_BODY_CLASSNAME = 'bg-card px-8 py-8 pb-24 text-foreground'
