/**
 * File: src/shared/lib/markdown-task-list.ts
 * Purpose: Shared detection helper for markdown task-list nodes rendered by react-markdown and remark-gfm.
 * Why it exists: the preview and PDF renderers both need to identify task items reliably without depending on parser-specific className output.
 * What it does: walks a rendered React node tree and reports whether it contains the shared task-checkbox primitive.
 * Connected to: `markdown-renderer.tsx`, `pdf-markdown-document.tsx`, and the shared `TaskCheckbox` primitive.
 */
import { Children, isValidElement, type ReactElement, type ReactNode } from 'react'
import { TaskCheckbox } from '@/shared/ui/task-checkbox'

// Compare rendered markdown nodes against the shared checkbox primitive so task-list styling stays stable even if remark-gfm changes its class output.
function isTaskCheckboxElement(node: ReactNode): boolean {
  return isValidElement(node) && node.type === TaskCheckbox
}

// Recursively inspect a rendered markdown subtree so both list wrappers and list items can detect task-list structure from the actual rendered content instead of parser-specific class names.
export function containsTaskCheckboxNode(node: ReactNode): boolean {
  if (isTaskCheckboxElement(node)) {
    return true
  }

  if (isValidElement(node)) {
    const element = node as ReactElement<{ children?: ReactNode }>

    return Children.toArray(element.props.children).some(containsTaskCheckboxNode)
  }

  return Children.toArray(node).some(containsTaskCheckboxNode)
}
