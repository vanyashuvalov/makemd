'use client'

/**
 * File: src/widgets/export-bar/ui/export-bar.tsx
 * Purpose: Persistent PDF export controls for the workspace.
 * Why it exists: the design keeps export visible at all times so the user never has to hunt for the primary output action.
 * What it does: shows the document chip plus copy and download actions in a floating cluster.
 * Connected to: the editor/preview widget and the current document snapshot.
 */
import * as React from 'react'
import { IconButton } from '@/shared/ui/icon-button'
import { Icon } from '@/shared/ui/icon'
import { cn } from '@/shared/lib/cn'
import { IconCopy, IconDownload, IconPencil } from '@tabler/icons-react'

export function ExportBar({
  fileName,
  onFileNameChange,
  onCopyMarkdown,
  onDownloadPdf,
  className,
}: {
  fileName: string
  onFileNameChange: (nextBaseName: string) => void
  onCopyMarkdown?: () => void
  onDownloadPdf?: () => void
  className?: string
}) {
  const pdfSuffixMatch = /\.pdf$/i.exec(fileName)
  const baseFileName = pdfSuffixMatch ? fileName.slice(0, -pdfSuffixMatch[0].length) : fileName
  const fileSuffix = pdfSuffixMatch ? pdfSuffixMatch[0] : ''
  const [isEditing, setIsEditing] = React.useState(false)
  const [draftFileName, setDraftFileName] = React.useState(baseFileName)
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  // Keep the inline editor aligned with the currently active document title unless the user is actively renaming the chip.
  React.useEffect(() => {
    if (!isEditing) {
      setDraftFileName(baseFileName)
    }
  }, [baseFileName, isEditing])

  // Focus the chip input as soon as the user enters rename mode so the filename can be edited in place without an extra click.
  React.useEffect(() => {
    if (!isEditing) {
      return
    }

    inputRef.current?.focus()
    inputRef.current?.select()
  }, [isEditing])

  // Commit the in-place filename edit back to the workspace controller so the active document keeps the custom title until the user changes it again.
  const commitEdit = () => {
    const nextValue = draftFileName.trim() || baseFileName
    onFileNameChange(nextValue)
    setIsEditing(false)
  }

  // Keep the export controls as separate chips so the lower-right corner matches the Figma treatment more closely.
  return (
    <div
      className={cn(
        'absolute bottom-3 right-3 z-10 inline-flex items-center gap-2',
        className
      )}
    >
      {isEditing ? (
        <div className="flex h-11 items-center gap-2 rounded-full border border-transparent bg-[color:var(--color-sidebar-surface)] px-4 text-[18px] leading-[25px] font-normal text-white">
          <input
            ref={inputRef}
            value={draftFileName}
            onChange={(event) => setDraftFileName(event.target.value)}
            onBlur={commitEdit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                commitEdit()
              }

              if (event.key === 'Escape') {
                event.preventDefault()
                setDraftFileName(baseFileName)
                setIsEditing(false)
              }
            }}
            className="min-w-0 flex-1 border-none bg-transparent p-0 text-[18px] leading-[25px] font-normal text-white outline-none placeholder:text-white/60"
            aria-label="Edit export file name"
          />
          {fileSuffix ? <span className="shrink-0 opacity-60">{fileSuffix}</span> : null}
        </div>
      ) : (
        <button
          type="button"
          className="flex h-11 items-center gap-2 rounded-full border border-transparent bg-[color:var(--color-sidebar-surface)] px-4 text-[18px] leading-[25px] font-normal text-white hover:bg-[color:var(--color-sidebar-surface)] active:bg-[color:var(--color-sidebar-surface)]"
          onClick={() => {
            setDraftFileName(baseFileName)
            setIsEditing(true)
          }}
        >
          <span className="min-w-0 truncate font-normal">{baseFileName}</span>
          {fileSuffix ? <span className="shrink-0 opacity-60">{fileSuffix}</span> : null}
          <Icon icon={IconPencil} size="md" tone="white" />
        </button>
      )}
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
