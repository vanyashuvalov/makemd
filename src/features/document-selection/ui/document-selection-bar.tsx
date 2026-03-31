'use client'

/**
 * File: src/features/document-selection/ui/document-selection-bar.tsx
 * Purpose: Bulk-selection strip for multi-document actions.
 * Why it exists: one of the Figma states shows selected rows and a row of actions for them.
 * What it does: displays the selection count and the current batch operations in a compact rail.
 * Connected to: the document list, the sidebar, and future bulk management features.
 */
import { IconCopy, IconDownload, IconLink, IconTrash } from '@tabler/icons-react'
import { Checkbox } from '@/shared/ui/checkbox'
import { IconButton } from '@/shared/ui/icon-button'
import { Icon } from '@/shared/ui/icon'
import { Separator } from '@/shared/ui/separator'
import { cn } from '@/shared/lib/cn'

export interface DocumentSelectionBarProps {
  mode?: 'hint' | 'actions'
  selectedCount?: number
  totalCount?: number
  helperText?: string
  onToggleAllSelection?: (checked: boolean) => void
  className?: string
}

export function DocumentSelectionBar({
  mode = 'hint',
  selectedCount = 0,
  totalCount = 0,
  helperText = 'Hold Ctrl to select many',
  onToggleAllSelection,
  className,
}: DocumentSelectionBarProps) {
  const helperTail = helperText.replace(/^Hold Ctrl\s*/, '') || helperText
  const helperTailWords = helperTail.split(/\s+/).filter(Boolean)
  const allSelected = totalCount > 0 && selectedCount === totalCount
  const summaryState = allSelected ? true : 'indeterminate'

  // Render the compact selection rail in either the default hint state or the active bulk-actions state.
  return (
    <div
      className={cn(
        'flex h-14 flex-nowrap items-center gap-4 rounded-[12px] px-4 text-sidebar-foreground',
        className
      )}
    >
      {mode === 'actions' ? (
        <>
          <div className="flex items-center gap-2 text-sm font-medium">
            <Checkbox
              checked={summaryState}
              aria-label="Selection summary"
              onCheckedChange={onToggleAllSelection}
            />
            <span className="font-mono">{selectedCount}</span>
          </div>

          <Separator orientation="vertical" className="mx-1 h-6 bg-sidebar-border" />

          <div className="flex items-center gap-2">
            <IconButton aria-label="Delete selected documents" size="icon" variant="ghost">
              <Icon icon={IconTrash} size="md" />
            </IconButton>
            <IconButton aria-label="Download selected documents" size="icon" variant="ghost">
              <Icon icon={IconDownload} size="md" />
            </IconButton>
            <IconButton aria-label="Copy share link" size="icon" variant="ghost">
              <Icon icon={IconLink} size="md" />
            </IconButton>
            <IconButton aria-label="Copy selected content" size="icon" variant="ghost">
              <Icon icon={IconCopy} size="md" />
            </IconButton>
          </div>
        </>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-2 text-[18px] leading-[22px]">
          <Checkbox checked={false} aria-label="Selection hint" onCheckedChange={onToggleAllSelection} />
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="whitespace-nowrap font-normal text-white">Hold</span>
            <span className="whitespace-nowrap rounded-[4px] bg-white/10 px-2 py-1 text-[15px] font-bold leading-[18px] tracking-[0.03em] text-white/70">
              (Ctrl)
            </span>
            {helperTailWords.map((word) => (
              <span key={word} className="whitespace-nowrap font-normal text-white">
                {word}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
