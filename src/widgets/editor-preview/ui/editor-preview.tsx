/**
 * File: src/widgets/editor-preview/ui/editor-preview.tsx
 * Purpose: Mobile fallback for the workspace editor and preview surfaces.
 * Why it exists: the desktop layout now uses separate full-height blocks, but mobile still needs a tabbed switcher.
 * What it does: renders the tabbed mobile control bar and swaps between markdown and preview panels.
 * Connected to: the markdown editor state from `AppShell`, `Tabs`, `IconButton`, and the mobile route fallback.
 */
'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import type { ElementType, ReactNode } from 'react'
import { IconDownload, IconEye, IconFileCode2, IconMenu2 } from '@tabler/icons-react'
import { Tabs } from '@/shared/ui/tabs'
import { IconButton } from '@/shared/ui/icon-button'
import { cn } from '@/shared/lib/cn'
import { getMarkdownLineCount, parseMarkdownBlocks } from '@/entities/document/model/markdown'

export function EditorPreview({
  markdown,
  onMarkdownChange,
  placeholder,
}: {
  markdown: string
  onMarkdownChange: (value: string) => void
  placeholder: string
}) {
  const [mobilePanel, setMobilePanel] = useState<'markdown' | 'preview'>('markdown')

  // Render the compact mobile control surface so small screens still mirror the Figma interaction pattern.
  return (
    <section className="flex h-full min-h-0 flex-col gap-2 lg:hidden">
      <div className="flex items-center gap-3 rounded-[16px] border border-border bg-card px-4 py-3">
        <IconButton aria-label="Open navigation" variant="outline" size="sm">
          <IconMenu2 className="h-4 w-4" />
        </IconButton>
        <Tabs
          ariaLabel="Workspace mode"
          items={[
            { value: 'markdown', label: 'Markdown', icon: <IconFileCode2 className="h-5 w-5" /> },
            { value: 'preview', label: 'Preview', icon: <IconEye className="h-5 w-5" /> },
          ]}
          value={mobilePanel}
          onValueChange={(value) => setMobilePanel(value as 'markdown' | 'preview')}
          className="flex-1"
        />
        <IconButton aria-label="Download PDF" variant="primary" size="sm">
          <IconDownload className="h-4 w-4" />
        </IconButton>
      </div>

      <div className="min-h-0 flex-1">
        {mobilePanel === 'markdown' ? (
          <MarkdownPane value={markdown} onChange={onMarkdownChange} placeholder={placeholder} mobile />
        ) : (
          <PreviewPane markdown={markdown} mobile />
        )}
      </div>
    </section>
  )
}

