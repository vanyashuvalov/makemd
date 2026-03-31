/**
 * File: src/features/workspace-state-switch/ui/workspace-state-switch.tsx
 * Purpose: Query-driven state switcher for previewing the Figma-inspired workspace variants.
 * Why it exists: the first UI pass benefits from a built-in way to jump between authorized, unauthorized, and empty views.
 * What it does: renders link-style pills that swap the `state` search parameter in the home route.
 * Connected to: `src/app/page.tsx`, the workspace mock snapshots, and the home page shell.
 */
import Link from 'next/link'
import { buttonVariants } from '@/shared/ui/button-variants'
import { cn } from '@/shared/lib/cn'

const states = [
  { value: 'authorized', label: 'Authorized' },
  { value: 'unauthorized', label: 'Unauthorized' },
  { value: 'empty', label: 'Empty' },
]

export function WorkspaceStateSwitch({
  activeState,
}: {
  activeState: string
}) {
  // Render a compact preview switcher so the prototype can quickly hop between the design states captured in Figma.
  return (
    <nav aria-label="Workspace state preview" className="flex flex-wrap gap-2">
      {states.map((state) => {
        const active = state.value === activeState

        return (
          <Link
            key={state.value}
            href={state.value === 'authorized' ? '/' : `/?state=${state.value}`}
            className={cn(
              buttonVariants({ variant: active ? 'primary' : 'outline', size: 'sm' }),
              'rounded-full'
            )}
            aria-current={active ? 'page' : undefined}
          >
            {state.label}
          </Link>
        )
      })}
    </nav>
  )
}
