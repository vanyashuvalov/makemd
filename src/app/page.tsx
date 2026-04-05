/**
 * File: src/app/page.tsx
 * Purpose: Route entrypoint for the makemd home screen.
 * Why it exists: Next.js App Router needs a page module that can translate request state into the home composition.
 * What it does: resolves the current design-state preview from the query string and passes it into the home page component.
 * Connected to: `src/screens/workspace/ui/workspace-page.tsx` and `src/entities/document/model/mock.ts`.
 */
import { getWorkspaceSnapshot, normalizeWorkspaceState } from '@/entities/document/model/mock'
import { getHelpMarkdown } from '@/features/help/model/get-help-markdown'
import { WorkspacePage } from '@/screens/workspace/ui/workspace-page'
import { redirect } from 'next/navigation'
import { mapSupabaseUserToWorkspaceAccount } from '@/shared/lib/supabase/account'
import { createSupabaseServerClient } from '@/shared/lib/supabase/server-client'

type PageProps = {
  searchParams: Promise<{
    state?: string
    code?: string
    next?: string
    error?: string
    error_description?: string
  }>
}

export default async function Page({ searchParams }: PageProps) {
  // Read the request-time state so the preview can switch between the Figma-inspired variants without client routing.
  const { state, code, next, error, error_description } = await searchParams

  // If Supabase drops the OAuth code on the root URL instead of the dedicated callback route, forward the browser to the callback so the session exchange still completes.
  if (code) {
    const callbackSearch = new URLSearchParams()
    callbackSearch.set('code', code)

    if (next) {
      callbackSearch.set('next', next)
    }

    if (error) {
      callbackSearch.set('error', error)
    }

    if (error_description) {
      callbackSearch.set('error_description', error_description)
    }

    redirect(`/auth/callback?${callbackSearch.toString()}`)
  }

  const normalizedState = normalizeWorkspaceState(state)
  const [supabase, helpMarkdown] = await Promise.all([createSupabaseServerClient(), getHelpMarkdown()])
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Prefer the real Supabase session when one exists so authenticated users land on their signed-in workspace instead of the mock authorized fixture.
  const snapshot = user
    ? getWorkspaceSnapshot('authorized', mapSupabaseUserToWorkspaceAccount(user))
    : getWorkspaceSnapshot(normalizedState)

  return <WorkspacePage snapshot={snapshot} helpMarkdown={helpMarkdown} />
}
