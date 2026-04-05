/**
 * File: src/features/help/model/get-help-markdown.ts
 * Purpose: Server-side loader for the static Help markdown content.
 * Why it exists: the workspace needs one markdown source of truth for help copy, but the rendered UI should only receive the parsed text, not an editable source surface.
 * What it does: reads the help markdown file from disk and caches the result for reuse across requests.
 * Connected to: `src/app/page.tsx`, the workspace shell, and the Help modal feature.
 */
import { cache } from 'react'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const HELP_MARKDOWN_PATH = join(process.cwd(), 'src/features/help/model/help-content.md')

// Read the markdown once and reuse it so the server can hand the Help modal a ready-to-render string without repeating filesystem work.
export const getHelpMarkdown = cache(async () => readFile(HELP_MARKDOWN_PATH, 'utf8'))
