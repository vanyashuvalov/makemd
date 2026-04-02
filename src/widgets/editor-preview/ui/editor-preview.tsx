/**
 * File: src/widgets/editor-preview/ui/editor-preview.tsx
 * Purpose: Mobile fallback and panel composition for the workspace editor and preview surfaces.
 * Why it exists: the desktop layout uses separate full-height blocks, while mobile still needs a tabbed switcher around the shared markdown editor and preview renderer.
 * What it does: renders the tabbed mobile control bar and swaps between the markdown CodeMirror editor and the preview panel.
 * Connected to: `MarkdownEditor`, `MarkdownRenderer`, `Tabs`, `IconButton`, and the shared workspace markdown state.
 */
'use client'

import { useState } from 'react'
import { IconDownload, IconEye, IconFileCode2, IconMenu2 } from '@tabler/icons-react'
import { Tabs } from '@/shared/ui/tabs'
import { IconButton } from '@/shared/ui/icon-button'
import { Icon } from '@/shared/ui/icon'
import { cn } from '@/shared/lib/cn'
import { MarkdownEditor } from './markdown-editor'
import { MarkdownRenderer } from './markdown-renderer'

export function EditorPreview({
  markdown,
  onMarkdownChange,
  onDownloadPdf,
  placeholder,
}: {
  markdown: string
  onMarkdownChange: (value: string) => void
  onDownloadPdf?: () => void
  placeholder: string
}) {
  const [mobilePanel, setMobilePanel] = useState<'markdown' | 'preview'>('markdown')

  // Keep the mobile experience aligned with the desktop shell by switching between the same markdown source and preview panels.
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
        <IconButton aria-label="Download PDF" variant="primary" size="sm" onClick={onDownloadPdf}>
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
  // Keep the markdown editor inside the same framed surface as before so the shell layout and preview column do not need to change.
  return (
    <section className="relative flex h-full min-h-0 overflow-hidden rounded-[16px] border border-border bg-card">
      <MarkdownEditor value={value} onChange={onChange} placeholder={placeholder} mobile={mobile} />
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
