'use client'

/**
 * File: src/features/document-create/ui/create-document-button.tsx
 * Purpose: Dedicated create-new-document action for the sidebar.
 * Why it exists: the Figma layout gives the create action a dominant visual treatment so starting a new draft is obvious.
 * What it does: wraps the shared button primitive with a plus icon and the expected label.
 * Connected to: sidebar composition and any future document creation workflow.
 */
import { Plus } from 'lucide-react'
import { Button } from '@/shared/ui/button'

export function CreateDocumentButton() {
  // Render the primary new-document action with the same pill proportion shown in the design board.
  return (
    <Button size="lg" className="w-full rounded-full shadow-[0_10px_24px_rgba(79,116,255,0.3)]">
      <Plus className="h-5 w-5" />
      New
    </Button>
  )
}
