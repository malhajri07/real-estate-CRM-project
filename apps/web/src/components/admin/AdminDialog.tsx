import * as React from "react";
import {
    AdminDialog as Dialog,
    AdminDialogContent,
    AdminDialogHeader,
    AdminDialogFooter,
    AdminDialogTitle,
    AdminDialogDescription,
} from "./ui/AdminDialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface AdminDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    children?: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm?: () => void;
    confirmVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    confirmDisabled?: boolean;
    confirmLoading?: boolean;
    showFooter?: boolean;
    maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

export function AdminDialog({
    open,
    onOpenChange,
    title,
    description,
    children,
    confirmLabel = "تأكيد",
    cancelLabel = "إلغاء",
    onConfirm,
    confirmVariant = "default",
    confirmDisabled = false,
    confirmLoading = false,
    showFooter = true,
    maxWidth = "lg",
}: AdminDialogProps) {
    const maxWidthClass = {
        sm: "sm:max-w-sm",
        md: "sm:max-w-md",
        lg: "sm:max-w-lg",
        xl: "sm:max-w-xl",
        "2xl": "sm:max-w-2xl",
        full: "sm:max-w-[95vw]",
    }[maxWidth];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <AdminDialogContent className={maxWidthClass}>
                <AdminDialogHeader>
                    <AdminDialogTitle>{title}</AdminDialogTitle>
                    {description && <AdminDialogDescription>{description}</AdminDialogDescription>}
                </AdminDialogHeader>

                <div className="py-4">
                    {children}
                </div>

                {showFooter && (
                    <AdminDialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={confirmLoading}
                        >
                            {cancelLabel}
                        </Button>
                        {onConfirm && (
                            <Button
                                variant={confirmVariant}
                                onClick={onConfirm}
                                disabled={confirmDisabled || confirmLoading}
                            >
                                {confirmLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" />}
                                {confirmLabel}
                            </Button>
                        )}
                    </AdminDialogFooter>
                )}
            </AdminDialogContent>
        </Dialog>
    );
}