export function MarkdownPane({
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
  const normalizedValue = value.replace(/\r\n/g, '\n')
  const lines = normalizedValue.split('\n')
  const lineCount = getMarkdownLineCount(normalizedValue)
  const gutterWidthClass = mobile ? 'w-10' : 'w-14'
  const editorPaddingClass = mobile ? 'pl-12 pr-4' : 'pl-16 pr-6'
  const editorRef = useRef<HTMLDivElement>(null)
  const mirrorRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [lineHeights, setLineHeights] = useState<number[]>(
    () => Array.from({ length: lineCount }, () => 24)
  )

  // Render the markdown source as a real textarea with a VS Code-style gutter so editing stays familiar and the preview can stay in sync.
  useLayoutEffect(() => {
    const measureLineHeights = () => {
      const mirror = mirrorRef.current

      if (!mirror) {
        return
      }

      const nextHeights = Array.from(mirror.children, (child) =>
        Math.max(24, Math.ceil((child as HTMLElement).getBoundingClientRect().height))
      )

      setLineHeights(nextHeights.length ? nextHeights : Array.from({ length: lineCount }, () => 24))
    }

    measureLineHeights()

    if (typeof ResizeObserver === 'undefined' || !editorRef.current) {
      return
    }

    const observer = new ResizeObserver(() => {
      measureLineHeights()
    })

    observer.observe(editorRef.current)

    return () => {
      observer.disconnect()
    }
  }, [lineCount, normalizedValue, mobile])

  return (
    <section ref={editorRef} className="relative flex h-full min-h-0 overflow-hidden rounded-[16px] border border-border bg-card">
      <div className={cn('pointer-events-none absolute inset-y-0 left-0 border-r border-border bg-card', gutterWidthClass)}>
        <div
          className="flex flex-col px-3 py-8 font-mono text-[13px] leading-6 text-muted-foreground"
          style={{ transform: `translateY(${-scrollTop}px)` }}
        >
          {Array.from({ length: lineCount }, (_, index) => (
            <div
              key={index}
              className="flex items-start justify-end"
              style={{ height: lineHeights[index] ?? 24 }}
            >
              <span className="w-full pr-3 text-right tabular-nums select-none">
                {index + 1}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div
        ref={mirrorRef}
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0 overflow-hidden px-4 py-8 font-mono text-[15px] leading-6 opacity-0',
          editorPaddingClass
        )}
      >
        {lines.map((line, index) => (
          <div key={index} className="whitespace-pre-wrap break-words">
            {line || '\u00a0'}
          </div>
        ))}
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
        aria-label="Markdown editor"
        placeholder={placeholder}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        className={cn(
          'h-full w-full resize-none border-0 bg-transparent px-4 py-8 font-mono text-[15px] leading-6 text-foreground outline-none placeholder:text-muted-foreground/70',
          editorPaddingClass
        )}
      />
    </section>
  )
}

export function PreviewPane({
  markdown,
  mobile = false,
}: {
  markdown: string
  mobile?: boolean
}) {
  const blocks = parseMarkdownBlocks(markdown)

  // Render the parsed markdown blocks as document typography so headings, paragraphs, and dividers feel like a live rendered page.
  return (
    <section className="flex h-full min-h-0 overflow-hidden rounded-[16px] border border-border bg-card">
      <div
        className={cn(
          'h-full min-h-0 w-full overflow-y-auto bg-card px-8 py-8 pb-24',
          mobile && 'px-6 py-6 pb-20'
        )}
      >
        <div className={cn('max-w-[43rem]', mobile && 'max-w-none')}>
          {blocks.map((block) => {
            if (block.type === 'heading') {
              const HeadingTag = `h${block.level}` as ElementType
              const headingClassName =
                block.level === 1
                  ? cn(
                      'font-sans text-[3.5rem] font-semibold tracking-[-0.05em] text-foreground',
                      mobile && 'text-[2.5rem]'
                    )
                  : block.level === 2
                    ? 'mt-6 font-sans text-[2.25rem] font-semibold tracking-[-0.04em] text-foreground'
                    : 'mt-5 font-sans text-[1.5rem] font-semibold tracking-[-0.03em] text-foreground'

              return <HeadingTag key={block.id} className={headingClassName}>{renderInlineMarkdown(block.text)}</HeadingTag>
            }

            if (block.type === 'divider') {
              return <div key={block.id} className="my-4 h-px bg-border" />
            }

            return (
              <p
                key={block.id}
                className={cn(
                  'text-sm leading-7 text-foreground',
                  mobile && 'text-[13px] leading-6'
                )}
              >
                {renderInlineMarkdown(block.text)}
              </p>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function renderInlineMarkdown(text: string): ReactNode[] {
  // Translate tiny inline markdown patterns into semantic React nodes so bold tips and code snippets render naturally.
  const segments: ReactNode[] = []
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g
  const parts = text.split(pattern)

  parts.forEach((part, index) => {
    if (!part) {
      return
    }

    if (part.startsWith('**') && part.endsWith('**')) {
      segments.push(
        <strong key={`${index}-strong`} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      )
      return
    }

    if (part.startsWith('*') && part.endsWith('*')) {
      segments.push(
        <em key={`${index}-em`} className="italic text-foreground">
          {part.slice(1, -1)}
        </em>
      )
      return
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      segments.push(
        <code
          key={`${index}-code`}
          className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[0.95em] text-foreground"
        >
          {part.slice(1, -1)}
        </code>
      )
      return
    }

    segments.push(<span key={`${index}-text`}>{part}</span>)
  })

  return segments
}
