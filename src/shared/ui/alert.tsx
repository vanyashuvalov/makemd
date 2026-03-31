'use client'

/**
 * File: src/shared/ui/alert.tsx
 * Purpose: Compact message surface for warnings and supporting hints.
 * Why it exists: the unauthorized Figma state uses a warning block to explain possible data loss.
 * What it does: packages an icon, title, and description into one consistent message pattern.
 * Connected to: the sidebar warning state and any future save/auth or error messaging.
 */
import * as React from 'react'
import { cn } from '@/shared/lib/cn'

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description: string
  icon?: React.ReactNode
  tone?: 'warning' | 'info'
}

export function Alert({ title, description, icon, tone = 'warning', className, ...props }: AlertProps) {
  // Render a high-signal message block that explains why the guest state needs extra caution.
  return (
    <div
      className={cn(
        'flex gap-3 rounded-[1.1rem] border px-4 py-3 text-sm',
        tone === 'warning'
          ? 'border-[#5d4a24] bg-[#3a2f19] text-[#f7e2b7]'
          : 'border-border bg-card text-card-foreground',
        className
      )}
      {...props}
    >
      {icon ? <div className="mt-0.5">{icon}</div> : null}
      <div className="space-y-1">
        <p className="font-medium leading-tight">{title}</p>
        <p className={cn('leading-snug', tone === 'warning' ? 'text-[#d8be8c]' : 'text-muted-foreground')}>
          {description}
        </p>
      </div>
    </div>
  )
}
