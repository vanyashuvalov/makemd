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
        color: 'rgba(255, 255, 255, 0.38)',
      },
      '.cm-gutterElement': {
        paddingRight: '12px',
        textAlign: 'right',
        fontVariantNumeric: 'tabular-nums',
      },
      '.cm-lineNumbers .cm-gutterElement': {
        minWidth: '2.5rem',
      },
      '.cm-placeholder': {
        color: 'rgba(255, 255, 255, 0.42)',
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
        extensions={markdownEditorExtensions}
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
