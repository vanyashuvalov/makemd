/**
 * File: src/widgets/editor-preview/ui/editor-preview.tsx
 * Purpose: Mobile fallback for the workspace editor and preview surfaces.
 * Why it exists: the desktop layout now uses separate full-height blocks, but mobile still needs a tabbed switcher.
 * What it does: renders the tabbed mobile control bar and swaps between markdown and preview panels.
 * Connected to: the markdown editor state from `AppShell`, `Tabs`, `IconButton`, and the mobile route fallback.
 */
'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { IconDownload, IconEye, IconFileCode2, IconMenu2 } from '@tabler/icons-react'
import { Tabs } from '@/shared/ui/tabs'
import { IconButton } from '@/shared/ui/icon-button'
import { Icon } from '@/shared/ui/icon'
import { cn } from '@/shared/lib/cn'
import { getMarkdownLineCount, tokenizeMarkdownInline, tokenizeMarkdownLine } from '@/entities/document/model/markdown'
import { MarkdownRenderer } from './markdown-renderer'

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
          <Icon icon={IconMenu2} size="sm" />
        </IconButton>
        <Tabs
          ariaLabel="Workspace mode"
          items={[
            { value: 'markdown', label: 'Markdown', icon: IconFileCode2 },
            { value: 'preview', label: 'Preview', icon: IconEye },
          ]}
          value={mobilePanel}
          onValueChange={(value) => setMobilePanel(value as 'markdown' | 'preview')}
          className="flex-1"
        />
        <IconButton aria-label="Download PDF" variant="primary" size="sm">
          <Icon icon={IconDownload} size="sm" />
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
          'pointer-events-none absolute inset-0 overflow-hidden px-4 py-8 font-mono text-[15px] leading-6 text-foreground',
          editorPaddingClass
        )}
        style={{ transform: `translateY(${-scrollTop}px)` }}
      >
        {lines.map((line, index) => (
          <div key={index} className="whitespace-pre-wrap break-words">
            {renderMarkdownLine(line)}
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
          'h-full w-full resize-none border-0 bg-transparent px-4 py-8 font-mono text-[15px] leading-6 text-transparent caret-foreground outline-none placeholder:text-muted-foreground/70 selection:bg-primary/20 selection:text-transparent',
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
  // Render the markdown preview through the shared renderer so CommonMark and GFM features stay visually consistent with the source editor.
  return (
    <section className="flex h-full min-h-0 overflow-hidden rounded-[16px] border border-border bg-card">
      <div
        className={cn(
          'h-full min-h-0 w-full overflow-y-auto bg-card px-8 py-8 pb-24',
          mobile && 'px-6 py-6 pb-20'
        )}
      >
        <MarkdownRenderer markdown={markdown} mobile={mobile} />
      </div>
    </section>
  )
}

function renderMarkdownLine(line: string): ReactNode[] {
  // Render a single source line with syntax-colored markdown markers and content so the overlay can behave like a code editor mirror.
  return tokenizeMarkdownLine(line).map((token, index) => {
    if (token.type === 'marker') {
      return (
        <span key={`${index}-marker`} className="text-muted-foreground/60">
          {token.value}
        </span>
      )
    }

    if (token.type === 'strong') {
      return (
        <span key={`${index}-strong`} className="font-semibold text-primary">
          {token.value}
        </span>
      )
    }

    if (token.type === 'emphasis') {
      return (
        <span key={`${index}-em`} className="italic text-primary/80">
          {token.value}
        </span>
      )
    }

    if (token.type === 'code') {
      return (
        <span
          key={`${index}-code`}
          className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.95em] text-primary"
        >
          {token.value}
        </span>
      )
    }

    if (token.type === 'strike') {
      return (
        <span key={`${index}-strike`} className="line-through text-primary/70">
          {token.value}
        </span>
      )
    }

    if (token.type === 'linkText') {
      return (
        <span key={`${index}-link-text`} className="text-primary underline decoration-primary/30 underline-offset-2">
          {token.value}
        </span>
      )
    }

    if (token.type === 'linkUrl') {
      return (
        <span key={`${index}-link-url`} className="text-muted-foreground/80">
          {token.value}
        </span>
      )
    }

    if (token.type === 'url') {
      return (
        <span key={`${index}-url`} className="text-primary underline decoration-primary/30 underline-offset-2">
          {token.value}
        </span>
      )
    }

    if (token.type === 'imageAlt') {
      return (
        <span key={`${index}-image-alt`} className="text-primary">
          {token.value}
        </span>
      )
    }

    if (token.type === 'imageUrl') {
      return (
        <span key={`${index}-image-url`} className="text-muted-foreground/80">
          {token.value}
        </span>
      )
    }

    return (
      <span key={`${index}-text`} className="text-foreground">
        {token.value}
      </span>
    )
  })
}
