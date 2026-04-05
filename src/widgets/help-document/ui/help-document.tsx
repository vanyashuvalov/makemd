'use client'

/**
 * File: src/widgets/help-document/ui/help-document.tsx
 * Purpose: Read-only document surface for the workspace Help view.
 * Why it exists: Help should feel like a real document in the same workspace shell, not a modal or a separate editor workflow.
 * What it does: renders the shared preview surface full-width and exposes a back action to return to the normal editor/preview split.
 * Connected to: `PreviewPane`, the workspace shell help toggle, and the server-loaded Help markdown content.
 */
import { IconX } from '@tabler/icons-react'
import { PreviewPane } from '@/widgets/editor-preview/ui/editor-preview'
import { Icon } from '@/shared/ui/icon'
import { IconButton } from '@/shared/ui/icon-button'

export interface HelpDocumentProps {
  markdown: string
  onBack: () => void
}

// Render Help as a regular read-only document so the sidebar remains visible while the right-hand workspace area switches into documentation mode.
export function HelpDocument({ markdown, onBack }: HelpDocumentProps) {
  return (
    <section className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex items-start justify-between gap-4 rounded-[16px] border border-border bg-card px-4 py-3">
        <div className="space-y-1">
          <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-sidebar-muted-foreground">
            Read only document
          </p>
          <h2 className="text-[22px] font-semibold leading-[26px] text-foreground">Help</h2>
        </div>

        <IconButton aria-label="Back to workspace" size="icon" variant="ghost" onClick={onBack}>
          <Icon icon={IconX} size="md" />
        </IconButton>
      </div>

      <div className="min-h-0 flex-1">
        <PreviewPane markdown={markdown} />
      </div>
    </section>
  )
}
