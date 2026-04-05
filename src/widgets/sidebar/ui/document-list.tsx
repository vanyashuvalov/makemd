/**
 * File: src/widgets/sidebar/ui/document-list.tsx
 * Purpose: Composite container for the sidebar's selection rail and document history stack.
 * Why it exists: the Figma layout treats the selection hint/actions and the list of documents as one visual block with a fixed gap.
 * What it does: groups the selection bar and history list into a single vertical container with the shared spacing contract.
 * Connected to: `DocumentSelectionBar`, `DocumentHistoryList`, and the sidebar widget that owns the document navigation area.
 */
'use client'

import type { DocumentRecord } from '@/entities/document/model/types'
import { DocumentHistoryList } from '@/entities/document/ui/document-history-list'
import { DocumentSelectionBar } from '@/features/document-selection/ui/document-selection-bar'
import { DocumentListLoading } from './document-list-loading'

export interface DocumentListProps {
  isLoading?: boolean
  showSelectionControls?: boolean
  documents: DocumentRecord[]
  selectionMode: boolean
  selectedCount: number
  totalCount: number
  helperText?: string
  highlightActiveDocument?: boolean
  canSaveToFavorites?: boolean
  onOpenDocument?: (documentId: string) => void
  onToggleAllSelection: (checked: boolean) => void
  onToggleDocument: (documentId: string) => void
  onDownloadDocument: (documentId: string) => void
  onDeleteDocument: (documentId: string) => void
  onRenameDocument: (documentId: string, nextTitle: string) => void
  onCopyMarkdownDocument: (documentId: string) => void
  onSaveToFavorites: (documentId: string) => void
  onDeleteSelected: () => void
  onDownloadSelected: () => void
  onCopyMarkdownSelected: () => void
}

export function DocumentList({
  isLoading = false,
  showSelectionControls = true,
  documents,
  selectionMode,
  selectedCount,
  totalCount,
  helperText,
  highlightActiveDocument = true,
  canSaveToFavorites = false,
  onOpenDocument,
  onToggleAllSelection,
  onToggleDocument,
  onDownloadDocument,
  onDeleteDocument,
  onRenameDocument,
  onCopyMarkdownDocument,
  onSaveToFavorites,
  onDeleteSelected,
  onDownloadSelected,
  onCopyMarkdownSelected,
}: DocumentListProps) {
  // Keep the selection rail and history list inside one visual group so the gap and stacking order stay consistent with the Figma document list block.
  if (isLoading) {
    return <DocumentListLoading />
  }

  return (
    <div className="space-y-4">
      {showSelectionControls ? (
        <DocumentSelectionBar
          mode={selectedCount > 0 ? 'actions' : 'hint'}
          selectedCount={selectedCount}
          totalCount={totalCount}
          helperText={helperText}
          onToggleAllSelection={onToggleAllSelection}
          onDeleteSelected={onDeleteSelected}
          onDownloadSelected={onDownloadSelected}
          onCopyMarkdownSelected={onCopyMarkdownSelected}
        />
      ) : null}
      <DocumentHistoryList
        items={documents}
        selectionMode={showSelectionControls ? selectionMode : false}
        highlightActiveDocument={highlightActiveDocument}
        canSaveToFavorites={canSaveToFavorites}
        onOpenItem={onOpenDocument}
        onToggleItem={onToggleDocument}
        onDownloadItem={onDownloadDocument}
        onDeleteItem={onDeleteDocument}
        onRenameItem={onRenameDocument}
        onCopyMarkdownItem={onCopyMarkdownDocument}
        onSaveToFavoritesItem={onSaveToFavorites}
      />
    </div>
  )
}
