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
  options: Partial<Pick<DocumentRecord, 'active' | 'withMenu'>> = {},
  title = createDocumentTitle(date)
) {
  return {
    id,
    title,
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

// Create the guest workspace snapshot from the current moment so the first document looks freshly created rather than copied from static mock data.
function createGuestSnapshot(state: 'unauthorized' | 'empty'): WorkspaceSnapshot {
  const now = new Date()
  const sharedMarkdown = state === 'unauthorized'
    ? `# Paste text or drop file here\n\nStart typing or drop a file to begin.`
    : '# Paste text or drop file here'

  return {
    state,
    prompt: {
      title: 'Paste text or drop file here',
    },
    ...(state === 'unauthorized'
      ? {
        warning: {
            title: 'Saved on this device',
            description: 'Sign up to sync your history to the cloud',
          },
          selection: {
            helperText: 'Hold Ctrl to select many',
          },
        }
      : {}),
    documents: [
      createMockDocument('doc-1', now, 'Just now', sharedMarkdown, {
        active: true,
        withMenu: true,
      }),
    ],
    editor: {
      markdown: sharedMarkdown,
    },
  }
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
  if (state === 'authorized') {
    return authorizedSnapshot
  }

  return createGuestSnapshot(state)
}
