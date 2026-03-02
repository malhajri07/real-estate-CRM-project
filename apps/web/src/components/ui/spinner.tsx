import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const spinnerVariants = cva("animate-spin text-muted-foreground", {
  variants: {
    size: {
      default: "h-6 w-6",
      sm: "h-4 w-4",
      lg: "h-8 w-8",
      xl: "h-12 w-12",
    },
  },
  defaultVariants: {
    size: "default",
  },
})

interface SpinnerProps extends VariantProps<typeof spinnerVariants> {
  className?: string
}

function Spinner({ size, className }: SpinnerProps) {
  return <Loader2 className={cn(spinnerVariants({ size }), className)} />
}

export { Spinner, spinnerVariants }
