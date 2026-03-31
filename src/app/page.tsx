/**
 * File: src/app/page.tsx
 * Purpose: Route entrypoint for the makemd home screen.
 * Why it exists: Next.js App Router needs a page module that can translate request state into the home composition.
 * What it does: resolves the current design-state preview from the query string and passes it into the home page component.
 * Connected to: `src/screens/workspace/ui/workspace-page.tsx` and `src/entities/document/model/mock.ts`.
 */
import { getWorkspaceSnapshot, normalizeWorkspaceState } from '@/entities/document/model/mock'
import { WorkspacePage } from '@/screens/workspace/ui/workspace-page'

type PageProps = {
  searchParams: Promise<{
    state?: string
  }>
}

export default async function Page({ searchParams }: PageProps) {
  // Read the request-time state so the preview can switch between the Figma-inspired variants without client routing.
  const { state } = await searchParams
  const normalizedState = normalizeWorkspaceState(state)
  const snapshot = getWorkspaceSnapshot(normalizedState)

  return <WorkspacePage snapshot={snapshot} />
}
