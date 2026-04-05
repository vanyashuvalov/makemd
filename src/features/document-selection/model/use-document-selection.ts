/**
 * File: src/features/document-selection/model/use-document-selection.ts
 * Purpose: Shared selection state for the workspace document list.
 * Why it exists: the sidebar needs one source of truth for Ctrl-driven multi-select, selected ids, and bulk actions.
 * What it does: tracks pressed Ctrl, mirrors selected document ids, and exposes helpers for row and bulk selection.
 * Connected to: `WorkspaceShellClient`, the sidebar widget, document rows, and the bulk selection bar.
 */
'use client'

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import type { DocumentRecord } from '@/entities/document/model/types'
import { sortDocumentsByUpdatedAt } from '@/entities/document/model/document-updated'

export interface UseDocumentSelectionResult {
  documents: DocumentRecord[]
  hasSelection: boolean
  isCtrlPressed: boolean
  isAllSelected: boolean
  selectedCount: number
  selectionMode: boolean
  setAllSelected: (checked: boolean) => void
  setDocuments: Dispatch<SetStateAction<DocumentRecord[]>>
  toggleDocument: (documentId: string) => void
}

export function useDocumentSelection(initialDocuments: DocumentRecord[]): UseDocumentSelectionResult {
  const [documents, setDocuments] = useState(() => sortDocumentsByUpdatedAt(initialDocuments))
  const [isCtrlPressed, setIsCtrlPressed] = useState(false)

  // Keep the current document rows in local state so selection can react to Ctrl presses without touching the server snapshot.
  useEffect(() => {
    setDocuments(sortDocumentsByUpdatedAt(initialDocuments))
  }, [initialDocuments])

  // Mirror the physical Ctrl key so the list can swap file icons for checkboxes while the key is held down.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Control') {
        setIsCtrlPressed(true)
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Control') {
        setIsCtrlPressed(false)
      }
    }

    const handleWindowBlur = () => {
      setIsCtrlPressed(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleWindowBlur)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleWindowBlur)
    }
  }, [])

  const selectedCount = useMemo(
    () => documents.reduce((count, document) => count + (document.selected ? 1 : 0), 0),
    [documents]
  )

  const isAllSelected = documents.length > 0 && selectedCount === documents.length
  const selectionMode = isCtrlPressed || selectedCount > 0
  const hasSelection = selectedCount > 0

  const toggleDocument = (documentId: string) => {
    setDocuments((current) =>
      sortDocumentsByUpdatedAt(
        current.map((document) =>
          document.id === documentId ? { ...document, selected: !document.selected } : document
        )
      )
    )
  }

  const setAllSelected = (checked: boolean) => {
    setDocuments((current) =>
      sortDocumentsByUpdatedAt(current.map((document) => ({ ...document, selected: checked })))
    )
  }

  return {
    documents,
    hasSelection,
    isCtrlPressed,
    isAllSelected,
    selectedCount,
    selectionMode,
    setAllSelected,
    setDocuments,
    toggleDocument,
  }
}
