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

const markdownComponents: Components = {
  h1: ({ children, ...props }) => (
    <h1
      {...props}
      className="mt-0 font-sans text-[3.5rem] font-semibold tracking-[-0.05em] text-foreground first:mt-0"
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2
      {...props}
      className="mt-6 font-sans text-[2.25rem] font-semibold tracking-[-0.04em] text-foreground"
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3
      {...props}
      className="mt-5 font-sans text-[1.5rem] font-semibold tracking-[-0.03em] text-foreground"
    >
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4 {...props} className="mt-4 font-sans text-[1.25rem] font-semibold text-foreground">
      {children}
    </h4>
  ),
  h5: ({ children, ...props }) => (
    <h5 {...props} className="mt-4 font-sans text-[1.1rem] font-semibold text-foreground">
      {children}
    </h5>
  ),
  h6: ({ children, ...props }) => (
    <h6 {...props} className="mt-4 font-sans text-[1rem] font-semibold text-foreground">
      {children}
    </h6>
  ),
  p: ({ children, ...props }) => (
    <p {...props} className="text-sm leading-7 text-foreground">
      {children}
    </p>
  ),
  strong: ({ children, ...props }) => (
    <strong {...props} className="font-semibold text-foreground">
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em {...props} className="italic text-foreground">
      {children}
    </em>
  ),
  del: ({ children, ...props }) => (
    <del {...props} className="text-foreground decoration-foreground/60">
      {children}
    </del>
  ),
  a: ({ children, href, ...props }) => (
    <a
      {...props}
      href={href}
      className="text-sky-700 underline decoration-sky-700/40 underline-offset-4 transition-colors hover:text-sky-700/80"
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noreferrer noopener' : undefined}
    >
      {children}
    </a>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      {...props}
      className="border-l-2 border-border pl-4 text-foreground/90"
    >
      {children}
    </blockquote>
  ),
  ul: ({ children, ...props }) => (
    <ul
      {...props}
      className={cn(
        'my-0 space-y-2 pl-6 text-sm leading-7 text-foreground',
        typeof props.className === 'string' && props.className.includes('contains-task-list')
          ? 'list-none pl-0'
          : 'list-disc'
      )}
    >
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol {...props} className="my-0 list-decimal space-y-2 pl-6 text-sm leading-7 text-foreground">
      {children}
    </ol>
  ),
  li: ({ children, className, ...props }) => {
    // Flatten task list items so GFM checkboxes render without the default bullet marker and keep the checkbox aligned with the text.
    const isTaskListItem = typeof className === 'string' && className.includes('task-list-item')

    return (
      <li
        {...props}
        className={cn(
          'pl-1',
          isTaskListItem && 'list-none flex items-start gap-2 pl-0 leading-7 [&>p]:my-0'
        )}
      >
        {children}
      </li>
    )
  },
  table: ({ children, ...props }) => (
    <div className="my-4 overflow-x-auto">
      <table {...props} className="w-full border-collapse text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead {...props} className="bg-muted/50 text-foreground">
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }) => (
    <tbody {...props} className="divide-y divide-border">
      {children}
    </tbody>
  ),
  tr: ({ children, ...props }) => (
    <tr {...props} className="border-b border-border">
      {children}
    </tr>
  ),
  th: ({ children, ...props }) => (
    <th {...props} className="border border-border px-3 py-2 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td {...props} className="border border-border px-3 py-2 align-top">
      {children}
    </td>
  ),
  hr: ({ ...props }) => <hr {...props} className="my-4 border-border" />,
  code: ({ className, children, ...props }) => {
    const codeText = String(children).replace(/\n$/, '')
    const isBlock = Boolean(className?.includes('language-')) || codeText.includes('\n')

    if (!isBlock) {
      return (
        <code
          {...props}
          className={cn(
            'rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[0.95em] text-foreground',
            className
          )}
        >
          {children}
        </code>
      )
    }

    return (
      <code
        {...props}
        className={cn(
          'block overflow-x-auto rounded-[14px] border border-border bg-muted px-4 py-3 font-mono text-[0.95rem] leading-6 text-foreground',
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
          <div className="my-4 overflow-hidden rounded-[14px] border border-border bg-muted">
            <div className="px-4 pt-3">
              <span className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-1 font-mono text-[0.72rem] uppercase tracking-[0.14em] text-muted-foreground">
                {codeLanguage}
              </span>
            </div>
            <div className="overflow-x-auto px-4 py-3">
              <code className="block whitespace-pre-wrap break-words font-mono text-[0.95rem] leading-6 text-foreground">
                {child.props.children}
              </code>
            </div>
          </div>
        )
      }
    }

    return (
      <pre {...props} className="my-4 overflow-x-auto rounded-[14px] bg-muted p-0">
        {children}
      </pre>
    )
  },
  input: ({ checked, ...props }) => (
    <span
      {...props}
      aria-hidden="true"
      className={cn(
        'mt-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border border-black/50 bg-transparent',
        checked && 'border-black bg-black'
      )}
    >
      {checked ? <span className="text-[0.7rem] leading-none text-white">✓</span> : null}
    </span>
  ),
  img: ({ alt, src, ...props }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...props}
      alt={alt ?? ''}
      src={src}
      className="my-4 max-w-full rounded-[14px] border border-border"
    />
  ),
}

export function MarkdownRenderer({ markdown, mobile = false }: { markdown: string; mobile?: boolean }) {
  // Render the markdown preview using the same GFM dialect that GitHub documents, while applying the workspace typography and surface rules.
  return (
    <div className={cn('max-w-[43rem]', mobile && 'max-w-none')}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {markdown}
      </ReactMarkdown>
    </div>
  )
}
