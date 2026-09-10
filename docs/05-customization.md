# Document customization — 2026-09-10

The workspace has one compact Customize panel with Clean, Editorial and Mono presets; font, text size, line spacing, accent, paper tone, page size and margins can be adjusted individually. Changes update the preview immediately. Reset returns the current document to the default style. The panel closes on outside click or Escape.

Preview and PDF use the same Markdown rendering components and typography. Inter, Source Serif 4 and IBM Plex Mono are bundled with their licenses, including Cyrillic glyphs; PDF embeds font files directly. The continuous responsive preview does not simulate page breaks.

Each document stores its own options. Local drafts, cloud storage and favorites preserve them. Customized `.md` downloads include a versioned HTML comment that MakeMD reads on import; default documents retain plain Markdown. No database migration is required.

Two persistence defects found during verification are also fixed: refreshed server props no longer reset live documents, and legacy local document IDs and pending deletion IDs are normalized to their cloud UUIDs before hydration.

## Verification

- Lint, TypeScript, 15 regression tests and production build passed.
- Local production browser: imported Cyrillic Markdown, applied Editorial, reloaded with content and style intact, created a separate document with defaults, and returned to the styled document.
- Exported PDF and Markdown; rendered PDF visually checked. Reimported the styled Markdown and confirmed the serif font and source text were restored.
- At 390 × 844, preview and the full customization panel fit the viewport. Reset and Escape dismissal were exercised.
- Long A4 and Letter fixtures generated eight pages each; extracted text retains all 90 table rows and 100 code lines, and the table heading remains with the first row.
- Production build trace includes the bundled document fonts used by the PDF route.

Authenticated synchronization between two real devices and physical iPhone/Safari downloads remain untested. Controlled sync regressions pass; existing database policies and download transport remain in use.
