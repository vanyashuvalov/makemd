/**
 * File: src/entities/document/model/mock.ts
 * Purpose: In-repo mock data that mirrors the states shown in the Figma board.
 * Why it exists: the first Next.js sketch needs realistic data before any backend or persistence layer is built.
 * What it does: normalizes the requested workspace state and returns the corresponding snapshot for rendering.
 * Connected to: the home page, sidebar, editor/preview widgets, and the state-switch links.
 */
import { createDocumentTitle, getDocumentStarterMarkdown } from './document-title'
import type { DocumentRecord, WorkspaceSnapshot, WorkspaceStateKey } from './types'

const starterMarkdown = getDocumentStarterMarkdown()

// Build a mocked document row from a fixed local date so the fixture titles stay timestamp-based without duplicating the formatting rule.
function createMockDocument(
  id: string,
  date: Date,
  updatedLabel: string,
  markdown: string,
  options: Partial<Pick<DocumentRecord, 'active' | 'withMenu'>> = {}
) {
  return {
    id,
    title: createDocumentTitle(date),
    updatedLabel,
    markdown,
    ...options,
  }
}

const authorizedSnapshot: WorkspaceSnapshot = {
  state: 'authorized',
  account: {
    name: 'Intjivan',
    email: 'intjivan@gmail.com',
  },
  documents: [
    createMockDocument('doc-1', new Date(2026, 2, 23, 12, 32), `23 Mar \u2022 12:32`, starterMarkdown),
    createMockDocument('doc-2', new Date(2026, 2, 23, 12, 45), `23 Mar \u2022 12:45`, starterMarkdown),
    createMockDocument('doc-3', new Date(2026, 2, 23, 13, 1), `23 Mar \u2022 13:01`, starterMarkdown, {
      active: true,
      withMenu: true,
    }),
    createMockDocument('doc-4', new Date(2026, 2, 23, 13, 12), `23 Mar \u2022 13:12`, starterMarkdown),
  ],
  templates: [
    {
      id: 'template-1',
      title: 'Resume starter',
      description: 'Clean one-page resume layout with headings and compact sections.',
      markdown: `# Resume starter\n\n## Summary\n\nWrite your summary here.\n\n## Experience\n\n- Role\n- Impact\n`,
    },
    {
      id: 'template-2',
      title: 'Project brief',
      description: 'Simple structure for product specs, outcomes, and action items.',
      markdown: `# Project brief\n\n## Problem\n\nDescribe the problem.\n\n## Plan\n\n- Step one\n- Step two\n`,
    },
  ],
  editor: {
    markdown: starterMarkdown,
  },
}

const unauthorizedSnapshot: WorkspaceSnapshot = {
  state: 'unauthorized',
  prompt: {
    title: 'Paste text or drop file here',
  },
  warning: {
    title: 'Closing current window will discard unsaved files!',
    description: 'Sign up to save your history',
  },
  documents: [
    createMockDocument(
      'doc-1',
      new Date(2026, 3, 4, 12, 32),
      `Today \u2022 12:32`,
      `# Paste text or drop file here\n\nStart typing or drop a file to begin.`,
      {
        active: true,
        withMenu: true,
      }
    ),
  ],
  selection: {
    helperText: 'Hold Ctrl to select many',
  },
  editor: {
    markdown: `# Paste text or drop file here\n\nStart typing or drop a file to begin.`,
  },
}

const emptySnapshot: WorkspaceSnapshot = {
  state: 'empty',
  prompt: {
    title: 'Paste text or drop file here',
  },
  documents: [
    createMockDocument('doc-1', new Date(2026, 3, 4, 12, 32), `Today \u2022 12:32`, '# Paste text or drop file here', {
      active: true,
      withMenu: true,
    }),
  ],
  editor: {
    markdown: '# Paste text or drop file here',
  },
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
