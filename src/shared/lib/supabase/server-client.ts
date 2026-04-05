/**
 * File: src/shared/lib/supabase/server-client.ts
 * Purpose: Server-side Supabase client factory for App Router data loading and OAuth callbacks.
 * Why it exists: the page route and auth callback need the current request cookies so they can detect or finalize a Supabase session without leaking browser-only code into the server tree.
 * What it does: creates a request-scoped Supabase client backed by Next.js cookies.
 * Connected to: `src/app/page.tsx`, `src/app/auth/callback/route.ts`, and the Next 16 auth proxy.
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabasePublishableKey, getSupabaseUrl } from './env'

// Build a request-scoped server client so the app can inspect the current Supabase session during SSR and finalize OAuth callbacks on the server.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Server Components may call this helper in contexts where mutation is not allowed; the client-side proxy and callback route still perform the actual cookie writes.
        }
      },
    },
  })
}

