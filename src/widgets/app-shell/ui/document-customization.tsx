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
import { documentFonts } from '@/widgets/editor-preview/ui/markdown-document-content'

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
      <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-md py-1 text-foreground [&::-webkit-details-marker]:hidden">
        <IconAdjustmentsHorizontal size={15} stroke={1.6} />
        Customize
      </summary>
      <section
        aria-label="Document appearance"
        className="absolute bottom-[calc(100%+12px)] left-0 max-h-[calc(100dvh-120px)] w-[320px] max-w-[calc(100vw-24px)] overflow-y-auto overscroll-contain rounded-2xl border border-black/10 bg-[#fffefa] p-5 text-[13px] text-[#252522] shadow-[0_8px_32px_#00000012]"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-medium">Make it yours</h2>
            <p className="mt-1 text-xs text-[#77766f]">
              Saved with this document
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Reset style"
              className="rounded-md px-1 py-1 text-xs text-[#77766f] hover:text-black"
              onClick={() => onChange({ ...defaultPdfOptions })}
            >
              Reset
            </button>
            <button
              type="button"
              aria-label="Close customization"
              onClick={() => {
                if (details.current) details.current.open = false
              }}
              className="rounded-md p-1.5 hover:bg-black/5"
            >
              <IconX size={17} />
            </button>
          </div>
        </div>
        <fieldset className="mb-5">
          <legend className="mb-2 text-xs text-[#77766f]">Style</legend>
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-black/[0.035] p-1">
            {Object.entries(documentPresets).map(([name, preset]) => {
              const selected = Object.entries(preset).every(
                ([key, value]) => options[key as keyof PdfOptions] === value
              )
              return (
                <button
                  type="button"
                  key={name}
                  aria-pressed={selected}
                  onClick={() => onChange({ ...options, ...preset })}
                  className={`rounded-md px-2 py-2.5 ${selected ? 'bg-white shadow-sm' : 'hover:bg-white/60'}`}
                  style={{ fontFamily: documentFonts[preset.font] }}
                >
                  {name}
                </button>
              )
            })}
          </div>
        </fieldset>
        <div className="space-y-4">
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
                  className="flex h-7 w-7 items-center justify-center rounded-full ring-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{ background: color }}
                >
                  {options.accent === name && (
                    <IconCheck size={14} color="white" stroke={2} />
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
        <div className="my-5 border-t border-black/[0.07]" />
        <div className="space-y-4">
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
        className="max-w-36 rounded-md bg-transparent py-1 pl-2 text-right outline-offset-4"
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
