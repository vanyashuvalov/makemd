/**
 * File: src/shared/lib/pdf-export-handshake.ts
 * Purpose: Shared handshake constants for the PDF export flow.
 * Why it exists: both the browser export helper and the server route need the same trusted app header without crossing client/server module boundaries.
 * What it does: defines the app-only header name and value used to authorize PDF export requests.
 * Connected to: `features/document-actions/model/document-actions.ts` and `app/api/export/pdf/route.tsx`.
 */

// Keep the PDF export handshake in a neutral shared module so the server route can compare a plain string header name without importing a client-only file.
export const PDF_EXPORT_APP_HEADER_NAME = 'x-makemd-app'

// Keep the PDF export handshake value in the same shared module so client and server stay aligned on the same origin check contract.
export const PDF_EXPORT_APP_HEADER_VALUE = 'web'
