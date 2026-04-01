/**
 * File: src/widgets/editor-preview/ui/markdown-editor.tsx
 * Purpose: CodeMirror-backed markdown input for the workspace editor surface.
 * Why it exists: the previous textarea + mirror implementation required manual line-height math and kept drifting on wrapped lines.
 * What it does: renders a stable CodeMirror 6 markdown editor with line numbers, wrapping, and a workspace theme that matches the rest of the shell.
 * Connected to: `EditorPreview`, the workspace markdown state in `WorkspaceShellClient`, and the preview renderer on the right.
 */
'use client'

import { useMemo } from 'react'
import CodeMirror, { EditorView, basicSetup } from '@uiw/react-codemirror'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { cn } from '@/shared/lib/cn'

const markdownEditorExtensions = [
  // Keep the editor focused on the markdown input task: line numbers, history, and wrapping matter here, while extra IDE chrome stays disabled.
  basicSetup({
    lineNumbers: true,
    foldGutter: false,
    highlightActiveLine: false,
    highlightActiveLineGutter: false,
    highlightSelectionMatches: false,
    dropCursor: false,
    rectangularSelection: false,
    crosshairCursor: false,
    bracketMatching: false,
    closeBrackets: false,
    autocompletion: false,
    searchKeymap: false,
    completionKeymap: false,
    lintKeymap: false,
  }),
  markdown({
    // Use the built-in GitHub-flavored markdown parser so the editor understands the same dialect as the preview surface.
    base: markdownLanguage,
  }),
  EditorView.lineWrapping,
]

const markdownSyntaxTheme = HighlightStyle.define([
  // Keep the editor's syntax colors expressive without changing the editor geometry, so wrapped lines and gutter metrics stay stable.
  { tag: [tags.heading1, tags.heading2, tags.heading3, tags.heading4, tags.heading5, tags.heading6], color: 'var(--color-syntax-heading)' },
  { tag: tags.strong, color: 'var(--color-syntax-strong)', fontWeight: '600' },
  { tag: tags.emphasis, color: 'var(--color-syntax-emphasis)', fontStyle: 'italic' },
  { tag: tags.link, color: 'var(--color-syntax-link)', textDecoration: 'underline', textDecorationColor: 'color-mix(in srgb, var(--color-syntax-link) 30%, transparent)', textDecorationThickness: '1px', textUnderlineOffset: '0.2em' },
  { tag: tags.url, color: 'color-mix(in srgb, var(--color-syntax-link) 70%, transparent)' },
  { tag: tags.list, color: 'var(--color-syntax-list)' },
  { tag: tags.quote, color: 'var(--color-syntax-quote)' },
  { tag: tags.monospace, color: 'var(--color-syntax-code)', backgroundColor: 'color-mix(in srgb, var(--color-syntax-code) 10%, transparent)', borderRadius: '0.375rem' },
  { tag: tags.processingInstruction, color: 'var(--color-syntax-marker)', fontWeight: '600' },
  { tag: tags.contentSeparator, color: 'color-mix(in srgb, var(--color-syntax-rule) 70%, transparent)' },
])

function createMarkdownEditorTheme(isMobile: boolean) {
  // Shape CodeMirror to the same neutral card language as the rest of the workspace and keep the line metrics deterministic.
  return EditorView.theme(
    {
      '&': {
        height: '100%',
        backgroundColor: 'transparent',
        color: 'var(--color-foreground)',
      },
      '.cm-scroller': {
        fontFamily: 'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace)',
        fontSize: '15px',
        lineHeight: '24px',
      },
      '.cm-content': {
        caretColor: 'var(--color-foreground)',
        padding: isMobile ? '32px 16px 96px 12px' : '32px 24px 96px 16px',
      },
      '.cm-gutters': {
        backgroundColor: 'transparent',
        border: 'none',
        color: 'var(--color-muted-foreground)',
      },
      '.cm-gutterElement': {
        paddingRight: '12px',
        textAlign: 'right',
        fontVariantNumeric: 'tabular-nums',
      },
      '.cm-lineNumbers .cm-gutterElement': {
        minWidth: '2.5rem',
        opacity: '0.6',
      },
      '.cm-placeholder': {
        color: 'var(--color-muted-foreground)',
      },
      '.cm-cursor, .cm-dropCursor': {
        borderLeftColor: 'var(--color-foreground)',
      },
      '.cm-activeLineGutter, .cm-activeLine': {
        backgroundColor: 'transparent',
      },
    },
    {
      dark: false,
    }
  )
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  mobile = false,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  mobile?: boolean
}) {
  const theme = useMemo(() => createMarkdownEditorTheme(mobile), [mobile])

  // Keep the editor itself lightweight and controlled by the surrounding workspace state so the shell owns all persistence and preview sync.
  return (
    <div className={cn('h-full min-h-0 w-full')}>
      <CodeMirror
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        extensions={[...markdownEditorExtensions, syntaxHighlighting(markdownSyntaxTheme)]}
        basicSetup={false}
        theme={theme}
        height="100%"
        minHeight="100%"
        width="100%"
        className="h-full w-full"
      />
    </div>
  )
}
