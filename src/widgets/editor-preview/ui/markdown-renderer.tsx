/**
 * File: src/widgets/editor-preview/ui/markdown-renderer.tsx
 * Purpose: CommonMark/GFM renderer for the right-hand preview surface.
 * Why it exists: the preview should understand the same markdown dialect the editor accepts, instead of reimplementing parsing by hand.
 * What it does: renders markdown through react-markdown with GFM support and applies the workspace visual system to every block type.
 * Connected to: `EditorPreview`, the markdown tokenizer shared with the source mirror, and the export-ready document preview.
 */
import { Children, isValidElement, type ReactElement, type ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/shared/lib/cn'
import { stripMarkdownHtmlComments } from '@/shared/lib/markdown-comments'
import { containsTaskCheckboxNode, hasTaskListContainerClassName, hasTaskListItemClassName } from '@/shared/lib/markdown-task-list'
import { TaskCheckbox } from '@/shared/ui/task-checkbox'
import { defaultPdfPreviewTheme, type PdfPreviewTheme } from '../model/pdf-theme'

function createMarkdownComponents(exportMode: boolean, theme: PdfPreviewTheme): Components {
  // Keep the render tree mostly identical between the on-screen preview and PDF export, but relax scroll-only wrappers in export mode so html2canvas can measure the document without clipped containers.
  return {
    h1: ({ children, ...props }) => (
      <h1
        {...props}
        className="mt-0 break-words font-sans text-[3.5rem] font-semibold tracking-[-0.05em] text-foreground [overflow-wrap:anywhere] first:mt-0"
      >
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2
        {...props}
        className="mt-6 break-words font-sans text-[2.25rem] font-semibold tracking-[-0.04em] text-foreground [overflow-wrap:anywhere]"
      >
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3
        {...props}
        className="mt-5 break-words font-sans text-[1.5rem] font-semibold tracking-[-0.03em] text-foreground [overflow-wrap:anywhere]"
      >
        {children}
      </h3>
    ),
    h4: ({ children, ...props }) => (
      <h4 {...props} className="mt-4 break-words font-sans text-[1.25rem] font-semibold text-foreground [overflow-wrap:anywhere]">
        {children}
      </h4>
    ),
    h5: ({ children, ...props }) => (
      <h5 {...props} className="mt-4 break-words font-sans text-[1.1rem] font-semibold text-foreground [overflow-wrap:anywhere]">
        {children}
      </h5>
    ),
    h6: ({ children, ...props }) => (
      <h6 {...props} className="mt-4 break-words font-sans text-[1rem] font-semibold text-foreground [overflow-wrap:anywhere]">
        {children}
      </h6>
    ),
    p: ({ children, ...props }) =>
      exportMode ? (
        <p
          {...props}
          className="page-break-avoid text-sm leading-7 break-words [overflow-wrap:anywhere]"
          style={{ color: theme.foreground, breakInside: 'avoid', pageBreakInside: 'avoid' }}
        >
          {children}
        </p>
      ) : (
        <p {...props} className="break-words text-sm leading-7 text-foreground [overflow-wrap:anywhere]">
          {children}
        </p>
      ),
    strong: ({ children, ...props }) =>
      exportMode ? (
        <strong {...props} className="font-semibold" style={{ color: theme.foreground }}>
          {children}
        </strong>
      ) : (
        <strong {...props} className="font-semibold text-foreground [overflow-wrap:anywhere]">
          {children}
        </strong>
      ),
    em: ({ children, ...props }) =>
      exportMode ? (
        <em {...props} className="italic" style={{ color: theme.foreground }}>
          {children}
        </em>
      ) : (
        <em {...props} className="italic text-foreground [overflow-wrap:anywhere]">
          {children}
        </em>
      ),
    del: ({ children, ...props }) =>
      exportMode ? (
        <del
          {...props}
          className="line-through"
          style={{
            color: theme.foreground,
            textDecorationColor: theme.mutedForeground,
            textDecorationThickness: '1px',
            textDecorationSkipInk: 'none',
          }}
        >
          {children}
        </del>
      ) : (
        <del {...props} className="text-foreground decoration-foreground/60 decoration-[1px] [overflow-wrap:anywhere]">
          {children}
        </del>
      ),
    a: ({ children, href, ...props }) =>
      exportMode ? (
        <a
          {...props}
          href={href}
          className="break-words underline underline-offset-4 [overflow-wrap:anywhere]"
          style={{
            color: theme.link,
            textDecorationColor: theme.linkDecoration,
            textDecorationThickness: '1px',
            textUnderlineOffset: '0.2em',
            textDecorationSkipInk: 'none',
          }}
          target={href?.startsWith('http') ? '_blank' : undefined}
          rel={href?.startsWith('http') ? 'noreferrer noopener' : undefined}
        >
          {children}
        </a>
      ) : (
        <a
          {...props}
          href={href}
          className="break-words text-sky-700 underline decoration-sky-700/40 decoration-[1px] underline-offset-4 transition-colors hover:text-sky-700/80 [overflow-wrap:anywhere]"
          target={href?.startsWith('http') ? '_blank' : undefined}
          rel={href?.startsWith('http') ? 'noreferrer noopener' : undefined}
        >
          {children}
        </a>
      ),
    blockquote: ({ children, ...props }) =>
      exportMode ? (
        <blockquote
          {...props}
          className="page-break-avoid break-words border-l-2 pl-4 [overflow-wrap:anywhere]"
          style={{ borderLeftColor: theme.quoteBorder, color: theme.foreground, breakInside: 'avoid', pageBreakInside: 'avoid' }}
        >
          {children}
        </blockquote>
      ) : (
        <blockquote
          {...props}
          className="border-l-2 border-border pl-4 text-foreground/90 break-words [overflow-wrap:anywhere]"
        >
          {children}
        </blockquote>
      ),
    ul: ({ children, className, ...props }) => {
      const isTaskList =
        hasTaskListContainerClassName(className) || containsTaskCheckboxNode(children)

      return exportMode ? (
        <ul
          {...props}
          className={cn(
            'my-0 space-y-2 text-sm leading-7 break-words [overflow-wrap:anywhere]',
            isTaskList ? 'list-none pl-0 ml-0' : 'list-disc pl-6'
          )}
          style={{ color: theme.foreground }}
        >
          {children}
        </ul>
      ) : (
        <ul
          {...props}
          className={cn(
            'my-0 space-y-2 text-sm leading-7 text-foreground break-words [overflow-wrap:anywhere]',
            isTaskList ? 'list-none pl-0 ml-0' : 'list-disc pl-6'
          )}
        >
          {children}
        </ul>
      )
    },
    ol: ({ children, ...props }) =>
      exportMode ? (
        <ol
          {...props}
          className="my-0 list-decimal space-y-2 pl-6 text-sm leading-7 break-words [overflow-wrap:anywhere]"
          style={{ color: theme.foreground }}
        >
          {children}
        </ol>
      ) : (
        <ol {...props} className="my-0 list-decimal space-y-2 pl-6 text-sm leading-7 text-foreground break-words [overflow-wrap:anywhere]">
          {children}
        </ol>
    ),
    li: ({ children, className, ...props }) => {
      // Flatten task list items based on the remark-gfm marker or the rendered checkbox primitive so the bullet marker and extra indent disappear together.
      const isTaskListItem = hasTaskListItemClassName(className) || containsTaskCheckboxNode(children)

      return (
        <li
          {...props}
          className={cn(
            'page-break-avoid break-words [overflow-wrap:anywhere]',
            isTaskListItem ? 'list-none flex items-start gap-2 pl-0 ml-0 leading-7 [&>p]:my-0' : 'pl-1'
          )}
          style={exportMode ? { color: theme.foreground, breakInside: 'avoid', pageBreakInside: 'avoid' } : undefined}
        >
          {children}
        </li>
      )
    },
    table: ({ children, ...props }) => (
      <div className="my-4 overflow-x-hidden">
        <table
          {...props}
          className="page-break-avoid w-full table-fixed border-collapse text-sm"
          style={
            exportMode
              ? { color: theme.foreground, borderColor: theme.border, breakInside: 'avoid', pageBreakInside: 'avoid' }
              : undefined
          }
        >
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }) =>
      exportMode ? (
        <thead {...props} style={{ backgroundColor: theme.tableHeaderBackground, color: theme.foreground }}>
          {children}
        </thead>
      ) : (
        <thead {...props} className="bg-muted text-foreground">
          {children}
        </thead>
      ),
    tbody: ({ children, ...props }) => (
      <tbody {...props} className={cn(!exportMode && 'divide-y divide-border')} style={exportMode ? { color: theme.foreground } : undefined}>
        {children}
      </tbody>
    ),
    tr: ({ children, ...props }) => (
      <tr {...props} className={!exportMode ? 'border-b border-border' : undefined} style={exportMode ? { borderBottom: `1px solid ${theme.border}` } : undefined}>
        {children}
      </tr>
    ),
    th: ({ children, ...props }) => (
      <th
        {...props}
        className={exportMode ? 'px-3 py-2 text-left font-semibold' : 'border border-border px-3 py-2 text-left font-semibold'}
        style={exportMode ? { border: `1px solid ${theme.border}`, color: theme.foreground, breakInside: 'avoid', pageBreakInside: 'avoid' } : undefined}
      >
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td
        {...props}
        className={
          exportMode
            ? 'page-break-avoid px-3 py-2 align-top break-words [overflow-wrap:anywhere]'
            : 'border border-border px-3 py-2 align-top break-words [overflow-wrap:anywhere]'
        }
        style={exportMode ? { border: `1px solid ${theme.border}`, color: theme.foreground, breakInside: 'avoid', pageBreakInside: 'avoid' } : undefined}
      >
        {children}
      </td>
    ),
    hr: ({ ...props }) =>
      exportMode ? (
        <hr {...props} className="my-4" style={{ borderTop: `1px solid ${theme.border}` }} />
      ) : (
        <hr {...props} className="my-4 border-border" />
      ),
    code: ({ className, children, ...props }) => {
      const codeText = String(children).replace(/\n$/, '')
      const isBlock = Boolean(className?.includes('language-')) || codeText.includes('\n')

      if (!isBlock) {
        return exportMode ? (
          <code
            {...props}
            className={cn('page-break-avoid rounded-md border px-1.5 py-0.5 font-mono text-[0.95em]', className)}
            style={{
              backgroundColor: theme.codeBackground,
              color: theme.codeForeground,
              borderColor: theme.border,
            }}
          >
            {children}
          </code>
        ) : (
          <code
            {...props}
            className={cn('rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[0.95em] text-foreground', className)}
          >
            {children}
          </code>
        )
      }

      return exportMode ? (
        <code
          {...props}
          className={cn('page-break-avoid block rounded-[14px] px-4 py-3 font-mono text-[0.95rem] leading-6', className)}
          style={{
            backgroundColor: theme.codeBackground,
            color: theme.codeForeground,
            borderColor: theme.border,
          }}
        >
          {children}
        </code>
      ) : (
        <code
          {...props}
          className={cn(
            'block rounded-[14px] border border-border bg-muted px-4 py-3 font-mono text-[0.95rem] leading-6 text-foreground break-words whitespace-pre-wrap',
            exportMode && 'overflow-visible',
            className
          )}
        >
          {children}
        </code>
      )
    },
    pre: ({ children, ...props }) => {
      // Render fenced code blocks with a language chip so the preview stays informative without adding extra chrome to inline code.
      const child = Children.only(children) as ReactElement<{ className?: string; children?: ReactNode }>

      if (isValidElement(child)) {
        const codeClassName = typeof child.props.className === 'string' ? child.props.className : ''
        const codeLanguageMatch = /language-([\w-]+)/.exec(codeClassName)

        if (codeLanguageMatch) {
          const codeLanguage = codeLanguageMatch[1]

          return (
            <div
              className="page-break-avoid my-4 overflow-hidden rounded-[14px] border border-border bg-muted"
              style={exportMode ? { borderColor: theme.border, backgroundColor: theme.surface, breakInside: 'avoid', pageBreakInside: 'avoid' } : undefined}
            >
              <div className="px-4 pt-3">
                <span
                  className="inline-flex items-center rounded-full border bg-white px-2.5 py-1 font-mono text-[0.72rem] uppercase tracking-[0.14em] text-foreground"
                  style={
                    exportMode
                      ? {
                          borderColor: theme.border,
                          backgroundColor: '#ffffff',
                          color: theme.mutedForeground,
                        }
                      : {
                          backgroundColor: '#ffffff',
                        }
                  }
                >
                  {codeLanguage}
                </span>
              </div>
              <div className="px-4 py-3 overflow-hidden">
                <code
                  className={cn(
                    'block whitespace-pre-wrap break-words font-mono text-[0.95rem] leading-6',
                    exportMode && 'overflow-visible'
                  )}
                  style={exportMode ? { color: theme.codeForeground } : undefined}
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
          className={cn('my-4 rounded-[14px] bg-muted p-0', !exportMode && 'overflow-x-auto', exportMode && 'overflow-visible')}
          style={exportMode ? { backgroundColor: theme.surface } : undefined}
        >
          {children}
        </pre>
      )
    },
    input: ({ checked }) =>
      exportMode ? (
        <TaskCheckbox
          checked={Boolean(checked)}
          className="translate-y-[1px]"
          style={{
            borderColor: checked ? theme.taskMarkerBorder : theme.foreground,
            backgroundColor: checked ? theme.taskMarkerBackground : theme.background,
            color: checked ? theme.taskMarkerForeground : theme.foreground,
          }}
        />
      ) : (
        <TaskCheckbox
          checked={Boolean(checked)}
          className="mt-1 translate-y-[1px]"
          style={{
            borderColor: checked ? theme.taskMarkerBorder : theme.foreground,
            backgroundColor: checked ? theme.taskMarkerBackground : theme.background,
            color: checked ? theme.taskMarkerForeground : theme.foreground,
          }}
        />
      ),
    img: ({ alt, src, ...props }) =>
      exportMode ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          {...props}
          alt={alt ?? ''}
          crossOrigin="anonymous"
          decoding="async"
          loading="eager"
          src={src}
          className="page-break-avoid my-4 max-w-full rounded-[14px] border"
          style={{ borderColor: theme.border, breakInside: 'avoid', pageBreakInside: 'avoid' }}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          {...props}
          alt={alt ?? ''}
          crossOrigin="anonymous"
          decoding="async"
          loading="eager"
          src={src}
          className="my-4 max-w-full rounded-[14px] border border-border"
        />
      ),
  }
}

export function MarkdownRenderer({
  markdown,
  mobile = false,
  exportMode = false,
  theme = defaultPdfPreviewTheme,
}: {
  markdown: string
  mobile?: boolean
  exportMode?: boolean
  theme?: PdfPreviewTheme
}) {
  // Render the markdown preview using the same GFM dialect that GitHub documents, while applying the workspace typography and surface rules.
    return (
    <div className={cn('max-w-[43rem] break-words [overflow-wrap:anywhere]', mobile && 'max-w-none', exportMode && 'max-w-none')} style={exportMode ? { color: theme.foreground } : undefined}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, stripMarkdownHtmlComments]}
        components={createMarkdownComponents(exportMode, theme)}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  )
}
