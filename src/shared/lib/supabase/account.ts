/**
 * File: src/shared/lib/supabase/account.ts
 * Purpose: Shared user-to-workspace account mapping for Supabase-authenticated sessions.
 * Why it exists: the workspace snapshot and auth UI should render the same display name and avatar regardless of whether the session came from Google or email/password.
 * What it does: converts a Supabase user record into the lightweight account shape used by the workspace shell.
 * Connected to: `page.tsx`, `workspace-shell-client.tsx`, the auth modal flow, and any future profile hydration step.
 */

import type { User } from '@supabase/supabase-js'
import type { WorkspaceAccount } from '@/entities/document/model/types'

// Derive a readable workspace account from the Supabase user profile so the shell can show the same signed-in identity in both server and client paths.
export function mapSupabaseUserToWorkspaceAccount(user: User): WorkspaceAccount {
  const email = user.email?.trim() || 'user@example.com'
  const metadata = user.user_metadata ?? {}
  const name =
    String(metadata.full_name ?? metadata.name ?? metadata.preferred_username ?? email.split('@')[0] ?? 'User').trim() ||
    'User'

  return {
    name,
    email,
    avatarSrc: metadata.avatar_url ?? metadata.picture ?? metadata.avatar ?? undefined,
  }
}
