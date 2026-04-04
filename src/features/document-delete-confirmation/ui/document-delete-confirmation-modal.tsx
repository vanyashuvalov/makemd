'use client'

/**
 * File: src/features/document-delete-confirmation/ui/document-delete-confirmation-modal.tsx
 * Purpose: Destructive confirmation dialog for long document deletions.
 * Why it exists: the workspace needs a reusable modal when deleting large documents so accidental data loss is harder.
 * What it does: asks the user to confirm a permanent delete action and exposes cancel/confirm controls.
 * Connected to: the workspace shell delete flow, the shared modal primitive, and the document deletion rules model.
 */

import { Button } from '@/shared/ui/button'
import { Modal } from '@/shared/ui/modal'
import {
  getDocumentDeleteConfirmationDescription,
  getDocumentDeleteConfirmationTitle,
} from '../model/document-delete-confirmation'

export interface DocumentDeleteConfirmationModalProps {
  open: boolean
  documentCount: number
  onCancel: () => void
  onConfirm: () => void
}

// Render a delete warning modal so the user can back out of destructive document removal when the content is large enough to deserve an extra check.
export function DocumentDeleteConfirmationModal({
  open,
  documentCount,
  onCancel,
  onConfirm,
}: DocumentDeleteConfirmationModalProps) {
  return (
    <Modal
      open={open}
      title={getDocumentDeleteConfirmationTitle(documentCount)}
      description={getDocumentDeleteConfirmationDescription(documentCount)}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onCancel()
        }
      }}
      >
      <div className="flex items-center justify-end gap-3 pt-4">
        <Button variant="text" size="primary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          size="primary"
          onClick={onConfirm}
        >
          Delete
        </Button>
      </div>
    </Modal>
  )
}
