"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value = 0, ...props }, ref) => {
  const clampedValue = Math.max(0, Math.min(100, value));
  const fillStyle = {
    "--meter-fill": `${clampedValue}%`,
  } as React.CSSProperties;

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn("ui-meter h-4 w-full bg-secondary", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="ui-meter__fill h-full bg-primary"
        style={fillStyle}
      />
    </ProgressPrimitive.Root>
  );
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
