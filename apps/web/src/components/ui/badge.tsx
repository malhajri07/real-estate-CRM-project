import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-brand-500/10 text-brand-700",
        secondary:
          "border-transparent bg-muted text-muted-foreground",
        destructive:
          "border-transparent bg-destructive/100/15 text-destructive",
        outline: "border-border text-foreground",
        success:
          "border-transparent bg-primary/100/15 text-primary",
        warning:
          "border-transparent bg-[hsl(var(--warning)/0.1)]0/15 text-[hsl(var(--warning))]",
        info:
          "border-transparent bg-accent0/15 text-accent-foreground",
        orange:
          "border-transparent bg-[hsl(var(--warning)/0.1)]0/15 text-[hsl(var(--warning))]",
        purple:
          "border-transparent bg-secondary0/15 text-secondary-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
