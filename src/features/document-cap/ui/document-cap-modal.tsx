'use client'

/**
 * File: src/features/document-cap/ui/document-cap-modal.tsx
 * Purpose: Overflow dialog shown when the workspace reaches its document cap.
 * Why it exists: users need a clear recovery path when create actions are blocked, and the cleanup choice should be explicit instead of silent.
 * What it does: presents two cleanup actions for removing the oldest 1 or 10 documents before continuing the pending create flow.
 * Connected to: the workspace shell, the shared modal primitive, and the document-cap model.
 */

import { Button } from '@/shared/ui/button'
import { Modal } from '@/shared/ui/modal'

export interface DocumentCapModalProps {
  open: boolean
  documentCount: number
  onDeleteOldestOne: () => void
  onDeleteOldestTen: () => void
  onOpenChange: (open: boolean) => void
}

// Render the overflow modal so the user can free space intentionally before the next create or favorite-to-document action continues.
export function DocumentCapModal({
  open,
  documentCount,
  onDeleteOldestOne,
  onDeleteOldestTen,
  onOpenChange,
}: DocumentCapModalProps) {
  return (
    <Modal
      open={open}
      title="Document limit reached"
      description={`You can keep up to 100 documents. You currently have ${documentCount}. Delete the oldest 1 or 10 to continue.`}
      onOpenChange={onOpenChange}
    >
      <div className="flex flex-wrap items-center justify-end gap-3">
        <Button variant="text" size="primary" onClick={onDeleteOldestOne}>
          Delete oldest 1
        </Button>
        <Button variant="destructive" size="primary" onClick={onDeleteOldestTen}>
          Delete oldest 10
        </Button>
      </div>
    </Modal>
  )
}

