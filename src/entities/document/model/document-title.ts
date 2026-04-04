/**
 * File: src/entities/document/model/document-title.ts
 * Purpose: Helpers for document naming and starter content.
 * Why it exists: the workspace needs one reusable rule for timestamp-based document titles and one shared starter markdown seed.
 * What it does: formats document titles as `From DD.MM at HH:MM` and exposes the default starter markdown used by new and mocked documents.
 * Connected to: `WorkspaceShellClient`, the document mock snapshot, and future document creation flows.
 */

const starterMarkdown = `# Paste Markdown here

**tip:** start typing to replace this draft

---

ok`

// Pad date and time parts so document titles stay visually aligned in the sidebar and export chip.
function padTimePart(value: number) {
  return String(value).padStart(2, '0')
}

// Format a local date into the timestamp title shown for every document so the workspace no longer depends on markdown headings for naming.
export function formatDocumentTitle(date: Date) {
  const day = padTimePart(date.getDate())
  const month = padTimePart(date.getMonth() + 1)
  const hours = padTimePart(date.getHours())
  const minutes = padTimePart(date.getMinutes())

  return `From ${day}.${month} at ${hours}:${minutes}`
}

// Provide a single factory for newly created workspace documents so callers do not need to reimplement the date-based naming rule.
export function createDocumentTitle(date: Date = new Date()) {
  return formatDocumentTitle(date)
}

// Reuse the same starter markdown in the mock snapshot and in newly created documents so the text body stays independent from the title.
export function getDocumentStarterMarkdown() {
  return starterMarkdown
}
