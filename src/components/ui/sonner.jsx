// @ts-nocheck
"use client"

import { Toaster as Sonner } from "sonner"

function Toaster({ ...props }) {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        style: { width: '340px', backgroundColor: 'var(--color-card)' },
        className: 'max-w-[320px]',
        classNames: {
          toast:
            "group toast !bg-card !text-foreground !border-border shadow-lg rounded-xl font-sans",
          title: "group-[.toast]:text-foreground group-[.toast]:font-semibold",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "!bg-primary !text-primary-foreground rounded-lg font-semibold px-4 py-2 shrink-0 ms-auto border border-primary shadow-md",
          cancelButton:
            "!bg-secondary !text-muted-foreground rounded-lg border border-border",
          success:
            "!border-success/25 !bg-card",
          error:
            "!border-destructive/25 !bg-card",
          info:
            "!border-primary/20 !bg-card",
          icon: "group-[.toast]:text-primary",
          closeButton: "!bg-card !text-muted-foreground !border-border hover:!bg-muted",
        },
      }}
      richColors
      closeButton
      position="bottom-center"
      expand={false}
      duration={4200}
      {...props}
    />
  )
}

export { Toaster }
