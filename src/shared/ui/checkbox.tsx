'use client'

/**
 * File: src/shared/ui/checkbox.tsx
 * Purpose: Custom checkbox primitive used in document selection states.
 * Why it exists: the mockups show default, checked, and indeterminate selection states throughout the sidebar.
 * What it does: renders a compact accessible checkbox that supports both binary and mixed selection.
 * Connected to: document rows, selection summary bars, and any future bulk-action workflows.
 */
import * as React from 'react'
import { cn } from '@/shared/lib/cn'
import { Icon } from '@/shared/ui/icon'
import { IconCheck, IconMinus } from '@tabler/icons-react'

export type CheckboxState = boolean | 'indeterminate'

export interface CheckboxProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked?: CheckboxState
  onCheckedChange?: (checked: boolean) => void
}

export function Checkbox({
  checked = false,
  onCheckedChange,
  className,
  'aria-label': ariaLabel = 'Select row',
  ...props
}: CheckboxProps) {
  const isChecked = checked === true
  const isMixed = checked === 'indeterminate'

  // Render the checkbox as a 24x24 wrapper with an inner 20x20 visual box so the outer hit area and the visible stroke match the Figma component model.
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isMixed ? 'mixed' : isChecked}
      aria-label={ariaLabel}
      onClick={() => onCheckedChange?.(!isChecked)}
      className={cn(
        'inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center p-0 transition-[background-color,border-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isChecked || isMixed
          ? 'text-white'
          : 'text-sidebar-foreground/70 hover:text-white',
        className
      )}
      {...props}
    >
      <span
        className={cn(
          'inline-flex h-5 w-5 shrink-0 box-border items-center justify-center rounded-[4px] border-2 transition-[border-color] duration-150',
          isChecked || isMixed
            ? 'border-white'
            : 'border-[color:var(--color-sidebar-checkbox-border)] hover:border-white'
        )}
      >
        {isChecked ? <Icon icon={IconCheck} size="sm" tone="current" /> : null}
        {isMixed ? <Icon icon={IconMinus} size="sm" tone="current" /> : null}
      </span>
    </button>
  )
}

