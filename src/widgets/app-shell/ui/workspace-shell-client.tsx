'use client'

/**
 * File: src/widgets/app-shell/ui/workspace-shell-client.tsx
 * Purpose: Client-only workspace surface that owns markdown state and the interactive editor/preview split.
 * Why it exists: the page needs a small client boundary for live textarea editing while keeping the sidebar and page shell server-safe.
 * What it does: renders the desktop markdown/preview panes and the mobile fallback with shared markdown state.
 * Connected to: `MarkdownPane`, `PreviewPane`, `EditorPreview`, `ExportBar`, and the workspace snapshot model.
 */
import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { EditorPreview, MarkdownPane, PreviewPane } from '@/widgets/editor-preview/ui/editor-preview'
import { ExportBar } from '@/widgets/export-bar/ui/export-bar'
import type { WorkspaceSnapshot } from '@/entities/document/model/types'
import { useDocumentSelection } from '@/features/document-selection/model/use-document-selection'
import { Sidebar } from '@/widgets/sidebar/ui/sidebar'
import { cn } from '@/shared/lib/cn'

const DESKTOP_SIDEBAR_MIN_WIDTH = 280
const DESKTOP_SIDEBAR_MAX_WIDTH = 480
const DESKTOP_SIDEBAR_INITIAL_WIDTH = 384

function clampSidebarWidth(width: number) {
  return Math.min(DESKTOP_SIDEBAR_MAX_WIDTH, Math.max(DESKTOP_SIDEBAR_MIN_WIDTH, width))
}

export function WorkspaceShellClient({
  snapshot,
}: {
  snapshot: WorkspaceSnapshot
}) {
  const [markdown, setMarkdown] = useState(snapshot.editor.markdown)
  const [sidebarWidth, setSidebarWidth] = useState(DESKTOP_SIDEBAR_INITIAL_WIDTH)
  const [isResizingSidebar, setIsResizingSidebar] = useState(false)
  const dragStateRef = useRef<{ startX: number; startWidth: number } | null>(null)
  const {
    documents,
    selectedCount,
    selectionMode,
    setAllSelected,
    toggleDocument,
  } = useDocumentSelection(snapshot.documents)

  // Initialize the sidebar width from the current viewport so the desktop split starts close to the Figma ratio.
  useEffect(() => {
    const syncSidebarWidth = () => {
      setSidebarWidth((currentWidth) => clampSidebarWidth(currentWidth))
    }

    syncSidebarWidth()
    window.addEventListener('resize', syncSidebarWidth)

    return () => {
      window.removeEventListener('resize', syncSidebarWidth)
    }
  }, [])

  // Track the drag gesture globally so the sidebar can resize even if the pointer leaves the divider while dragging.
  useEffect(() => {
    if (!isResizingSidebar) {
      return
    }

    const handlePointerMove = (event: PointerEvent) => {
      const dragState = dragStateRef.current

      if (!dragState) {
        return
      }

      setSidebarWidth(clampSidebarWidth(dragState.startWidth + (event.clientX - dragState.startX)))
    }

    const stopResizing = () => {
      dragStateRef.current = null
      setIsResizingSidebar(false)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', stopResizing)
    window.addEventListener('pointercancel', stopResizing)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', stopResizing)
      window.removeEventListener('pointercancel', stopResizing)
    }
  }, [isResizingSidebar])

  const startSidebarResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    dragStateRef.current = {
      startX: event.clientX,
      startWidth: sidebarWidth,
    }
    setIsResizingSidebar(true)
  }

  // Keep the live markdown and selection state isolated to the client surface so the page shell can stay server-rendered.
  return (
    <>
      <div className="hidden h-full min-h-0 lg:flex lg:gap-0">
        <div className="min-h-0 shrink-0" style={{ width: `${sidebarWidth}px` }}>
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

        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
          onPointerDown={startSidebarResize}
          className={cn(
            'group relative z-10 flex w-2 shrink-0 cursor-col-resize items-stretch justify-center select-none',
            isResizingSidebar && 'bg-white/[0.08]'
          )}
        >
          <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-transparent group-hover:bg-white/[0.12]" />
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
