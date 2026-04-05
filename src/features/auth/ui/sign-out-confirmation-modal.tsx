'use client'

/**
 * File: src/features/auth/ui/sign-out-confirmation-modal.tsx
 * Purpose: Confirmation modal for the destructive sign-out action.
 * Why it exists: signing out changes the authenticated workspace state, so the user should confirm before the session is cleared.
 * What it does: renders a shared modal with cancel and sign-out actions and delegates the actual session teardown to the shell.
 * Connected to: the shared modal primitive, the auth copy model, and the workspace shell auth flow.
 */

import { Button } from '@/shared/ui/button'
import { Modal } from '@/shared/ui/modal'
import { getSignOutConfirmationDescription, getSignOutConfirmationTitle } from '../model/sign-out-confirmation'

export interface SignOutConfirmationModalProps {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}

// Ask for one extra confirmation before ending the current session so accidental sign-out is harder.
export function SignOutConfirmationModal({
  open,
  onCancel,
  onConfirm,
}: SignOutConfirmationModalProps) {
  return (
    <Modal
      open={open}
      title={getSignOutConfirmationTitle()}
      description={getSignOutConfirmationDescription()}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onCancel()
        }
      }}
    >
      <div className="flex items-center justify-end gap-3">
        <Button variant="text" size="primary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="destructive" size="primary" onClick={onConfirm}>
          Sign out
        </Button>
      </div>
    </Modal>
  )
}
