'use client'

/**
 * File: src/shared/ui/avatar.tsx
 * Purpose: Lightweight identity badge for the account block in the sidebar.
 * Why it exists: the design surfaces user identity prominently, but the first sketch does not require a full avatar library.
 * What it does: shows either an image or derived initials inside a circular badge.
 * Connected to: the authenticated account state and the sidebar header layout.
 */
import * as React from 'react'
import Image from 'next/image'
import { cn } from '@/shared/lib/cn'

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  src?: string
}

function getInitials(name: string) {
  // Derive a stable fallback from the account label so the sketch can work without remote images.
  const trimmed = name.trim()

  if (!trimmed) {
    return 'MK'
  }

  const words = trimmed.split(/\s+/).slice(0, 2)
  return words.map((word) => word[0]?.toUpperCase()).join('')
}

export function Avatar({ name, src, className, ...props }: AvatarProps) {
  const initials = getInitials(name)

  // Render a compact circular badge that matches the figure's profile slot without depending on an avatar package.
  return (
    <div
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#3c3f46] text-xs font-semibold text-sidebar-foreground',
        className
      )}
      {...props}
    >
      {src ? <Image src={src} alt={name} width={40} height={40} className="h-full w-full object-cover" /> : initials}
    </div>
  )
}
