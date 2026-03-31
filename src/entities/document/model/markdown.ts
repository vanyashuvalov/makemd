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
      tone: 'heading' | 'list' | 'quote' | 'rule' | 'task' | 'strong' | 'emphasis' | 'code' | 'link' | 'image'
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
  | {
      type: 'strike'
      value: string
    }
  | {
      type: 'linkText'
      value: string
    }
  | {
      type: 'linkUrl'
      value: string
    }
  | {
      type: 'url'
      value: string
    }
  | {
      type: 'imageAlt'
      value: string
    }
  | {
      type: 'imageUrl'
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
  const pattern =
    /(!?\[[^\]]+\]\([^)]+\)|~~[^~]+~~|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|https?:\/\/[^\s<]+|www\.[^\s<]+)/g

  let cursor = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) {
      tokens.push({ type: 'text', value: text.slice(cursor, match.index) })
    }

    const part = match[0]

    if (part.startsWith('![')) {
      const imageMatch = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(part)

      if (imageMatch) {
        tokens.push(
          { type: 'marker', value: '![', tone: 'image' },
          { type: 'imageAlt', value: imageMatch[1] },
          { type: 'marker', value: '](', tone: 'image' },
          { type: 'imageUrl', value: imageMatch[2] },
          { type: 'marker', value: ')', tone: 'image' }
        )
      } else {
        tokens.push({ type: 'text', value: part })
      }

      cursor = pattern.lastIndex
      continue
    }

    if (part.startsWith('[')) {
      const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part)

      if (linkMatch) {
        tokens.push(
          { type: 'marker', value: '[', tone: 'link' },
          { type: 'linkText', value: linkMatch[1] },
          { type: 'marker', value: '](', tone: 'link' },
          { type: 'linkUrl', value: linkMatch[2] },
          { type: 'marker', value: ')', tone: 'link' }
        )
      } else {
        tokens.push({ type: 'text', value: part })
      }

      cursor = pattern.lastIndex
      continue
    }

    if (part.startsWith('~~') && part.endsWith('~~')) {
      tokens.push(
        { type: 'marker', value: '~~', tone: 'strong' },
        { type: 'strike', value: part.slice(2, -2) },
        { type: 'marker', value: '~~', tone: 'strong' }
      )
      cursor = pattern.lastIndex
      continue
    }

    if (part.startsWith('**') && part.endsWith('**')) {
      tokens.push(
        { type: 'marker', value: '**', tone: 'strong' },
        { type: 'strong', value: part.slice(2, -2) },
        { type: 'marker', value: '**', tone: 'strong' }
      )
      cursor = pattern.lastIndex
      continue
    }

    if (part.startsWith('*') && part.endsWith('*')) {
      tokens.push(
        { type: 'marker', value: '*', tone: 'emphasis' },
        { type: 'emphasis', value: part.slice(1, -1) },
        { type: 'marker', value: '*', tone: 'emphasis' }
      )
      cursor = pattern.lastIndex
      continue
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      tokens.push(
        { type: 'marker', value: '`', tone: 'code' },
        { type: 'code', value: part.slice(1, -1) },
        { type: 'marker', value: '`', tone: 'code' }
      )
      cursor = pattern.lastIndex
      continue
    }

    if (/^(https?:\/\/[^\s<]+|www\.[^\s<]+)$/.test(part)) {
      tokens.push({ type: 'url', value: part })
      cursor = pattern.lastIndex
      continue
    }

    tokens.push({ type: 'text', value: part })
    cursor = pattern.lastIndex
  }

  if (cursor < text.length) {
    tokens.push({ type: 'text', value: text.slice(cursor) })
  }

  return tokens
}

export function tokenizeMarkdownLine(line: string): MarkdownSyntaxToken[] {
  // Convert a single markdown source line into highlighted tokens so the editor can render a VS Code-style mirror behind the textarea.
  const trimmedLine = line.trim()

  if (!trimmedLine) {
    return [{ type: 'text', value: '\u00a0' }]
  }

  if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmedLine)) {
    return [{ type: 'marker', value: trimmedLine, tone: 'rule' }]
  }

  const codeFenceMatch = /^(\s*)(`{3,}|~{3,})(.*)$/.exec(line)
  if (codeFenceMatch) {
    const fenceSuffixTokens = codeFenceMatch[3]
      ? ([{ type: 'text', value: codeFenceMatch[3] }] as MarkdownSyntaxToken[])
      : []

    return [
      { type: 'text', value: codeFenceMatch[1] },
      { type: 'marker', value: codeFenceMatch[2], tone: 'code' },
      ...fenceSuffixTokens,
    ]
  }

  const headingMatch = /^(#{1,6})(\s+)(.*)$/.exec(line)
  if (headingMatch) {
    return [
      { type: 'marker', value: headingMatch[1], tone: 'heading' },
      { type: 'text', value: headingMatch[2] },
      ...tokenizeMarkdownInline(headingMatch[3]),
    ]
  }

  const blockquoteMatch = /^(>\s?)(.*)$/.exec(line)
  if (blockquoteMatch) {
    return [
      { type: 'marker', value: '>', tone: 'quote' },
      { type: 'text', value: blockquoteMatch[1].slice(1) },
      ...tokenizeMarkdownInline(blockquoteMatch[2]),
    ]
  }

  const taskListMatch = /^(\s*)([-+*])(\s+)\[( |x|X)\](\s+)(.*)$/.exec(line)
  if (taskListMatch) {
    return [
      { type: 'text', value: taskListMatch[1] },
      { type: 'marker', value: taskListMatch[2], tone: 'list' },
      { type: 'text', value: taskListMatch[3] },
      { type: 'marker', value: `[${taskListMatch[4].toLowerCase()}]`, tone: 'task' },
      { type: 'text', value: taskListMatch[5] },
      ...tokenizeMarkdownInline(taskListMatch[6]),
    ]
  }

  const unorderedListMatch = /^(\s*)([-+*])(\s+)(.*)$/.exec(line)
  if (unorderedListMatch) {
    return [
      { type: 'text', value: unorderedListMatch[1] },
      { type: 'marker', value: unorderedListMatch[2], tone: 'list' },
      { type: 'text', value: unorderedListMatch[3] },
      ...tokenizeMarkdownInline(unorderedListMatch[4]),
    ]
  }

  const orderedListMatch = /^(\s*)(\d+[.)])(\s+)(.*)$/.exec(line)
  if (orderedListMatch) {
    return [
      { type: 'text', value: orderedListMatch[1] },
      { type: 'marker', value: orderedListMatch[2], tone: 'list' },
      { type: 'text', value: orderedListMatch[3] },
      ...tokenizeMarkdownInline(orderedListMatch[4]),
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
