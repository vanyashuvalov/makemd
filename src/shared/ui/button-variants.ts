/**
 * File: src/shared/ui/button-variants.ts
 * Purpose: Shared button style recipe used by both server and client components.
 * Why it exists: style variants need to be reusable without importing from a client-only module.
 * What it does: exposes the canonical button class recipe for buttons with optional leading and trailing slots.
 * Connected to: `Button`, the workspace state switch, and any future button-like links.
 */
import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  [
    'box-border inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'rounded-full text-sm font-medium transition-[background-color,color,border-color] duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-50',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: 'border border-white/20 bg-[#3C64FF] text-white hover:bg-[#355cf2] active:bg-[#3458ec]',
        destructive:
          'border border-transparent bg-[color:var(--color-destructive)] text-white hover:bg-[#b94e40] active:bg-[#a9473b]',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'bg-transparent text-foreground hover:bg-muted active:bg-muted/80',
        outline: 'border border-border bg-card text-card-foreground hover:bg-muted active:bg-muted/80',
        sidebar: 'bg-sidebar-muted text-sidebar-foreground hover:bg-sidebar-border active:bg-sidebar-border/90',
        text:
          'bg-transparent text-sidebar-foreground/60 hover:bg-transparent hover:text-sidebar-foreground active:bg-transparent active:text-sidebar-foreground',
      },
      size: {
        default: 'h-12 px-5',
        sm: 'h-10 px-4',
        lg: 'h-14 px-6 text-base',
        icon: 'h-10 w-10 p-0',
        iconSm: 'h-8 w-8 p-0',
        primary: 'h-14 px-4 text-[18px] font-normal leading-[25px]',
        text: 'h-10 px-0 text-[18px] font-medium leading-[25px]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
)
