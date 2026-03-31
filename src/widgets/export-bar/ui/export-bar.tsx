'use client'

/**
 * File: src/widgets/export-bar/ui/export-bar.tsx
 * Purpose: Persistent PDF export controls for the workspace.
 * Why it exists: the design keeps export visible at all times so the user never has to hunt for the primary output action.
 * What it does: shows the document chip plus copy and download actions in a floating cluster.
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
        className="h-11 rounded-full border-border bg-card px-4 shadow-[0_8px_20px_rgba(20,20,20,0.08)]"
        after={<PencilLine className="h-4 w-4" />}
      >
        <span className="max-w-[14rem] truncate">{fileName}</span>
      </Button>
      <IconButton aria-label="Copy document" variant="subtle" size="default" className="border border-border shadow-[0_8px_20px_rgba(20,20,20,0.08)]">
        <Copy className="h-4 w-4" />
      </IconButton>
      <IconButton aria-label="Download PDF" variant="accent" size="default" className="shadow-[0_8px_20px_rgba(79,116,255,0.18)]">
        <Download className="h-4 w-4" />
      </IconButton>
    </div>
  )
}
