'use client'

/**
 * File: src/features/document-create/ui/create-document-button.tsx
 * Purpose: Dedicated create-new-document action for the sidebar.
 * Why it exists: the Figma layout gives the create action a dominant visual treatment so starting a new draft is obvious.
 * What it does: wraps the shared button primitive with a plus icon and the expected label.
 * Connected to: sidebar composition and any future document creation workflow.
 */
import { IconPlus } from '@tabler/icons-react'
import { Button } from '@/shared/ui/button'

export function CreateDocumentButton() {
  // Render the primary new-document action with the same pill proportion shown in the design board.
  return (
    <Button
      variant="primary"
      size="primary"
      className="w-full"
      before={<IconPlus className="h-6 w-6 shrink-0" />}
    >
      New
    </Button>
  )
}
