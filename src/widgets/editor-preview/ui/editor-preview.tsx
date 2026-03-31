'use client'

/**
 * File: src/widgets/editor-preview/ui/editor-preview.tsx
 * Purpose: Split editor/preview workspace from the Figma board.
 * Why it exists: the main product loop is editing Markdown on one side and validating the render on the other.
 * What it does: renders the desktop two-pane composition and the mobile tabbed fallback.
 * Connected to: `WorkspaceSnapshot`, the shared tabs primitive, and the export bar widget.
 */
import { useState } from 'react'
import { Download, Eye, FileCode2, Menu } from 'lucide-react'
import { Tabs } from '@/shared/ui/tabs'
import { IconButton } from '@/shared/ui/icon-button'
import { Separator } from '@/shared/ui/separator'
import { cn } from '@/shared/lib/cn'
import type { WorkspaceSnapshot } from '@/entities/document/model/types'

export function EditorPreview({ snapshot }: { snapshot: WorkspaceSnapshot }) {
  const [mobilePanel, setMobilePanel] = useState<'markdown' | 'preview'>('markdown')

  // Split the mockup into a desktop paper surface and a compact mobile toggle so the same data works on both viewports.
  return (
    <section className="relative flex min-h-full flex-1 overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-[0_16px_40px_rgba(20,20,20,0.08)]">
      <div className="hidden min-w-0 flex-1 md:flex">
        <div className="flex min-w-0 flex-1">
          <MarkdownPane lines={snapshot.editor.lines} />
        </div>
        <Separator orientation="vertical" className="bg-border" />
        <div className="flex min-w-0 flex-1">
          <PreviewPane title={snapshot.preview.title} note={snapshot.preview.note} body={snapshot.preview.body} />
        </div>
      </div>

      <div className="flex min-h-[32rem] flex-1 flex-col md:hidden">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <IconButton aria-label="Open navigation" variant="subtle" size="sm">
            <Menu className="h-4 w-4" />
          </IconButton>
          <Tabs
            ariaLabel="Workspace mode"
            items={[
              { value: 'markdown', label: 'Markdown', icon: <FileCode2 className="h-5 w-5" /> },
              { value: 'preview', label: 'Preview', icon: <Eye className="h-5 w-5" /> },
            ]}
            value={mobilePanel}
            onValueChange={(value) => setMobilePanel(value as 'markdown' | 'preview')}
            className="flex-1"
          />
          <IconButton aria-label="Download PDF" variant="accent" size="sm">
            <Download className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="min-h-0 flex-1">
          {mobilePanel === 'markdown' ? (
            <MarkdownPane lines={snapshot.editor.lines} mobile />
          ) : (
            <PreviewPane
              title={snapshot.preview.title}
              note={snapshot.preview.note}
              body={snapshot.preview.body}
              mobile
            />
          )}
        </div>
      </div>
    </section>
  )
}

function MarkdownPane({
  lines,
  mobile = false,
}: {
  lines: string[]
  mobile?: boolean
}) {
  // Render the markdown source as a line-numbered code surface, matching the left side of the desktop Figma board.
  return (
    <div className={cn('grid min-h-full w-full grid-cols-[42px_minmax(0,1fr)] bg-card', mobile && 'grid-cols-[34px_minmax(0,1fr)]')}>
      <div className="border-r border-border px-2 py-8 font-mono text-[13px] leading-6 text-muted-foreground">
        {lines.map((_, index) => (
          <div key={index} className="h-6">
            {index + 1}
          </div>
        ))}
      </div>
      <div className="px-4 py-8">
        <pre className={cn('whitespace-pre-wrap font-mono text-[15px] leading-6 text-foreground', mobile ? 'max-w-[22rem]' : 'max-w-[44rem]')}>
          {lines.join('\n')}
        </pre>
      </div>
    </div>
  )
}

function PreviewPane({
  title,
  note,
  body,
  mobile = false,
}: {
  title: string
  note?: string
  body: string[]
  mobile?: boolean
}) {
  // Render the preview side with a large heading, supporting note, and a sparse content column that mirrors the mockup.
  return (
    <div className={cn('w-full bg-card px-8 py-8', mobile && 'px-6 py-6')}>
      <div className="max-w-[43rem]">
        <h1 className={cn('font-sans text-[3.5rem] font-semibold tracking-[-0.05em] text-foreground', mobile && 'text-[2.5rem]')}>
          {title}
        </h1>
        {note ? <p className="mt-2 text-[11px] font-medium leading-4 text-muted-foreground">{note}</p> : null}
        {note ? <div className="mt-3 h-px bg-border" /> : null}
        <div className="mt-4 space-y-3.5 text-sm leading-6 text-foreground">
          {body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
    </div>
  )
}