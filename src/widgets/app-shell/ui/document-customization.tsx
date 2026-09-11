'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { IconAdjustmentsHorizontal, IconX } from '@tabler/icons-react'
import { defaultPdfOptions, getDocumentMargins, type PdfOptions } from '@/widgets/editor-preview/model/pdf-options'
import { getDocumentTheme } from '@/widgets/editor-preview/model/pdf-theme'
import { IconButton } from '@/shared/ui/icon-button'

export function DocumentCustomization({ options, onChange }: {
  options: PdfOptions
  onChange: (value: PdfOptions) => void
}) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const trigger = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const id = useId()
  const colors = getDocumentTheme(options)
  const margins = getDocumentMargins(options)

  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      if (!trigger.current || !panel.current) return
      const anchor = trigger.current.getBoundingClientRect()
      const { width, height } = panel.current.getBoundingClientRect()
      const above = anchor.top - height - 12
      setPosition({
        left: Math.max(12, Math.min(anchor.right - width, window.innerWidth - width - 12)),
        top: Math.max(12, above >= 12 ? above : Math.min(anchor.bottom + 12, window.innerHeight - height - 12)),
      })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    panel.current?.focus({ preventScroll: true })
    const outside = (event: PointerEvent) => {
      const target = event.target as Node
      if (!panel.current?.contains(target) && !trigger.current?.contains(target)) setOpen(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        trigger.current?.focus()
      }
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', escape)
    }
  }, [open])

  return (
    <>
      <IconButton
        ref={trigger}
        aria-label="Edit document style"
        title="Edit style"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-haspopup="dialog"
        variant="outline"
        className="shrink-0 border-transparent bg-sidebar-surface text-white hover:bg-sidebar-surface active:bg-sidebar-surface"
        onClick={() => setOpen((value) => !value)}
      >
        <IconAdjustmentsHorizontal size={24} stroke={1.6} />
      </IconButton>
      {open && createPortal(
        <div
          ref={panel}
          id={id}
          role="dialog"
          tabIndex={-1}
          aria-label="Document style"
          className="fixed z-50 w-[300px] max-w-[calc(100vw-24px)] max-h-[calc(100dvh-24px)] overflow-y-auto rounded-[20px] bg-sidebar-surface p-5 text-sm text-sidebar-foreground shadow-none outline-none"
          style={position}
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-medium">Style</h2>
            <div className="flex items-center gap-3">
              <button type="button" className="cursor-pointer text-sidebar-muted-foreground hover:text-sidebar-foreground" onClick={() => onChange({ ...defaultPdfOptions })}>Reset</button>
              <IconButton size="icon" variant="ghost" aria-label="Close style menu" onClick={() => { setOpen(false); trigger.current?.focus() }}>
                <IconX size={20} />
              </IconButton>
            </div>
          </div>

          <label className="mb-3 flex min-h-10 items-center justify-between gap-4">
            <span>Font</span>
            <select aria-label="Font" value={options.font} onChange={(event) => onChange({ ...options, font: event.target.value as PdfOptions['font'] })} className="max-w-44 cursor-pointer rounded-lg bg-sidebar-surface py-2 text-right text-sm outline-offset-4 [color-scheme:dark]">
              <option value="sans">Inter</option>
              <option value="serif">Source Serif</option>
              <option value="mono">IBM Plex Mono</option>
            </select>
          </label>
          <Color label="Text color" value={colors.foreground} onChange={(textColor) => onChange({ ...options, textColor })} />
          <Color label="Background color" value={colors.background} onChange={(backgroundColor) => onChange({ ...options, backgroundColor })} />
          <div className="mt-5 space-y-5">
            <Spacing label="Left & right" value={margins.horizontal} onChange={(marginHorizontal) => onChange({ ...options, marginHorizontal })} />
            <Spacing label="Top & bottom" value={margins.top} onChange={(marginVertical) => onChange({ ...options, marginVertical })} />
          </div>
        </div>, document.body
      )}
    </>
  )
}

function Color({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4">
      <span>{label}</span>
      <span className="flex items-center gap-3">
        <span className="text-xs uppercase text-sidebar-muted-foreground">{value}</span>
        <input type="color" aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="h-7 w-7 cursor-pointer overflow-hidden rounded-full border border-white/20 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0 [&::-moz-color-swatch]:rounded-full [&::-moz-color-swatch]:border-0" />
      </span>
    </label>
  )
}

function Spacing({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between"><span>{label}</span><span className="text-xs tabular-nums text-sidebar-muted-foreground">{value} mm</span></span>
      <input type="range" aria-label={label} min={0} max={40} step={1} value={value} onChange={(event) => onChange(Number(event.target.value))} className="block h-6 w-full cursor-pointer accent-white" />
    </label>
  )
}
