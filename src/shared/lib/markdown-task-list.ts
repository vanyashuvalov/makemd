/**
 * File: src/shared/lib/markdown-task-list.ts
 * Purpose: Shared detection helper for markdown task-list nodes rendered by react-markdown and remark-gfm.
 * Why it exists: the preview and PDF renderers both need to identify task items reliably without depending on parser-specific className output.
 * What it does: inspects a shallow slice of the rendered markdown tree and reports whether it contains the shared task-checkbox primitive or a remark-gfm task-item marker.
 * Connected to: `markdown-renderer.tsx`, `pdf-markdown-document.tsx`, and the shared `TaskCheckbox` primitive.
 */
import { Children, isValidElement, type ReactElement, type ReactNode } from 'react'
import { TaskCheckbox } from '@/shared/ui/task-checkbox'

// Inspect only a shallow subtree so list-item styling can detect task-list checkboxes without recursively walking the entire React tree.
export function containsTaskCheckboxNode(node: ReactNode): boolean {
  const queue: Array<{ value: ReactNode; depth: number }> = Children.toArray(node).map((value) => ({
    value,
    depth: 0,
  }))

  while (queue.length > 0) {
    const current = queue.shift()

    if (!current) {
      continue
    }

    const { value, depth } = current

    if (!isValidElement(value)) {
      continue
    }

    const element = value as ReactElement<{ className?: string; children?: ReactNode }>
    const className = typeof element.props.className === 'string' ? element.props.className : ''

    if (element.type === TaskCheckbox || className.includes('task-list-item')) {
      return true
    }

    if (depth < 2) {
      queue.push(
        ...Children.toArray(element.props.children).map((child) => ({
          value: child,
          depth: depth + 1,
        }))
      )
    }
  }

  return false
}
