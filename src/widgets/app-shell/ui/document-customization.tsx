'use client'

import { useEffect, useRef } from 'react'
import {
  IconAdjustmentsHorizontal,
  IconX,
  IconCheck,
} from '@tabler/icons-react'
import {
  defaultPdfOptions,
  documentPresets,
  type PdfOptions,
} from '@/widgets/editor-preview/model/pdf-options'
import { documentAccentColors } from '@/widgets/editor-preview/model/pdf-theme'
import { Button } from '@/shared/ui/button'
import { IconButton } from '@/shared/ui/icon-button'

export function DocumentCustomization({
  options,
  onChange,
}: {
  options: PdfOptions
  onChange: (value: PdfOptions) => void
}) {
  const details = useRef<HTMLDetailsElement>(null)
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (details.current && !details.current.contains(event.target as Node))
        details.current.open = false
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && details.current?.open) {
        details.current.open = false
        details.current.querySelector('summary')?.focus()
      }
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', escape)
    }
  }, [])

  return (
    <details ref={details} className="group">
      <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-full px-3 text-sidebar-foreground hover:bg-sidebar-icon-hover [&::-webkit-details-marker]:hidden">
        <IconAdjustmentsHorizontal size={20} stroke={1.6} />
        Customize
      </summary>
      <section
        aria-label="Document appearance"
        className="absolute bottom-[calc(100%+12px)] left-0 max-h-[calc(100dvh-120px)] w-[360px] max-w-[calc(100vw-24px)] overflow-y-auto overscroll-contain rounded-[24px] border border-sidebar-border bg-sidebar-surface p-6 text-base text-sidebar-foreground shadow-none"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-medium">Customize</h2>
            <p className="mt-1 text-sm text-sidebar-muted-foreground">
              Saved with this document
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="text"
              size="sm"
              aria-label="Reset style"
              className="px-1"
              onClick={() => onChange({ ...defaultPdfOptions })}
            >
              Reset
            </Button>
            <IconButton
              size="sm"
              variant="ghost"
              aria-label="Close customization"
              onClick={() => {
                if (details.current) details.current.open = false
              }}
            >
              <IconX size={20} />
            </IconButton>
          </div>
        </div>
        <fieldset className="mb-5">
          <legend className="mb-3 text-sm text-sidebar-muted-foreground">Style</legend>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(documentPresets).map(([name, preset]) => {
              const selected = Object.entries(preset).every(
                ([key, value]) => options[key as keyof PdfOptions] === value
              )
              return (
                <Button
                  variant={selected ? 'primary' : 'sidebar'}
                  size="sm"
                  key={name}
                  aria-pressed={selected}
                  onClick={() => onChange({ ...options, ...preset })}
                  className="px-3"
                >
                  {name}
                </Button>
              )
            })}
          </div>
        </fieldset>
        <div className="space-y-2">
          <Option
            label="Font"
            value={options.font}
            onChange={(font) => onChange({ ...options, font })}
            choices={{ sans: 'Sans', serif: 'Serif', mono: 'Mono' }}
          />
          <Option
            label="Text size"
            ariaLabel="PDF text size"
            value={options.textSize}
            onChange={(textSize) => onChange({ ...options, textSize })}
            choices={{ small: 'Small', normal: 'Normal', large: 'Large' }}
          />
          <Option
            label="Line spacing"
            value={options.spacing}
            onChange={(spacing) => onChange({ ...options, spacing })}
            choices={{ relaxed: 'Relaxed', compact: 'Compact' }}
          />
          <fieldset className="flex items-center justify-between">
            <legend className="float-left">Accent</legend>
            <div className="flex gap-2">
              {Object.entries(documentAccentColors).map(([name, color]) => (
                <button
                  key={name}
                  type="button"
                  aria-label={`${name[0].toUpperCase() + name.slice(1)} accent`}
                  aria-pressed={options.accent === name}
                  onClick={() =>
                    onChange({
                      ...options,
                      accent: name as PdfOptions['accent'],
                    })
                  }
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-sidebar-checkbox-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  style={{ background: color }}
                >
                  {options.accent === name && (
                    <IconCheck size={16} color="white" stroke={2} />
                  )}
                </button>
              ))}
            </div>
          </fieldset>
          <Option
            label="Paper tone"
            value={options.surface}
            onChange={(surface) => onChange({ ...options, surface })}
            choices={{ white: 'White', warm: 'Warm' }}
          />
        </div>
        <div className="my-5 border-t border-white/10" />
        <div className="space-y-2">
          <Option
            label="Page size"
            ariaLabel="PDF paper size"
            value={options.paper}
            onChange={(paper) => onChange({ ...options, paper })}
            choices={{ A4: 'A4', Letter: 'Letter' }}
          />
          <Option
            label="Margins"
            ariaLabel="PDF margins"
            value={options.margins}
            onChange={(margins) => onChange({ ...options, margins })}
            choices={{ normal: 'Normal', compact: 'Compact' }}
          />
        </div>
      </section>
    </details>
  )
}

function Option<T extends string>({
  label,
  ariaLabel,
  value,
  onChange,
  choices,
}: {
  label: string
  ariaLabel?: string
  value: T
  onChange: (value: T) => void
  choices: Record<T, string>
}) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <select
        aria-label={ariaLabel ?? label}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="h-10 max-w-36 cursor-pointer rounded-full border border-white/10 bg-sidebar-icon px-3 text-sm text-sidebar-foreground outline-offset-4 [color-scheme:dark] focus-visible:outline-primary"
      >
        {Object.entries(choices).map(([key, text]) => (
          <option key={key} value={key}>
            {String(text)}
          </option>
        ))}
      </select>
    </label>
  )
}
