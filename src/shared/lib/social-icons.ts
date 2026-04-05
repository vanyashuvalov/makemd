/**
 * File: src/shared/lib/social-icons.ts
 * Purpose: Shared icon asset paths for social sign-in surfaces.
 * Why it exists: auth buttons need one reusable source of truth for provider logos instead of scattering public URLs across the UI.
 * What it does: exposes the canonical public asset path for the Google sign-in logo.
 * Connected to: the auth modal and any future login surfaces that need the same Google mark.
 */

// Keep the Google logo path in one place so the auth UI can reuse the same asset without hardcoding the public URL in multiple components.
export const GOOGLE_AUTH_ICON_SRC = '/icons/google.svg'
