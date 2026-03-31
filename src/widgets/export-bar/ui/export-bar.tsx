'use client'

/**
 * File: src/widgets/export-bar/ui/export-bar.tsx
 * Purpose: Persistent PDF export controls for the workspace.
 * Why it exists: the design keeps export visible at all times so the user never has to hunt for the primary output action.
 * What it does: shows the document chip plus copy and download actions in a floating cluster.
 * Connected to: the editor/preview widget and the current document snapshot.
 */
import { Button } from '@/shared/ui/button'
import { IconButton } from '@/shared/ui/icon-button'
import { Icon } from '@/shared/ui/icon'
import { cn } from '@/shared/lib/cn'
import { IconCopy, IconDownload, IconPencil } from '@tabler/icons-react'

export function ExportBar({
  fileName,
  className,
}: {
  fileName: string
  className?: string
}) {
  // Keep the export controls as separate chips so the lower-right corner matches the Figma treatment more closely.
  return (
    <div
      className={cn(
        'absolute bottom-6 right-6 z-10 inline-flex items-center gap-2',
        className
      )}
    >
      <Button
        variant="outline"
        size="sm"
        className="h-11 rounded-full border-border bg-card px-4"
        after={<Icon icon={IconPencil} size="sm" />}
      >
        <span className="max-w-[14rem] truncate">{fileName}</span>
      </Button>
      <IconButton aria-label="Copy document" variant="outline" size="default" className="border border-border">
        <Icon icon={IconCopy} size="sm" />
      </IconButton>
      <IconButton aria-label="Download PDF" variant="primary" size="default">
        <Icon icon={IconDownload} size="sm" />
      </IconButton>
    </div>
  )
}
