import { toast as sonnerToast } from "sonner"

type ToastProps = {
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: "default" | "destructive" | null
  action?: React.ReactNode
}

function toast({ title, description, variant, ...props }: ToastProps) {
  if (variant === "destructive") {
    return sonnerToast.error(title, {
      description,
      ...props,
    })
  }

  // Default to success/neutral
  return sonnerToast.success(title, {
    description,
    ...props,
  })
}

function useToast() {
  return {
    toast,
    dismiss: (toastId?: string) => sonnerToast.dismiss(toastId),
    toasts: [], // Deprecated: Sonner manages its own state
  }
}

export { useToast, toast }
