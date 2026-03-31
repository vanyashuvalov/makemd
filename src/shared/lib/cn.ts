/**
 * File: src/shared/lib/cn.ts
 * Purpose: Shared className merger for all Tailwind-based UI.
 * Why it exists: the UI will use many conditional utility classes, and the project needs a single consistent merge helper.
 * What it does: combines `clsx` with `tailwind-merge` so class collisions resolve predictably.
 * Connected to: every reusable component under `src/shared/ui` and the widgets that compose them.
 */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  // Merge arbitrary class inputs and collapse conflicting Tailwind utilities into one final class string.
  return twMerge(clsx(inputs))
}
