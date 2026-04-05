/**
 * File: src/shared/lib/supabase/env.ts
 * Purpose: Central Supabase environment access for both browser and server helpers.
 * Why it exists: auth and storage wiring need one consistent source of truth for project URL and publishable key without sprinkling env lookups across the app.
 * What it does: resolves the Supabase URL and publishable key, with a compatibility fallback for the older anon-key naming some dashboards still expose.
 * Connected to: the Supabase browser client, server client, callback route, and proxy session refresh.
 */

// Resolve the public Supabase endpoint once so the app can fail fast if the project is not wired yet.
export function getSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is missing')
  }

  return url
}

// Resolve the public Supabase key once so both browser and server auth clients can authenticate without hardcoding secrets in multiple files.
export function getSupabasePublishableKey() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing')
  }

  return key
}

