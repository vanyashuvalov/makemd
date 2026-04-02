'use client'

/**
 * File: src/features/document-create/ui/create-document-button.tsx
 * Purpose: Dedicated create-new-document action for the sidebar.
 * Why it exists: the Figma layout gives the create action a dominant visual treatment so starting a new draft is obvious.
 * What it does: wraps the shared button primitive with a plus icon and the expected label.
 * Connected to: sidebar composition and any future document creation workflow.
 */
import { Button } from '@/shared/ui/button'
import { Icon } from '@/shared/ui/icon'
import { IconPlus } from '@tabler/icons-react'

export interface CreateDocumentButtonProps {
  onClick?: () => void
}

export function CreateDocumentButton({ onClick }: CreateDocumentButtonProps) {
  // Render the primary new-document action with the same pill proportion shown in the design board.
  return (
    <Button
      variant="primary"
      size="primary"
      className="w-full"
      before={<Icon icon={IconPlus} size="md" />}
      onClick={onClick}
    >
      New
    </Button>
  )
}
