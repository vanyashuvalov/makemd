/**
 * File: src/features/document-delete-confirmation/model/document-delete-confirmation.ts
 * Purpose: Shared rules for showing a destructive delete confirmation before documents are removed.
 * Why it exists: the workspace needs one reusable threshold and copy rule so single and bulk delete flows behave consistently.
 * What it does: decides when deletion needs confirmation and generates the wording for the warning dialog.
 * Connected to: the workspace shell delete handlers and the delete confirmation modal UI.
 */

import type { DocumentRecord } from '@/entities/document/model/types'

const DELETE_CONFIRMATION_THRESHOLD = 100

// Decide whether a delete action should ask for confirmation based on the selected documents' markdown size.
export function shouldConfirmDocumentDeletion(documents: DocumentRecord[]) {
  return documents.some((document) => (document.markdown ?? '').length > DELETE_CONFIRMATION_THRESHOLD)
}

// Build a title that matches the current delete scope so the warning dialog reads naturally for one or many documents.
export function getDocumentDeleteConfirmationTitle(documentCount: number) {
  return documentCount === 1 ? 'Delete document?' : `Delete ${documentCount} documents?`
}

// Build the warning copy for the destructive modal so the user understands the deletion is permanent.
export function getDocumentDeleteConfirmationDescription(documentCount: number) {
  if (documentCount === 1) {
    return 'This document is longer than 100 characters. Deleting it will permanently remove the content and it cannot be restored.'
  }

  return 'At least one selected document is longer than 100 characters. Deleting them will permanently remove the content and it cannot be restored.'
}
