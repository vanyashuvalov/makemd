# Workspace quality review — 2026-09-10

## Changes

- Browser drafts restore for guests and signed-in accounts. Account changes retain separate caches; they no longer delete the previous cache. Writes start immediately instead of waiting for a debounce. Storage failures are visible.
- Cloud read failures cannot become empty document bodies or trigger deletes. Saves are serialized, including partially failed upload batches. Only the submitted snapshot is acknowledged, so newer edits remain pending. Retry is available manually and after reconnection.
- Initial cloud hydration merges with the restored cache. Divergent unsent content is preserved as a separate `(local copy)` document. Acknowledged versions and pending deletions survive reloads in IndexedDB. Unchanged documents deleted on another device are not resurrected.
- Markdown/text imports create separate documents, retaining filenames. The file picker and file drop support `.md`, `.markdown` and `.txt` up to 2 MB. Source download exports the original text. New drafts start empty.
- PDF controls offer A4/Letter, three text sizes and two margin presets. They apply to downloaded PDFs; the live Markdown preview remains a continuous reading view. Settings apply to the current workspace session.
- PDF headings stay with following content; long tables split across pages with repeated headers and intact rows. Large code blocks remain readable. Export waits for fonts and rejects documents over 2 MB. Origin validation checks the actual URL origin.
- Email sign-in and registration are separate explicit actions. Wrong passwords no longer trigger registration. Clipboard failures provide a source-download fallback.
- Updated the dependency lock to patched packages, including Next.js 16.3.4. Added GitHub Actions checks and `.env.example`; local macOS builds use installed Chrome instead of downloading a Linux Chromium pack.

## Verification

- `npm run lint`, `npm run typecheck`, `npm test`: passed, 11 regression tests.
- `npm run build`: production build passed.
- `npm audit`: 0 reported vulnerabilities after updating dependencies (previously 7, including 1 critical).
- Production browser at localhost: imported Russian Markdown, preserved a separate existing draft, downloaded byte-identical `.md`, restored the imported draft after reload, switched mobile editor/preview, and exported a one-page Letter PDF with Russian text.
- 390 × 844 viewport: content width equals viewport width; controls and settings are visible. Desktop editing and refresh also checked.
- `node --import tsx scripts/verify-pdf.mjs`: generated A4 (8 pages) and Letter (9 pages) fixtures with 90 table rows and 100 code lines. Extracted text contains every row/line and the final marker. Table heading shares a page with the first row; table headers repeat. Rendered table pages inspected visually.
- An export request with a deceptive referer such as `http://localhost:3015.attacker.example/` returns 403.

## Remaining validation and limitations

- Real authenticated Supabase write/read flows across two user devices were not exercised; transport and failure behavior were checked with controlled repositories and compared with the committed RLS policies. Existing DB migrations are unchanged.
- This is autosave plus merge on initial hydration, not collaborative real-time editing. Concurrent writes from separate already-open browser sessions still need server-side revision checks for a complete conflict protocol. Database metadata and Storage uploads remain separate operations; partial failures retry.
- Physical iPhone/Safari attachment handling was not tested. The existing iOS form-download transport remains in use.
- Public sharing, Mermaid/math rendering, document version history and a paginated on-screen PDF preview remain future work.

## Local use

Use Node 24.15+ (or a current Node 26), run `npm ci`, copy `.env.example` to `.env.local` and fill in the public Supabase configuration, then run `npm run dev`. Local PDF export requires Chrome or `PDF_BROWSER_EXECUTABLE_PATH`. Test PDF artifacts are written to ignored `qa-output/`.
