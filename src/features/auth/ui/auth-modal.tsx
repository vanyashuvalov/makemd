'use client'

/**
 * File: src/features/auth/ui/auth-modal.tsx
 * Purpose: Authentication entrypoint for the guest sidebar state.
 * Why it exists: the Sign up button should open an in-place auth flow instead of sending the user away from the workspace.
 * What it does: renders a reusable email/password form and a Google sign-in action inside the shared modal primitive.
 * Connected to: the sidebar Sign up button, workspace session state, Supabase OAuth, and future auth providers.
 */
import * as React from 'react'
import Image from 'next/image'
import { Alert } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Modal } from '@/shared/ui/modal'
import { Separator } from '@/shared/ui/separator'
import { GOOGLE_AUTH_ICON_SRC } from '@/shared/lib/social-icons'

export interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onEmailPasswordSubmit: (email: string, password: string) => Promise<void> | void
  onGoogleSignIn: () => Promise<void> | void
  isLoading?: boolean
  errorMessage?: string
}

// Keep the auth surface compact so the workspace controller can decide whether an email/password pair becomes a sign-in or sign-up backend flow.
export function AuthModal({
  open,
  onOpenChange,
  onEmailPasswordSubmit,
  onGoogleSignIn,
  isLoading = false,
  errorMessage,
}: AuthModalProps) {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')

  // Submit only the minimum credentials surface here so the workspace controller can keep sign-in and Google redirect routing out of the modal UI itself.
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await onEmailPasswordSubmit(email, password)
  }

  // Route Google login through the parent shell so the modal stays reusable and does not own provider-specific redirect logic.
  const handleGoogleSignIn = async () => {
    await onGoogleSignIn()
  }

  return (
    <Modal
      open={open}
      title="Continue with email"
      description="Use email/password or Google to sign in and keep your drafts synced across devices."
      onOpenChange={onOpenChange}
    >
      <div className="space-y-4">
        <Button
          type="button"
          variant="outline"
          size="primary"
          className="w-full"
          before={
            <span className="flex h-5 w-5 items-center justify-center">
              <Image
                src={GOOGLE_AUTH_ICON_SRC}
                alt=""
                aria-hidden="true"
                width={20}
                height={20}
                className="block h-5 w-5 shrink-0"
              />
            </span>
          }
          onClick={handleGoogleSignIn}
          disabled={isLoading}
        >
          Continue with Google
        </Button>

        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-sidebar-muted-foreground">
          <Separator className="flex-1 bg-sidebar-border" />
          <span>or</span>
          <Separator className="flex-1 bg-sidebar-border" />
        </div>

        {errorMessage ? (
          <Alert tone="warning" title="Could not continue" description={errorMessage} />
        ) : null}

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
            <Button type="submit" variant="primary" size="primary" className="w-full" disabled={isLoading}>
              Continue
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
