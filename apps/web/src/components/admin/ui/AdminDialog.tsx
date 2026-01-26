import * as React from "react";
import { Dialog, DialogPortal, DialogOverlay, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

/**
 * AdminDialog - RTL-aware wrapper for Shadcn Dialog
 * Enforces correct close button positioning and overlay behavior.
 */

const AdminDialog = Dialog;
const AdminDialogTrigger = DialogTrigger;
const AdminDialogPortal = DialogPortal;
const AdminDialogClose = DialogClose;

const AdminDialogContent = React.forwardRef<
    React.ElementRef<typeof DialogContent>,
    React.ComponentPropsWithoutRef<typeof DialogContent>
>(({ className, children, ...props }, ref) => (
    <DialogContent
        ref={ref}
        className={cn(
            "sm:max-w-lg",
            // Remove default absolute close button style if needed, or override it to start/end logic
            // Assuming standard shadcn uses absolute right-4 top-4.
            // In RTL, we want left-4 top-4 (which is end-4).
            // CSS logical properties: inset-inline-end-4
            "[&>button]:right-auto [&>button]:end-4",
            "data-[state=open]:duration-200", // Standardize duration
            className
        )}
        {...props}
    >
        {children}
    </DialogContent>
));
AdminDialogContent.displayName = "AdminDialogContent";

export {
    AdminDialog,
    AdminDialogTrigger,
    AdminDialogContent,
    AdminDialogHeader,
    AdminDialogFooter,
    AdminDialogTitle,
    AdminDialogDescription,
    AdminDialogClose
};

const AdminDialogHeader = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <DialogHeader
        className={cn("flex flex-col space-y-1.5 text-center sm:text-start", className)}
        {...props}
    />
);
AdminDialogHeader.displayName = "AdminDialogHeader";

const AdminDialogFooter = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <DialogFooter
        className={cn(
            "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 sm:space-x-reverse", // Logical spacing
            className
        )}
        {...props}
    />
);
AdminDialogFooter.displayName = "AdminDialogFooter";

const AdminDialogTitle = DialogTitle;
const AdminDialogDescription = DialogDescription;
