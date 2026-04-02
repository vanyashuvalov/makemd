'use client'

/**
 * File: src/entities/template/ui/template-list.tsx
 * Purpose: Template library surface shown in the authenticated sidebar tab.
 * Why it exists: templates are a separate collection from documents and need their own visual and interaction model.
 * What it does: renders available templates and exposes a single action to create a new document from a template.
 * Connected to: the authenticated sidebar tab state, workspace creation flow, and the workspace snapshot templates array.
 */
import { IconFileText } from '@tabler/icons-react'
import type { WorkspaceTemplate } from '@/entities/document/model/types'
import { Button } from '@/shared/ui/button'
import { Icon } from '@/shared/ui/icon'
import { cn } from '@/shared/lib/cn'

export interface TemplateListProps {
  items: WorkspaceTemplate[]
  onUseTemplate: (templateId: string) => void
}

export function TemplateList({ items, onUseTemplate }: TemplateListProps) {
  // Render the authenticated template library as a separate collection so it can later plug into server-backed template persistence.
  if (items.length === 0) {
    return (
      <div className="rounded-[1rem] border border-sidebar-border bg-white/5 p-4 text-sm text-sidebar-muted-foreground">
        No templates yet.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <article
          key={item.id}
          className={cn(
            'group rounded-[1rem] border border-sidebar-border bg-white/[0.04] p-4 transition-[background-color,border-color] duration-150 hover:bg-white/[0.07] hover:border-white/10'
          )}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-sidebar-foreground/60 group-hover:text-sidebar-foreground">
              <Icon icon={IconFileText} size="md" />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="space-y-1">
                <h3 className="truncate text-[18px] font-normal leading-[22px] text-sidebar-foreground">
                  {item.title}
                </h3>
                <p className="text-[14px] leading-[17px] text-sidebar-muted-foreground">
                  {item.description}
                </p>
              </div>
              <Button variant="secondary" size="sm" className="w-full" onClick={() => onUseTemplate(item.id)}>
                Use template
              </Button>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
