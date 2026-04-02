'use client'

/**
 * File: src/features/auth/ui/auth-modal.tsx
 * Purpose: Authentication entrypoint for the guest sidebar state.
 * Why it exists: the Sign up button should open an in-place auth flow instead of sending the user away from the workspace.
 * What it does: renders a reusable email/password form inside the shared modal primitive and returns the submitted account data.
 * Connected to: the sidebar Sign up button, workspace session state, and future persistence/auth providers.
 */
import * as React from 'react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Modal } from '@/shared/ui/modal'

export interface AuthModalAccount {
  name: string
  email: string
}

export interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAuthenticate: (account: AuthModalAccount) => void
}

// Keep the auth surface compact so the workspace can decide whether a submitted email/password pair should become a sign-in or a sign-up server flow later.
export function AuthModal({ open, onOpenChange, onAuthenticate }: AuthModalProps) {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')

  // Submit only the minimum credentials surface here so the workspace controller can keep sign-in and sign-up routing out of the modal UI itself.
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const resolvedEmail = email.trim() || 'user@example.com'
    const resolvedName = resolvedEmail.split('@')[0] || 'User'

    onAuthenticate({
      name: resolvedName,
      email: resolvedEmail,
    })
  }

  return (
    <Modal
      open={open}
      title="Continue with email"
      description="Enter your email and password. We will decide whether to sign you in or create an account later in the backend flow."
      onOpenChange={onOpenChange}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email address"
          autoComplete="email"
          type="email"
        />

        <Input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          type="password"
        />

        <div className="pt-1">
          <Button type="submit" variant="primary" size="primary" className="w-full">
            Continue
          </Button>
        </div>
      </form>
    </Modal>
  )
}
