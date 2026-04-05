/**
 * File: src/entities/document/model/mock.ts
 * Purpose: In-repo mock data that mirrors the states shown in the Figma board.
 * Why it exists: the first Next.js sketch needs realistic data before any backend or persistence layer is built.
 * What it does: normalizes the requested workspace state and returns the corresponding snapshot for rendering.
 * Connected to: the home page, sidebar, editor/preview widgets, and the state-switch links.
 */
import { createDocumentTitle, getDocumentStarterMarkdown } from './document-title'
import type { DocumentRecord, WorkspaceAccount, WorkspaceSnapshot, WorkspaceStateKey, WorkspaceWarning } from './types'

const starterMarkdown = getDocumentStarterMarkdown()

export const guestWorkspacePromptTitle = 'Paste text or drop file here'

export const guestWorkspaceWarning: WorkspaceWarning = {
  title: 'Saved on this device',
  description: 'Sign up to sync your history to the cloud',
}

const defaultAuthorizedAccount: WorkspaceAccount = {
  name: 'Intjivan',
  email: 'intjivan@gmail.com',
}

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

// Build the authorized snapshot on demand so server-side auth can swap in the current Supabase profile without mutating shared mock objects.
function createAuthorizedSnapshot(account: WorkspaceAccount = defaultAuthorizedAccount): WorkspaceSnapshot {
  return {
    state: 'authorized',
    account,
    documents: [
      createMockDocument('doc-1', new Date(2026, 2, 23, 12, 32), '23 Mar • 12:32', starterMarkdown),
      createMockDocument('doc-2', new Date(2026, 2, 23, 12, 45), '23 Mar • 12:45', starterMarkdown),
      createMockDocument('doc-3', new Date(2026, 2, 23, 13, 1), '23 Mar • 13:01', starterMarkdown, {
        active: true,
        withMenu: true,
      }),
      createMockDocument('doc-4', new Date(2026, 2, 23, 13, 12), '23 Mar • 13:12', starterMarkdown),
    ],
    favorites: [],
    editor: {
      markdown: starterMarkdown,
    },
  }
}

// Create the guest workspace snapshot from the current moment so the first document looks freshly created rather than copied from static mock data.
function createGuestSnapshot(state: 'unauthorized' | 'empty'): WorkspaceSnapshot {
  const now = new Date()
  const sharedMarkdown =
    state === 'unauthorized'
      ? `# ${guestWorkspacePromptTitle}\n\nStart typing or drop a file to begin.`
      : `# ${guestWorkspacePromptTitle}`

  return {
    state,
    prompt: {
      title: guestWorkspacePromptTitle,
    },
    ...(state === 'unauthorized'
      ? {
          warning: guestWorkspaceWarning,
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
    favorites: [],
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

export function getWorkspaceSnapshot(state: WorkspaceStateKey, account?: WorkspaceAccount): WorkspaceSnapshot {
  // Return the in-repo mock snapshot that the UI widgets use for the current design-state preview.
  if (state === 'authorized') {
    return createAuthorizedSnapshot(account)
  }

  return createGuestSnapshot(state)
}
