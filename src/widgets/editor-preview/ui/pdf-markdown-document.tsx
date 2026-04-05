/**
 * File: src/widgets/editor-preview/ui/pdf-markdown-document.tsx
 * Purpose: Standalone HTML document for server-side PDF generation.
 * Why it exists: the workspace needs a real print-ready representation of markdown that does not depend on the on-screen preview DOM or canvas screenshots.
 * What it does: renders markdown into semantic HTML with inline print-friendly styles so Chromium can export selectable, paginated text.
 * Connected to: the PDF export route, the document actions helper, and the shared markdown theme tokens.
 */

import { Children, isValidElement, type CSSProperties, type ReactElement, type ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { stripMarkdownHtmlComments } from '@/shared/lib/markdown-comments'
import { defaultPdfPreviewTheme, type PdfPreviewTheme } from '../model/pdf-theme'

export interface PdfMarkdownDocumentProps {
  title: string
  markdown: string
  theme?: PdfPreviewTheme
}

// Build an inline-style markdown component map so the server-rendered PDF stays independent from Tailwind and mirrors the document semantics we already use in the live preview.
function createPdfMarkdownComponents(theme: PdfPreviewTheme): Components {
  const textStyle: CSSProperties = {
    color: theme.foreground,
    overflowWrap: 'anywhere',
    wordBreak: 'break-word',
  }

  const headingStyle = (fontSize: string, lineHeight: string, marginTop: string): CSSProperties => ({
    ...textStyle,
    marginTop,
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    fontWeight: 600,
    letterSpacing: '-0.04em',
    lineHeight,
    fontSize,
  })

  const blockCodeStyle: CSSProperties = {
    color: theme.codeForeground,
    backgroundColor: theme.codeBackground,
    border: `1px solid ${theme.border}`,
    borderRadius: '14px',
    display: 'block',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: '0.95rem',
    lineHeight: '1.6',
    margin: 0,
    padding: '0.875rem 1rem',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
    wordBreak: 'break-word',
  }

  // Keep the component tree semantically rich while replacing browser-only scrolling affordances with print-safe wrapping rules.
  return {
    h1: ({ children, ...props }) => (
      <h1 {...props} style={headingStyle('3.5rem', '1.1', '0')}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2 {...props} style={headingStyle('2.25rem', '1.15', '1.5rem')}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3 {...props} style={headingStyle('1.5rem', '1.2', '1.25rem')}>
        {children}
      </h3>
    ),
    h4: ({ children, ...props }) => (
      <h4 {...props} style={headingStyle('1.25rem', '1.25', '1rem')}>
        {children}
      </h4>
    ),
    h5: ({ children, ...props }) => (
      <h5 {...props} style={headingStyle('1.1rem', '1.25', '1rem')}>
        {children}
      </h5>
    ),
    h6: ({ children, ...props }) => (
      <h6 {...props} style={headingStyle('1rem', '1.25', '1rem')}>
        {children}
      </h6>
    ),
    p: ({ children, ...props }) => (
      <p
        {...props}
        style={{
          ...textStyle,
          margin: '0 0 0.85rem',
          fontSize: '0.95rem',
          lineHeight: '1.75',
        }}
      >
        {children}
      </p>
    ),
    strong: ({ children, ...props }) => (
      <strong {...props} style={{ ...textStyle, fontWeight: 600 }}>
        {children}
      </strong>
    ),
    em: ({ children, ...props }) => (
      <em {...props} style={{ ...textStyle, fontStyle: 'italic' }}>
        {children}
      </em>
    ),
    del: ({ children, ...props }) => (
      <del
        {...props}
        style={{
          ...textStyle,
          textDecorationLine: 'line-through',
          textDecorationColor: theme.mutedForeground,
        }}
      >
        {children}
      </del>
    ),
    a: ({ children, href, ...props }) => (
      <a
        {...props}
        href={href}
        style={{
          ...textStyle,
          color: theme.link,
          textDecorationLine: 'underline',
          textUnderlineOffset: '0.2em',
          textDecorationColor: theme.linkDecoration,
        }}
        target={href?.startsWith('http') ? '_blank' : undefined}
        rel={href?.startsWith('http') ? 'noreferrer noopener' : undefined}
      >
        {children}
      </a>
    ),
    blockquote: ({ children, ...props }) => (
      <blockquote
        {...props}
        style={{
          ...textStyle,
          margin: '1rem 0',
          paddingLeft: '1rem',
          borderLeft: `2px solid ${theme.quoteBorder}`,
          breakInside: 'avoid',
          pageBreakInside: 'avoid',
        }}
      >
        {children}
      </blockquote>
    ),
    ul: ({ children, ...props }) => (
      <ul
        {...props}
        style={{
          ...textStyle,
          margin: '0 0 0.85rem',
          paddingLeft: '1.5rem',
          fontSize: '0.95rem',
          lineHeight: '1.75',
        }}
      >
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol
        {...props}
        style={{
          ...textStyle,
          margin: '0 0 0.85rem',
          paddingLeft: '1.5rem',
          fontSize: '0.95rem',
          lineHeight: '1.75',
        }}
      >
        {children}
      </ol>
    ),
    li: ({ children, className, ...props }) => {
      const isTaskListItem = typeof className === 'string' && className.includes('task-list-item')

      return (
        <li
          {...props}
          style={{
            ...textStyle,
            marginBottom: '0.35rem',
            pageBreakInside: 'avoid',
            breakInside: 'avoid',
            listStyleType: isTaskListItem ? 'none' : undefined,
            display: isTaskListItem ? 'flex' : undefined,
            alignItems: isTaskListItem ? 'flex-start' : undefined,
            gap: isTaskListItem ? '0.5rem' : undefined,
            paddingLeft: isTaskListItem ? 0 : undefined,
          }}
        >
          {children}
        </li>
      )
    },
    table: ({ children, ...props }) => (
      <div
        style={{
          margin: '1rem 0',
          overflow: 'hidden',
          breakInside: 'avoid',
          pageBreakInside: 'avoid',
        }}
      >
        <table
          {...props}
          style={{
            width: '100%',
            tableLayout: 'fixed',
            borderCollapse: 'collapse',
            fontSize: '0.9rem',
            color: theme.foreground,
          }}
        >
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }) => (
      <thead {...props} style={{ backgroundColor: theme.tableHeaderBackground }}>
        {children}
      </thead>
    ),
    tbody: ({ children, ...props }) => <tbody {...props}>{children}</tbody>,
    tr: ({ children, ...props }) => (
      <tr {...props} style={{ borderBottom: `1px solid ${theme.border}` }}>
        {children}
      </tr>
    ),
    th: ({ children, ...props }) => (
      <th
        {...props}
        style={{
          border: `1px solid ${theme.border}`,
          padding: '0.55rem 0.75rem',
          textAlign: 'left',
          fontWeight: 600,
          verticalAlign: 'top',
          overflowWrap: 'anywhere',
          wordBreak: 'break-word',
          color: theme.foreground,
        }}
      >
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td
        {...props}
        style={{
          border: `1px solid ${theme.border}`,
          padding: '0.55rem 0.75rem',
          verticalAlign: 'top',
          overflowWrap: 'anywhere',
          wordBreak: 'break-word',
          color: theme.foreground,
        }}
      >
        {children}
      </td>
    ),
    hr: ({ ...props }) => (
      <hr
        {...props}
        style={{
          border: 0,
          borderTop: `1px solid ${theme.border}`,
          margin: '1rem 0',
        }}
      />
    ),
    code: ({ className, children, ...props }) => {
      const codeText = String(children).replace(/\n$/, '')
      const isBlock = Boolean(className?.includes('language-')) || codeText.includes('\n')

      if (!isBlock) {
        return (
          <code
            {...props}
            style={{
              ...textStyle,
              backgroundColor: theme.codeBackground,
              color: theme.codeForeground,
              border: `1px solid ${theme.border}`,
              borderRadius: '0.4rem',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: '0.95em',
              padding: '0.1rem 0.35rem',
            }}
          >
            {children}
          </code>
        )
      }

      return (
        <code {...props} style={blockCodeStyle}>
          {children}
        </code>
      )
    },
    pre: ({ children, ...props }) => {
      // Preserve fenced code blocks as a wrapped monospaced block so long lines stay readable on the printed page instead of forcing horizontal scrolling.
      const child = Children.only(children) as ReactElement<{ className?: string; children?: ReactNode }>

      if (isValidElement(child)) {
        const codeClassName = typeof child.props.className === 'string' ? child.props.className : ''
        const codeLanguageMatch = /language-([\w-]+)/.exec(codeClassName)

        if (codeLanguageMatch) {
          const codeLanguage = codeLanguageMatch[1]

          return (
            <div
              style={{
                margin: '1rem 0',
                border: `1px solid ${theme.border}`,
                borderRadius: '14px',
                backgroundColor: theme.surface,
                breakInside: 'avoid',
                pageBreakInside: 'avoid',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '0.75rem 1rem 0' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    border: `1px solid ${theme.border}`,
                    borderRadius: '9999px',
                    padding: '0.2rem 0.55rem',
                    fontSize: '0.72rem',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: theme.mutedForeground,
                    backgroundColor: theme.background,
                  }}
                >
                  {codeLanguage}
                </span>
              </div>

              <div style={{ padding: '0.75rem 1rem 1rem' }}>
                <code
                  style={{
                    ...blockCodeStyle,
                    border: 0,
                    padding: 0,
                    backgroundColor: 'transparent',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {child.props.children}
                </code>
              </div>
            </div>
          )
        }
      }

      return (
        <pre
          {...props}
          style={{
            margin: '1rem 0',
            borderRadius: '14px',
            border: `1px solid ${theme.border}`,
            backgroundColor: theme.surface,
            padding: 0,
            overflow: 'hidden',
            breakInside: 'avoid',
            pageBreakInside: 'avoid',
          }}
        >
          {children}
        </pre>
      )
    },
    input: ({ checked }) => (
      <span
        aria-hidden="true"
        style={{
          display: 'inline-flex',
          width: '1rem',
          height: '1rem',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: '0.15rem',
          border: `1px solid ${theme.foreground}`,
          borderRadius: '0.25rem',
          backgroundColor: checked ? theme.foreground : 'transparent',
          color: checked ? theme.background : theme.foreground,
          fontSize: '0.7rem',
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        {checked ? '✓' : ''}
      </span>
    ),
    img: ({ alt, src, ...props }) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        {...props}
        alt={alt ?? ''}
        crossOrigin="anonymous"
        decoding="async"
        loading="eager"
        src={src}
        style={{
          display: 'block',
          maxWidth: '100%',
          height: 'auto',
          margin: '1rem 0',
          border: `1px solid ${theme.border}`,
          borderRadius: '14px',
          pageBreakInside: 'avoid',
          breakInside: 'avoid',
        }}
      />
    ),
  }
}

// Compose the final print-ready document wrapper so the PDF route can render the markdown as a complete HTML page instead of a DOM fragment.
export function PdfMarkdownDocument({ title, markdown, theme = defaultPdfPreviewTheme }: PdfMarkdownDocumentProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <style>{`
          @page {
            size: A4 portrait;
            margin: 18mm 16mm 20mm;
          }

          html,
          body {
            margin: 0;
            padding: 0;
            background: ${theme.background};
            color: ${theme.foreground};
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          body {
            font-family: ui-sans-serif, system-ui, sans-serif;
          }
        `}</style>
      </head>
      <body>
        <main style={{ minHeight: '100vh', backgroundColor: theme.background }}>
          <article style={{ maxWidth: '43rem', margin: '0 auto' }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm, stripMarkdownHtmlComments]}
              components={createPdfMarkdownComponents(theme)}
            >
              {markdown}
            </ReactMarkdown>
          </article>
        </main>
      </body>
    </html>
  )
}
