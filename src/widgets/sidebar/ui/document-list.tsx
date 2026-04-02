/**
 * File: src/widgets/sidebar/ui/document-list.tsx
 * Purpose: Composite container for the sidebar's selection rail and document history stack.
 * Why it exists: the Figma layout treats the selection hint/actions and the list of documents as one visual block with a fixed gap.
 * What it does: groups the selection bar and history list into a single vertical container with the shared spacing contract.
 * Connected to: `DocumentSelectionBar`, `DocumentHistoryList`, and the sidebar widget that owns the document navigation area.
 */
'use client'

import { DocumentHistoryList } from '@/entities/document/ui/document-history-list'
import { DocumentSelectionBar } from '@/features/document-selection/ui/document-selection-bar'
import type { DocumentRecord } from '@/entities/document/model/types'

export interface DocumentListProps {
  documents: DocumentRecord[]
  selectionMode: boolean
  selectedCount: number
  totalCount: number
  helperText?: string
  onOpenDocument?: (documentId: string) => void
  onToggleAllSelection: (checked: boolean) => void
  onToggleDocument: (documentId: string) => void
}

export function DocumentList({
  documents,
  selectionMode,
  selectedCount,
  totalCount,
  helperText,
  onOpenDocument,
  onToggleAllSelection,
  onToggleDocument,
}: DocumentListProps) {
  // Keep the selection rail and history list inside one visual group so the gap and stacking order stay consistent with the Figma document list block.
  return (
    <div className="space-y-4">
      <DocumentSelectionBar
        mode={selectedCount > 0 ? 'actions' : 'hint'}
        selectedCount={selectedCount}
        totalCount={totalCount}
        helperText={helperText}
        onToggleAllSelection={onToggleAllSelection}
      />
      <DocumentHistoryList
        items={documents}
        selectionMode={selectionMode}
        onOpenItem={onOpenDocument}
        onToggleItem={onToggleDocument}
      />
    </div>
  )
}
