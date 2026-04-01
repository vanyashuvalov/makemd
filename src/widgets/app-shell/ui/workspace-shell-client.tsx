/**
 * File: src/widgets/app-shell/ui/workspace-shell-client.tsx
 * Purpose: Client-only workspace surface that owns markdown state and the interactive editor/preview split.
 * Why it exists: the page needs a small client boundary for live textarea editing while keeping the sidebar and page shell server-safe.
 * What it does: renders the desktop markdown/preview panes and the mobile fallback with shared markdown state.
 * Connected to: `MarkdownPane`, `PreviewPane`, `EditorPreview`, `ExportBar`, and the workspace snapshot model.
 */
'use client'

import { useState } from 'react'
import { EditorPreview, MarkdownPane, PreviewPane } from '@/widgets/editor-preview/ui/editor-preview'
import { ExportBar } from '@/widgets/export-bar/ui/export-bar'
import type { WorkspaceSnapshot } from '@/entities/document/model/types'
import { useDocumentSelection } from '@/features/document-selection/model/use-document-selection'
import { Sidebar } from '@/widgets/sidebar/ui/sidebar'

const DESKTOP_SIDEBAR_WIDTH = 360

export function WorkspaceShellClient({
  snapshot,
}: {
  snapshot: WorkspaceSnapshot
}) {
  const [markdown, setMarkdown] = useState(snapshot.editor.markdown)
  const {
    documents,
    selectedCount,
    selectionMode,
    setAllSelected,
    toggleDocument,
  } = useDocumentSelection(snapshot.documents)

  // Keep the live markdown and selection state isolated to the client surface while the sidebar stays a fixed 360px anchor in the shell.
  return (
    <>
      <div className="hidden h-full min-h-0 lg:flex lg:gap-0">
        <div className="min-h-0 shrink-0" style={{ width: `${DESKTOP_SIDEBAR_WIDTH}px` }}>
          <Sidebar
            snapshot={snapshot}
            documents={documents}
            selectionMode={selectionMode}
            selectedCount={selectedCount}
            totalCount={documents.length}
            helperText={snapshot.selection?.helperText ?? 'Hold Ctrl to select many'}
            onToggleAllSelection={setAllSelected}
            onToggleDocument={toggleDocument}
          />
        </div>

        <div className="min-h-0 min-w-0 flex-1">
          <div className="grid h-full min-h-0 gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <MarkdownPane
              value={markdown}
              onChange={setMarkdown}
              placeholder={snapshot.prompt?.title ?? 'Start writing markdown'}
            />

            <div className="relative min-h-0 min-w-0">
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
