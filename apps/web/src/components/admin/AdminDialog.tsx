/**
 * AdminDialog.tsx - Admin Dialog Component
 * 
 * Location: apps/web/src/ → Components/ → Admin Components → AdminDialog.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Admin dialog component. Provides:
 * - Standardized admin dialog interface
 * - Loading states
 * - Action buttons
 * 
 * Related Files:
 * - apps/web/src/components/admin/ - Other admin components
 */

import { type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "default" | "outline" | "destructive";
  confirmLoading?: boolean;
  confirmDisabled?: boolean;
  onConfirm?: () => void;
  children?: ReactNode;
}

export const AdminDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "إلغاء",
  confirmVariant = "default",
  confirmLoading = false,
  confirmDisabled = false,
  onConfirm,
  children,
}: AdminDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description ? (
          <DialogDescription>{description}</DialogDescription>
        ) : null}
      </DialogHeader>
      {children}
      {(confirmLabel || onConfirm) && (
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={confirmLoading}>
            {cancelLabel}
          </Button>
          {confirmLabel ? (
            <Button
              variant={confirmVariant}
              onClick={onConfirm}
              disabled={confirmDisabled || confirmLoading}
            >
              {confirmLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {confirmLabel}
                </span>
              ) : (
                confirmLabel
              )}
            </Button>
          ) : null}
        </DialogFooter>
      )}
    </DialogContent>
  </Dialog>
);
