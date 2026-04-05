/**
 * File: src/shared/lib/markdown-task-list.ts
 * Purpose: Shared detection helper for markdown task-list nodes rendered by react-markdown and remark-gfm.
 * Why it exists: the preview and PDF renderers both need to identify task items reliably without depending on parser-specific className output.
 * What it does: inspects the immediate rendered children of a list item and reports whether they contain the shared task-checkbox primitive.
 * Connected to: `markdown-renderer.tsx`, `pdf-markdown-document.tsx`, and the shared `TaskCheckbox` primitive.
 */
import { Children, isValidElement, type ReactNode } from 'react'
import { TaskCheckbox } from '@/shared/ui/task-checkbox'

// Inspect only the immediate rendered children so list-item styling can detect task-list checkboxes without recursively walking the entire React tree.
export function containsTaskCheckboxNode(node: ReactNode): boolean {
  return Children.toArray(node).some((child) => isValidElement(child) && child.type === TaskCheckbox)
}
