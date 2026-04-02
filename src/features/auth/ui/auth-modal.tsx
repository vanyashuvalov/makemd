'use client'

/**
 * File: src/features/auth/ui/auth-modal.tsx
 * Purpose: Authentication entrypoint for the guest sidebar state.
 * Why it exists: the Sign up button should open an in-place auth flow instead of sending the user away from the workspace.
 * What it does: renders a reusable sign-in/sign-up form inside the shared modal primitive and returns the submitted account data.
 * Connected to: the sidebar Sign up button, workspace session state, and future persistence/auth providers.
 */
import * as React from 'react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Modal } from '@/shared/ui/modal'

export type AuthMode = 'sign-in' | 'sign-up'

export interface AuthModalAccount {
  name: string
  email: string
}

export interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAuthenticate: (account: AuthModalAccount) => void
}

export function AuthModal({ open, onOpenChange, onAuthenticate }: AuthModalProps) {
  const [mode, setMode] = React.useState<AuthMode>('sign-up')
  const [name, setName] = React.useState('Ivan')
  const [email, setEmail] = React.useState('intjivan@gmail.com')
  const [password, setPassword] = React.useState('12345678')

  // Keep the auth surface lightweight so the workspace can switch between guest and authenticated modes without leaving the current page.
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const resolvedName = mode === 'sign-up' ? name.trim() || 'User' : name.trim() || email.split('@')[0] || 'User'

    onAuthenticate({
      name: resolvedName,
      email: email.trim() || 'user@example.com',
    })
  }

  return (
    <Modal
      open={open}
      title={mode === 'sign-up' ? 'Create account' : 'Sign in'}
      description="Use one account to save history, unlock templates, and sync documents across sessions."
      onOpenChange={onOpenChange}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-2 rounded-[1rem] bg-sidebar-muted p-1">
          <Button
            variant={mode === 'sign-in' ? 'primary' : 'secondary'}
            size="sm"
            className="w-full"
            onClick={() => setMode('sign-in')}
          >
            Sign in
          </Button>
          <Button
            variant={mode === 'sign-up' ? 'primary' : 'secondary'}
            size="sm"
            className="w-full"
            onClick={() => setMode('sign-up')}
          >
            Sign up
          </Button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === 'sign-up' ? (
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              autoComplete="name"
            />
          ) : null}

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
            autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
            type="password"
          />

          <div className="flex items-center gap-3 pt-1">
            <Button type="submit" variant="primary" size="primary" className="flex-1">
              {mode === 'sign-up' ? 'Create account' : 'Continue'}
            </Button>
            <Button type="button" variant="text" size="text" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
