'use client'

/**
 * File: src/widgets/export-bar/ui/export-bar.tsx
 * Purpose: Persistent PDF export controls for the workspace.
 * Why it exists: the design keeps export visible at all times so the user never has to hunt for the primary output action.
 * What it does: shows the document chip plus copy and download actions in a floating bar.
 * Connected to: the editor/preview widget and the current document snapshot.
 */
import { Copy, Download, PencilLine } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { IconButton } from '@/shared/ui/icon-button'
import { cn } from '@/shared/lib/cn'

export function ExportBar({
  fileName,
  className,
}: {
  fileName: string
  className?: string
}) {
  // Render the floating export rail that stays pinned to the lower-right corner of the workspace.
  return (
    <div
      className={cn(
        'absolute bottom-6 right-6 z-10 flex items-center gap-2 rounded-full bg-sidebar px-2 py-2 shadow-[0_20px_50px_rgba(20,20,20,0.24)]',
        className
      )}
    >
      <Button variant="secondary" size="sm" className="h-11 rounded-full px-4">
        <span className="max-w-[13rem] truncate">{fileName}</span>
        <PencilLine className="h-4 w-4" />
      </Button>
      <IconButton aria-label="Copy document" variant="neutral" size="default">
        <Copy className="h-4 w-4" />
      </IconButton>
      <IconButton aria-label="Download PDF" variant="accent" size="default">
        <Download className="h-4 w-4" />
      </IconButton>
    </div>
  )
}
