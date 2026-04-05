/**
 * File: src/app/auth/callback/route.ts
 * Purpose: OAuth callback route for Supabase-authenticated sign-ins.
 * Why it exists: Google sign-in uses a code exchange flow, and the app needs one server route to persist the session cookies before redirecting back to the workspace.
 * What it does: validates the redirect target, exchanges the OAuth code for a Supabase session, and sends the browser back to the app shell.
 * Connected to: `AuthModal`, `src/shared/lib/supabase/server-client.ts`, the Next.js proxy session refresh, and the Supabase dashboard redirect allow list.
 */
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/shared/lib/supabase/server-client'

// Finalize the OAuth callback on the server so the Supabase session lands in cookies before the user returns to the workspace.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // Keep the redirect target relative so the callback can return to the workspace without becoming an open redirect endpoint.
  let next = searchParams.get('next') ?? '/'

  if (!next.startsWith('/')) {
    next = '/'
  }

  if (code) {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Send failed exchanges back to the shell so the auth modal can recover without exposing the callback internals to the user.
  return NextResponse.redirect(`${origin}/?auth=error`)
}
