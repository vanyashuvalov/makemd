/**
 * File: src/entities/document/model/markdown.ts
 * Purpose: Markdown parsing helpers for the workspace editor and preview.
 * Why it exists: the editor now stores the markdown source as a single string, and the preview needs block-level structure derived from it.
 * What it does: converts markdown into a lightweight block model and exposes helpers for title derivation and line counting.
 * Connected to: `WorkspaceSnapshot`, the editor textarea, the preview renderer, and export naming.
 */
export type MarkdownBlock =
  | {
      id: string
      type: 'heading'
      level: 1 | 2 | 3 | 4 | 5 | 6
      text: string
    }
  | {
      id: string
      type: 'paragraph'
      text: string
    }
  | {
      id: string
      type: 'divider'
    }

function createBlockId(prefix: string, index: number) {
  // Build a stable local identifier for a parsed markdown block so preview rendering can key rows consistently.
  return `${prefix}-${index}`
}

export function getMarkdownLineCount(markdown: string) {
  // Count visible lines in the editor so the gutter can mirror the VS Code-style line numbering.
  return Math.max(1, markdown.replace(/\r\n/g, '\n').split('\n').length)
}

export function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
  const normalized = markdown.replace(/\r\n/g, '\n')
  const lines = normalized.split('\n')
  const blocks: MarkdownBlock[] = []
  const paragraphBuffer: string[] = []

  const flushParagraph = () => {
    // Collapse consecutive prose lines into one paragraph block so the preview reads like a document, not a raw text dump.
    if (!paragraphBuffer.length) {
      return
    }

    blocks.push({
      id: createBlockId('paragraph', blocks.length),
      type: 'paragraph',
      text: paragraphBuffer.join('\n'),
    })
    paragraphBuffer.length = 0
  }

  for (const rawLine of lines) {
    const trimmedLine = rawLine.trim()

    if (!trimmedLine) {
      flushParagraph()
      continue
    }

    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(trimmedLine)
    if (headingMatch) {
      flushParagraph()
      blocks.push({
        id: createBlockId('heading', blocks.length),
        type: 'heading',
        level: headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6,
        text: headingMatch[2],
      })
      continue
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmedLine)) {
      flushParagraph()
      blocks.push({
        id: createBlockId('divider', blocks.length),
        type: 'divider',
      })
      continue
    }

    paragraphBuffer.push(rawLine.trimEnd())
  }

  flushParagraph()

  return blocks
}

export function getMarkdownTitle(markdown: string, fallback: string) {
  // Reuse the first level-one heading as the document title when one is available, otherwise fall back to the supplied label.
  const blocks = parseMarkdownBlocks(markdown)
  const h1 = blocks.find((block) => block.type === 'heading' && block.level === 1)

  return h1 && h1.type === 'heading' ? h1.text.trim() || fallback : fallback
}
