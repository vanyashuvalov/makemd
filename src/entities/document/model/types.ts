/**
 * File: src/entities/document/model/types.ts
 * Purpose: Shared document and workspace types for the mockups and future data model.
 * Why it exists: the UI needs one canonical type shape for documents, selection, and preview state.
 * What it does: describes the Figma-inspired document entity without tying it to any storage layer yet.
 * Connected to: `mock.ts`, document list components, the sidebar, and the editor/preview widgets.
 */
export type WorkspaceStateKey = 'authorized' | 'unauthorized' | 'empty'
export type WorkspaceSidebarSection = 'history' | 'templates'

export type WorkspaceAccount = {
  name: string
  email: string
  avatarSrc?: string
}

export type DocumentRecord = {
  id: string
  title: string
  updatedLabel: string
  markdown?: string
  selected?: boolean
  active?: boolean
  withMenu?: boolean
}

export type WorkspaceTemplate = {
  id: string
  title: string
  description: string
  markdown: string
}

export type WorkspacePrompt = {
  title: string
  subtitle?: string
}

export type WorkspaceWarning = {
  title: string
  description: string
}

export type WorkspaceSelection = {
  helperText?: string
  selectedCount?: number
}

export type WorkspaceEditor = {
  markdown: string
}

export type WorkspaceSnapshot = {
  state: WorkspaceStateKey
  account?: WorkspaceAccount
  prompt?: WorkspacePrompt
  warning?: WorkspaceWarning
  selection?: WorkspaceSelection
  documents: DocumentRecord[]
  templates?: WorkspaceTemplate[]
  editor: WorkspaceEditor
}
