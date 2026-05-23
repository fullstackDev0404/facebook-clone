import * as React from 'react'

export type DialogContentProps = React.PropsWithChildren<{
  showCloseButton?: boolean
  className?: string
  style?: React.CSSProperties
  open?: boolean
  onOpenChange?: (open: boolean) => void
}>

export const Dialog: React.ComponentType<DialogContentProps>
export const DialogTrigger: React.ComponentType<React.HTMLAttributes<HTMLElement>>
export const DialogPortal: React.ComponentType<React.HTMLAttributes<HTMLElement>>
export const DialogClose: React.ComponentType<React.HTMLAttributes<HTMLElement>>
export const DialogOverlay: React.ComponentType<React.HTMLAttributes<HTMLElement>>
export const DialogContent: React.ComponentType<DialogContentProps>
export const DialogHeader: React.ComponentType<React.HTMLAttributes<HTMLElement>>
export const DialogFooter: React.ComponentType<React.HTMLAttributes<HTMLElement>>
export const DialogTitle: React.ComponentType<React.HTMLAttributes<HTMLElement>>
export const DialogDescription: React.ComponentType<React.HTMLAttributes<HTMLElement>>
