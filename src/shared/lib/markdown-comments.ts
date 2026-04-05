/**
 * File: src/shared/lib/markdown-comments.ts
 * Purpose: Shared helpers for markdown HTML comments used as invisible metadata markers.
 * Why it exists: bulk copy needs a comment-based document label, while preview and PDF rendering must hide those markers from the visible document surface.
 * What it does: formats valid HTML comments for markdown bundles and strips comment nodes from remark ASTs before rendering.
 * Connected to: `document-actions.ts`, `markdown-renderer.tsx`, `pdf-markdown-document.tsx`, and the workspace copy/export flows.
 */

type MarkdownCommentNode = {
  type?: string
  value?: unknown
  children?: MarkdownCommentNode[]
}

// Build a valid HTML comment so multi-document markdown bundles can carry invisible file labels without changing the visible rendering.
export function buildMarkdownHtmlComment(label: string) {
  const safeLabel = label.replace(/--/g, '- -').trim()
  return `<!-- ${safeLabel} -->`
}

// Remove markdown HTML comment nodes from the render tree so metadata markers do not appear in preview or exported PDF output.
export function stripMarkdownHtmlComments() {
  return (tree: MarkdownCommentNode) => {
    const prune = (node: MarkdownCommentNode) => {
      if (!Array.isArray(node.children) || node.children.length === 0) {
        return
      }

      node.children = node.children.filter((child) => {
        const isHtmlComment =
          child.type === 'html' &&
          typeof child.value === 'string' &&
          /^<!--[\s\S]*-->$/.test(child.value.trim())

        if (!isHtmlComment) {
          prune(child)
        }

        return !isHtmlComment
      })
    }

    prune(tree)
  }
}
