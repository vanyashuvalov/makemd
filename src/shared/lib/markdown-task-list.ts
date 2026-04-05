/**
 * File: src/shared/lib/markdown-task-list.ts
 * Purpose: Shared detection helpers for markdown task-list nodes rendered by react-markdown and remark-gfm.
 * Why it exists: the preview and PDF renderers both need a single source of truth for task-list layout without relying on brittle list styling.
 * What it does: detects task-list containers and items from remark-gfm class names while still exposing the shared task-checkbox primitive for future reuse.
 * Connected to: `markdown-renderer.tsx`, `pdf-markdown-document.tsx`, and the shared `TaskCheckbox` primitive.
 */
import { Children, isValidElement, type ReactNode } from 'react'
import { TaskCheckbox } from '@/shared/ui/task-checkbox'

// Detect the remark-gfm task-list container marker so the renderer can remove default list padding only for checkbox lists.
export function hasTaskListContainerClassName(className?: string) {
  return typeof className === 'string' && className.includes('contains-task-list')
}

// Detect the remark-gfm task-item marker so the renderer can suppress bullets and align the checkbox/text row.
export function hasTaskListItemClassName(className?: string) {
  return typeof className === 'string' && className.includes('task-list-item')
}

// Keep a lightweight checkbox-node probe available for any future custom markdown tree integrations that need to inspect rendered children directly.
export function containsTaskCheckboxNode(node: ReactNode): boolean {
  return Children.toArray(node).some((child) => isValidElement(child) && child.type === TaskCheckbox)
}
