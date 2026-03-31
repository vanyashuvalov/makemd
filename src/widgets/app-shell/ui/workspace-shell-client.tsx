'use client'

/**
 * File: src/widgets/app-shell/ui/workspace-shell-client.tsx
 * Purpose: Client-only workspace surface that owns markdown state and the interactive editor/preview split.
 * Why it exists: the page needs a small client boundary for live textarea editing while keeping the sidebar and page shell server-safe.
 * What it does: renders the desktop markdown/preview panes and the mobile fallback with shared markdown state.
 * Connected to: `MarkdownPane`, `PreviewPane`, `EditorPreview`, `ExportBar`, and the workspace snapshot model.
 */
import { useState } from 'react'
import type { ReactNode } from 'react'
import { EditorPreview, MarkdownPane, PreviewPane } from '@/widgets/editor-preview/ui/editor-preview'
import { ExportBar } from '@/widgets/export-bar/ui/export-bar'
import type { WorkspaceSnapshot } from '@/entities/document/model/types'

export function WorkspaceShellClient({
  snapshot,
  children,
}: {
  snapshot: WorkspaceSnapshot
  children: ReactNode
}) {
  const [markdown, setMarkdown] = useState(snapshot.editor.markdown)

  // Keep the live markdown state isolated to the editor and preview area so the rest of the page can remain server-rendered.
  return (
    <>
      <div className="hidden h-full min-h-0 gap-2 lg:grid lg:grid-cols-[minmax(0,20%)_minmax(0,1fr)]">
        <div className="min-h-0">{children}</div>

        <div className="min-h-0">
          <div className="grid h-full min-h-0 gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <MarkdownPane
              value={markdown}
              onChange={setMarkdown}
              placeholder={snapshot.prompt?.title ?? 'Start writing markdown'}
            />

            <div className="relative min-h-0">
              <PreviewPane markdown={markdown} />
              <ExportBar fileName={snapshot.exportFileName} />
            </div>
          </div>
        </div>
      </div>
      <div className="h-full min-h-0 lg:hidden">
        <EditorPreview
          markdown={markdown}
          onMarkdownChange={setMarkdown}
          placeholder={snapshot.prompt?.title ?? 'Start writing markdown'}
        />
      </div>
    </>
  )
}
