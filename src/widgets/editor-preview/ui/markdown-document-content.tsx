import {
  Children,
  isValidElement,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react'
import ReactMarkdown, { defaultUrlTransform, type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { stripMarkdownHtmlComments } from '@/shared/lib/markdown-comments'
import {
  containsTaskCheckboxNode,
  hasTaskListContainerClassName,
  hasTaskListItemClassName,
} from '@/shared/lib/markdown-task-list'
import { TaskCheckbox } from '@/shared/ui/task-checkbox'
import { type PdfPreviewTheme } from '../model/pdf-theme'

import { normalizePdfOptions, type PdfOptions } from '../model/pdf-options'
import { getDocumentTheme } from '../model/pdf-theme'

const pdfSansFontFamily = `var(--document-font, "Inter", ui-sans-serif, system-ui, sans-serif)`
const pdfMonoFontFamily = `var(--document-mono, ui-monospace, SFMono-Regular, monospace)`

// Build an inline-style markdown component map so the server-rendered PDF stays independent from Tailwind and mirrors the document semantics we already use in the live preview.
function createPdfMarkdownComponents(theme: PdfPreviewTheme): Components {
  const textStyle: CSSProperties = {
    color: theme.foreground,
    overflowWrap: 'anywhere',
    wordBreak: 'break-word',
  }

  const headingStyle = (
    fontSize: string,
    lineHeight: string,
    marginTop: string
  ): CSSProperties => ({
    ...textStyle,
    marginTop,
    marginBottom: 'calc(var(--document-unit, 16px) * 0.65)',
    color: theme.accent ?? theme.foreground,
    breakAfter: 'avoid-page',
    pageBreakAfter: 'avoid',
    fontFamily: pdfSansFontFamily,
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
    fontFamily: pdfMonoFontFamily,
    fontSize: 'calc(var(--document-unit, 16px) * 0.95)',
    lineHeight: '1.6',
    margin: 0,
    padding:
      'calc(var(--document-unit, 16px) * 0.875) calc(var(--document-unit, 16px) * 1)',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
    wordBreak: 'break-word',
  }

  // Keep the component tree semantically rich while replacing browser-only scrolling affordances with print-safe wrapping rules.
  return {
    h1: ({ children, ...props }) => (
      <h1
        {...props}
        style={headingStyle(
          'calc(var(--document-unit, 16px) * 2.6)',
          '1.1',
          '0'
        )}
      >
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2
        {...props}
        style={headingStyle(
          'calc(var(--document-unit, 16px) * 1.9)',
          '1.15',
          'calc(var(--document-unit, 16px) * 1.5)'
        )}
      >
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3
        {...props}
        style={headingStyle(
          'calc(var(--document-unit, 16px) * 1.5)',
          '1.2',
          'calc(var(--document-unit, 16px) * 1.25)'
        )}
      >
        {children}
      </h3>
    ),
    h4: ({ children, ...props }) => (
      <h4
        {...props}
        style={headingStyle(
          'calc(var(--document-unit, 16px) * 1.25)',
          '1.25',
          'calc(var(--document-unit, 16px) * 1)'
        )}
      >
        {children}
      </h4>
    ),
    h5: ({ children, ...props }) => (
      <h5
        {...props}
        style={headingStyle(
          'calc(var(--document-unit, 16px) * 1.1)',
          '1.25',
          'calc(var(--document-unit, 16px) * 1)'
        )}
      >
        {children}
      </h5>
    ),
    h6: ({ children, ...props }) => (
      <h6
        {...props}
        style={headingStyle(
          'calc(var(--document-unit, 16px) * 1)',
          '1.25',
          'calc(var(--document-unit, 16px) * 1)'
        )}
      >
        {children}
      </h6>
    ),
    p: ({ children, ...props }) => (
      <p
        {...props}
        style={{
          ...textStyle,
          margin: '0 0 calc(var(--document-unit, 16px) * 0.85)',
          fontSize: 'calc(var(--document-unit, 16px) * 0.95)',
          lineHeight: 'var(--document-leading, 1.75)',
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
          textDecorationThickness: '1px',
          textDecorationSkipInk: 'none',
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
          textDecorationThickness: '1px',
          textDecorationSkipInk: 'none',
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
          margin: 'calc(var(--document-unit, 16px) * 1) 0',
          paddingLeft: 'calc(var(--document-unit, 16px) * 1)',
          borderLeft: `2px solid ${theme.quoteBorder}`,
          breakInside: 'avoid',
          pageBreakInside: 'avoid',
        }}
      >
        {children}
      </blockquote>
    ),
    ul: ({ children, className, ...props }) => {
      const isTaskList =
        hasTaskListContainerClassName(className) ||
        containsTaskCheckboxNode(children)

      return (
        <ul
          {...props}
          style={{
            ...textStyle,
            margin: '0 0 calc(var(--document-unit, 16px) * 0.85)',
            marginLeft: 0,
            paddingLeft: isTaskList
              ? 0
              : 'calc(var(--document-unit, 16px) * 1.25)',
            fontSize: 'calc(var(--document-unit, 16px) * 0.95)',
            lineHeight: 'var(--document-leading, 1.75)',
            listStyleType: isTaskList ? 'none' : 'disc',
          }}
        >
          {children}
        </ul>
      )
    },
    ol: ({ children, ...props }) => (
      <ol
        {...props}
        style={{
          ...textStyle,
          margin: '0 0 calc(var(--document-unit, 16px) * 0.85)',
          paddingLeft: 'calc(var(--document-unit, 16px) * 1.25)',
          listStyleType: 'decimal',
          fontSize: 'calc(var(--document-unit, 16px) * 0.95)',
          lineHeight: 'var(--document-leading, 1.75)',
        }}
      >
        {children}
      </ol>
    ),
    li: ({ children, className, ...props }) => {
      // Flatten task list items based on the remark-gfm marker or the rendered checkbox primitive so the PDF keeps the same marker geometry as the live preview.
      const isTaskListItem =
        hasTaskListItemClassName(className) ||
        containsTaskCheckboxNode(children)

      return (
        <li
          {...props}
          style={{
            ...textStyle,
            marginBottom: 'calc(var(--document-unit, 16px) * 0.25)',
            pageBreakInside: 'avoid',
            breakInside: 'avoid',
            listStyleType: isTaskListItem ? 'none' : undefined,
            display: isTaskListItem ? 'flex' : undefined,
            alignItems: isTaskListItem ? 'center' : undefined,
            gap: isTaskListItem
              ? 'calc(var(--document-unit, 16px) * 0.4)'
              : undefined,
            paddingLeft: isTaskListItem ? 0 : undefined,
            marginLeft: isTaskListItem ? 0 : undefined,
          }}
        >
          {children}
        </li>
      )
    },
    table: ({ children, ...props }) => (
      <div
        style={{
          margin: 'calc(var(--document-unit, 16px) * 1) 0',
          overflow: 'visible',
        }}
      >
        <table
          {...props}
          style={{
            width: '100%',
            tableLayout: 'fixed',
            borderCollapse: 'collapse',
            fontSize: 'calc(var(--document-unit, 16px) * 0.9)',
            color: theme.foreground,
          }}
        >
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }) => (
      <thead
        {...props}
        style={{
          display: 'table-header-group',
          backgroundColor: theme.tableHeaderBackground,
        }}
      >
        {children}
      </thead>
    ),
    tbody: ({ children, ...props }) => <tbody {...props}>{children}</tbody>,
    tr: ({ children, ...props }) => (
      <tr
        {...props}
        style={{
          borderBottom: `0.75pt solid ${theme.border}`,
          breakInside: 'avoid',
          pageBreakInside: 'avoid',
        }}
      >
        {children}
      </tr>
    ),
    th: ({ children, ...props }) => (
      <th
        {...props}
        style={{
          border: `0.75pt solid ${theme.border}`,
          padding:
            'calc(var(--document-unit, 16px) * 0.55) calc(var(--document-unit, 16px) * 0.75)',
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
          border: `0.75pt solid ${theme.border}`,
          padding:
            'calc(var(--document-unit, 16px) * 0.55) calc(var(--document-unit, 16px) * 0.75)',
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
          margin: 'calc(var(--document-unit, 16px) * 1) 0',
        }}
      />
    ),
    code: ({ className, children, ...props }) => {
      const codeText = String(children).replace(/\n$/, '')
      const isBlock =
        Boolean(className?.includes('language-')) || codeText.includes('\n')

      if (!isBlock) {
        return (
          <code
            {...props}
            style={{
              ...textStyle,
              backgroundColor: theme.codeBackground,
              color: theme.codeForeground,
              border: `1px solid ${theme.border}`,
              borderRadius: 'calc(var(--document-unit, 16px) * 0.4)',
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: '0.95em',
              padding:
                'calc(var(--document-unit, 16px) * 0.1) calc(var(--document-unit, 16px) * 0.35)',
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
      const child = Children.only(children) as ReactElement<{
        children?: ReactNode
      }>
      return (
        <pre
          {...props}
          style={{
            margin: 'calc(var(--document-unit, 16px) * 1) 0',
            borderRadius: '8px',
            backgroundColor: theme.codeBackground,
            padding: 'calc(var(--document-unit, 16px) * 1)',
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
            breakInside: 'auto',
            fontFamily: pdfMonoFontFamily,
            fontSize: 'calc(var(--document-unit, 16px) * 0.85)',
            lineHeight: 1.6,
          }}
        >
          <code style={{ fontFamily: 'inherit' }}>
            {isValidElement(child) ? child.props.children : children}
          </code>
        </pre>
      )
    },
    input: ({ checked }) => (
      <TaskCheckbox
        checked={Boolean(checked)}
        className="mt-[calc(var(--document-unit, 16px) * 0.15)]"
        fillColor={checked ? theme.taskMarkerBackground : theme.background}
        borderColor={checked ? theme.taskMarkerBorder : theme.foreground}
        checkColor={theme.taskMarkerForeground}
      />
    ),
    img: ({ alt, src, ...props }) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        {...props}
        alt={alt ?? ''}
        decoding="sync"
        loading="eager"
        src={src || undefined}
        style={{
          display: 'block',
          maxWidth: '100%',
          height: 'auto',
          margin: 'calc(var(--document-unit, 16px) * 1) 0',
          pageBreakInside: 'avoid',
          breakInside: 'avoid',
        }}
      />
    ),
  }
}

export const documentFonts = {
  sans: '"MakeMD Sans", "Inter", sans-serif',
  serif: '"MakeMD Serif", Georgia, serif',
  mono: '"MakeMD Mono", monospace',
} as const

export function MarkdownDocumentContent({
  markdown,
  options,
  theme,
}: {
  markdown: string
  options?: PdfOptions
  theme?: PdfPreviewTheme
}) {
  const settings = normalizePdfOptions(options)
  const colors = theme ?? getDocumentTheme(settings)
  const baseSize = { small: 14, normal: 16, large: 18 }[settings.textSize]
  return (
    <article
      className="document-content"
      style={
        {
          '--document-unit': `${baseSize}px`,
          '--document-font': documentFonts[settings.font],
          '--document-mono': documentFonts.mono,
          '--document-leading': settings.spacing === 'compact' ? '1.5' : '1.8',
          fontFamily: documentFonts[settings.font],
          fontSize: baseSize,
          color: colors.foreground,
          backgroundColor: colors.background,
          overflowWrap: 'anywhere',
        } as CSSProperties
      }
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, stripMarkdownHtmlComments]}
        urlTransform={(url, key, node) => node.tagName === 'img' && key === 'src' && /^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(url) ? url : defaultUrlTransform(url)}
        components={createPdfMarkdownComponents(colors)}
      >
        {markdown}
      </ReactMarkdown>
    </article>
  )
}
