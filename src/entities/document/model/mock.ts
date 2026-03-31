/**
 * File: src/entities/document/model/mock.ts
 * Purpose: In-repo mock data that mirrors the states shown in the Figma board.
 * Why it exists: the first Next.js sketch needs realistic data before any backend or persistence layer is built.
 * What it does: normalizes the requested workspace state and returns the corresponding snapshot for rendering.
 * Connected to: the home page, sidebar, editor/preview widgets, and the state-switch links.
 */
import type { WorkspaceSnapshot, WorkspaceStateKey } from './types'

const authorizedSnapshot: WorkspaceSnapshot = {
  state: 'authorized',
  account: {
    name: 'Intjivan',
    email: 'intjivan@gmail.com',
  },
  selection: {
    helperText: 'Hold Ctrl to select many',
  },
  documents: [
    {
      id: 'doc-1',
      title: 'Heading line here',
      updatedLabel: '23 Mar • 12:32',
    },
    {
      id: 'doc-2',
      title: 'Heading line here',
      updatedLabel: '23 Mar • 12:32',
    },
    {
      id: 'doc-3',
      title: 'Heading line here',
      updatedLabel: '23 Mar • 12:32',
      active: true,
      withMenu: true,
    },
    {
      id: 'doc-4',
      title: 'Heading line here',
      updatedLabel: '23 Mar • 12:32',
    },
  ],
  editor: {
    lines: [
      '# Paste Markdown here',
      '<sup style="display: inline-block;">**tip:** click on the pencil icon on the left to clear the editor</sup>',
      '---',
      'ok',
    ],
  },
  preview: {
    title: 'Paste Markdown here',
    note: 'tip: click on the pencil icon on the left to clear the editor',
    body: ['ok'],
  },
  exportFileName: 'Paste Markdown here.pdf',
}

const unauthorizedSnapshot: WorkspaceSnapshot = {
  state: 'unauthorized',
  prompt: {
    title: 'Sign up',
  },
  warning: {
    title: 'Closing current window will discard unsaved files!',
    description: 'Sign up to save your history',
  },
  documents: [
    {
      id: 'doc-1',
      title: 'Heading line here',
      updatedLabel: '23 Mar • 12:32',
    },
    {
      id: 'doc-2',
      title: 'Heading line here',
      updatedLabel: '23 Mar • 12:32',
      active: true,
      withMenu: true,
    },
  ],
  selection: {
    selectedCount: 2,
  },
  editor: {
    lines: [
      '# Paste Markdown here',
      '<sup style="display: inline-block;">**tip:** click on the pencil icon on the left to clear the editor</sup>',
      '---',
      'ok',
    ],
  },
  preview: {
    title: 'Paste Markdown here',
    note: 'tip: click on the pencil icon on the left to clear the editor',
    body: ['ok'],
  },
  exportFileName: 'Paste Markdown here.pdf',
}

const emptySnapshot: WorkspaceSnapshot = {
  state: 'empty',
  prompt: {
    title: 'Paste text or drop file here',
  },
  documents: [
    {
      id: 'doc-1',
      title: 'Paste text or drop file here',
      updatedLabel: 'Today • 12:32',
      active: true,
      withMenu: true,
    },
  ],
  editor: {
    lines: ['# Paste text or drop file here'],
  },
  preview: {
    title: 'Paste text or drop file here',
    body: [],
  },
  exportFileName: 'Paste text or drop file here.pdf',
}

const workspaceSnapshots: Record<WorkspaceStateKey, WorkspaceSnapshot> = {
  authorized: authorizedSnapshot,
  unauthorized: unauthorizedSnapshot,
  empty: emptySnapshot,
}

export function normalizeWorkspaceState(state: string | undefined): WorkspaceStateKey {
  // Fold arbitrary query-string values into the three design states captured in the Figma board.
  if (state === 'authorized' || state === 'unauthorized' || state === 'empty') {
    return state
  }

  return 'unauthorized'
}

export function getWorkspaceSnapshot(state: WorkspaceStateKey): WorkspaceSnapshot {
  // Return the in-repo mock snapshot that the UI widgets use for the current design-state preview.
  return workspaceSnapshots[state]
}
