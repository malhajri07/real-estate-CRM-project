import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-brand-500/10 text-brand-700 dark:text-brand-200",
        secondary:
          "border-transparent bg-muted text-muted-foreground",
        destructive:
          "border-transparent bg-red-500/15 text-red-600",
        outline: "border-border text-foreground",
        success:
          "border-transparent bg-emerald-500/15 text-emerald-600",
        warning:
          "border-transparent bg-amber-500/15 text-amber-600",
        info:
          "border-transparent bg-sky-500/15 text-sky-600",
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
