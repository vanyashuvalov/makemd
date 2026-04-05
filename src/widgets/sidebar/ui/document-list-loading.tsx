'use client'

/**
 * File: src/widgets/sidebar/ui/document-list-loading.tsx
 * Purpose: Loading placeholder for the sidebar history block while cloud documents are being hydrated.
 * Why it exists: the sidebar should not flash stale local rows before Supabase data finishes loading, especially for signed-in sessions that need the cloud snapshot to win.
 * What it does: shows a compact spinner and a few skeleton rows that match the height of the real document list block.
 * Connected to: `DocumentList`, the sidebar widget, the shared collection loading primitive, and the workspace cloud sync hydration state.
 */

import { CollectionListLoading } from '@/shared/ui/collection-list-loading'

// Render a lightweight history placeholder so the sidebar can communicate that the document list is still waiting on cloud data.
export function DocumentListLoading() {
  return <CollectionListLoading label="Loading cloud documents" variant="rows" />
}
