/**
 * File: src/features/auth/model/sign-out-confirmation.ts
 * Purpose: Shared copy for the sign-out confirmation flow.
 * Why it exists: destructive auth actions should reuse one source of truth for the dialog wording so the sidebar and shell stay consistent.
 * What it does: provides the title and description used by the confirmation modal before the session is cleared.
 * Connected to: `SignOutConfirmationModal` and the workspace shell sign-out flow.
 */

// Keep the confirmation copy in one place so the modal can evolve with the auth flow without scattering text across the shell.
export function getSignOutConfirmationTitle() {
  return 'Sign out?'
}

// Explain what signing out does so the user understands they will leave the authenticated workspace before they confirm.
export function getSignOutConfirmationDescription() {
  return 'You will return to the guest workspace until you sign in again.'
}
