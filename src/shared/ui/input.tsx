'use client'

/**
 * File: src/shared/ui/input.tsx
 * Purpose: Shared text input primitive for modal forms and future workspace settings.
 * Why it exists: the auth modal needs a consistent input surface, and the app will likely need more form fields later.
 * What it does: renders a single-line text input with the same visual language as the rest of the workspace controls.
 * Connected to: the auth modal, future settings forms, and any workspace-level input interactions.
 */
import * as React from 'react'
import { cn } from '@/shared/lib/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type = 'text', ...props },
  ref
) {
  // Render a minimal form field that matches the dark workspace surfaces used by the auth flow and any future modal forms.
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-11 w-full rounded-[0.9rem] border border-sidebar-border bg-sidebar-muted px-4 text-sm text-sidebar-foreground shadow-none outline-none transition-[border-color,background-color,color] duration-150 placeholder:text-sidebar-muted-foreground focus:border-ring focus:bg-[color:var(--color-sidebar-surface)] focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
})

Input.displayName = 'Input'
