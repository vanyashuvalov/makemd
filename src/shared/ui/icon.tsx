'use client'

/**
 * File: src/shared/ui/icon.tsx
 * Purpose: Shared Tabler icon primitive with reusable size and tone variants.
 * Why it exists: the workspace uses the same icon pack across checkboxes, menus, and action rows, but the raw SVG components need consistent sizing and color control.
 * What it does: renders any Tabler icon component with a standardized size and color contract.
 * Connected to: checkbox states, document rows, selection actions, and future icon-based controls.
 */
import * as React from 'react'
import type { TablerIcon } from '@tabler/icons-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/lib/cn'

export const iconVariants = cva('shrink-0', {
  variants: {
    size: {
      xs: 'h-3 w-3',
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8',
    },
    tone: {
      current: 'text-current',
      white: 'text-white',
      subtle: 'text-white/60',
      muted: 'text-muted-foreground',
      sidebar: 'text-sidebar-foreground',
      sidebarMuted: 'text-sidebar-muted-foreground',
    },
  },
  defaultVariants: {
    size: 'md',
    tone: 'current',
  },
})

export interface IconProps extends React.SVGAttributes<SVGSVGElement>, VariantProps<typeof iconVariants> {
  icon: TablerIcon
}

export function Icon({ icon: IconComponent, size, tone, className, ...props }: IconProps) {
  // Render a single Tabler icon through a shared size/tone contract so repeated UI icons stay visually consistent.
  return <IconComponent aria-hidden focusable="false" className={cn(iconVariants({ size, tone }), className)} {...props} />
}
