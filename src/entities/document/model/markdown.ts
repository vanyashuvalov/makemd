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

export type MarkdownSyntaxToken =
  | {
      type: 'text'
      value: string
    }
  | {
      type: 'marker'
      value: string
    }
  | {
      type: 'strong'
      value: string
    }
  | {
      type: 'emphasis'
      value: string
    }
  | {
      type: 'code'
      value: string
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

export function tokenizeMarkdownInline(text: string): MarkdownSyntaxToken[] {
  // Split inline markdown into semantic tokens so both the editor highlighter and preview renderer can reuse the same parsing rules.
  const tokens: MarkdownSyntaxToken[] = []
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g
  const parts = text.split(pattern)

  parts.forEach((part) => {
    if (!part) {
      return
    }

    if (part.startsWith('**') && part.endsWith('**')) {
      tokens.push(
        { type: 'marker', value: '**' },
        { type: 'strong', value: part.slice(2, -2) },
        { type: 'marker', value: '**' }
      )
      return
    }

    if (part.startsWith('*') && part.endsWith('*')) {
      tokens.push(
        { type: 'marker', value: '*' },
        { type: 'emphasis', value: part.slice(1, -1) },
        { type: 'marker', value: '*' }
      )
      return
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      tokens.push(
        { type: 'marker', value: '`' },
        { type: 'code', value: part.slice(1, -1) },
        { type: 'marker', value: '`' }
      )
      return
    }

    tokens.push({ type: 'text', value: part })
  })

  return tokens
}

export function tokenizeMarkdownLine(line: string): MarkdownSyntaxToken[] {
  // Convert a single markdown source line into highlighted tokens so the editor can render a VS Code-style mirror behind the textarea.
  const trimmedLine = line.trim()

  if (!trimmedLine) {
    return [{ type: 'text', value: '\u00a0' }]
  }

  if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmedLine)) {
    return [{ type: 'marker', value: trimmedLine }]
  }

  const headingMatch = /^(#{1,6})(\s+)(.*)$/.exec(line)
  if (headingMatch) {
    return [
      { type: 'marker', value: headingMatch[1] },
      { type: 'text', value: headingMatch[2] },
      ...tokenizeMarkdownInline(headingMatch[3]),
    ]
  }

  return tokenizeMarkdownInline(line)
}

export function getMarkdownTitle(markdown: string, fallback: string) {
  // Reuse the first level-one heading as the document title when one is available, otherwise fall back to the supplied label.
  const blocks = parseMarkdownBlocks(markdown)
  const h1 = blocks.find((block) => block.type === 'heading' && block.level === 1)

  return h1 && h1.type === 'heading' ? h1.text.trim() || fallback : fallback
}
