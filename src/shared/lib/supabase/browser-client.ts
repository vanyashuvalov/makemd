/**
 * File: src/shared/lib/supabase/browser-client.ts
 * Purpose: Browser-side Supabase client factory for interactive auth flows.
 * Why it exists: the client shell needs one lazy browser client for Google OAuth redirects and email/password sign-in without duplicating the project URL and key lookup.
 * What it does: creates a singleton browser client backed by the shared Supabase environment helpers.
 * Connected to: `AuthModal`, `WorkspaceShellClient`, and the browser-side sign-in/out actions.
 */

import { createBrowserClient } from '@supabase/ssr'
import { getSupabasePublishableKey, getSupabaseUrl } from './env'

let browserClient: ReturnType<typeof createBrowserClient> | null = null

// Reuse a single browser client instance so auth state subscriptions and redirects share the same Supabase session manager across the workspace lifetime.
export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(getSupabaseUrl(), getSupabasePublishableKey())
  }

  return browserClient
}

