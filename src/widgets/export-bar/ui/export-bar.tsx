'use client'

/**
 * File: src/widgets/export-bar/ui/export-bar.tsx
 * Purpose: Persistent PDF export controls for the workspace.
 * Why it exists: the design keeps export visible at all times so the user never has to hunt for the primary output action.
 * What it does: shows the document chip plus copy and download actions in a floating cluster.
 * Connected to: the editor/preview widget and the current document snapshot.
 */
import { IconButton } from '@/shared/ui/icon-button'
import { Icon } from '@/shared/ui/icon'
import { cn } from '@/shared/lib/cn'
import { IconCopy, IconDownload } from '@tabler/icons-react'

// Render the lower-right document title chip and the adjacent export actions so the timestamp-based name stays visible beside copy and download.
export function ExportBar({
  title,
  onCopyMarkdown,
  onDownloadPdf,
  className,
}: {
  title: string
  onCopyMarkdown?: () => void
  onDownloadPdf?: () => void
  className?: string
}) {
  // Keep the export controls as separate chips so the lower-right corner matches the Figma treatment more closely.
  return (
    <div
      className={cn(
        'absolute bottom-3 right-3 z-10 inline-flex items-center gap-2',
        className
      )}
    >
      <div className="flex h-11 items-center rounded-full border border-transparent bg-[color:var(--color-sidebar-surface)] px-4 text-[18px] leading-[25px] font-normal text-white">
        <span className="min-w-0 truncate font-normal">{title}</span>
      </div>
      <IconButton
        aria-label="Copy document"
        variant="outline"
        size="default"
        className="border-transparent bg-[color:var(--color-sidebar-surface)] text-white hover:bg-[color:var(--color-sidebar-surface)] active:bg-[color:var(--color-sidebar-surface)]"
        onClick={onCopyMarkdown}
      >
        <Icon icon={IconCopy} size="md" tone="white" />
      </IconButton>
      <IconButton
        aria-label="Download PDF"
        variant="outline"
        size="default"
        className="border-transparent bg-[color:var(--color-sidebar-surface)] text-white hover:bg-[color:var(--color-sidebar-surface)] active:bg-[color:var(--color-sidebar-surface)]"
        onClick={onDownloadPdf}
      >
        <Icon icon={IconDownload} size="md" tone="white" />
      </IconButton>
    </div>
  )
}
