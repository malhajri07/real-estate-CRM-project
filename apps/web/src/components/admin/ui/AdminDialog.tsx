/**
 * AdminDialog — Accessible modal dialog wrapper for admin CRUD forms, built on top of Sheet.
 *
 * Consumer: admin management pages (user-management, role-management, etc.).
 */
import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/**
 * AdminDialog - Bottom drawer (Sheet side="bottom") with centered text.
 * Drop-in replacement for the old centered Dialog.
 */

const AdminDialog = Sheet;
const AdminDialogTrigger = ({ children, ...props }: React.ComponentPropsWithoutRef<"button">) => (
  <button {...props}>{children}</button>
);
const AdminDialogClose = SheetClose;

const AdminDialogContent = React.forwardRef<
    HTMLDivElement,
    React.ComponentPropsWithoutRef<typeof SheetContent>
>(({ className, children, ...props }, ref) => (
    <SheetContent
        ref={ref}
        side="bottom"
        className={cn("bg-card border-t border-border shadow-lg", className)}
        {...props}
    >
        {children}
    </SheetContent>
));
AdminDialogContent.displayName = "AdminDialogContent";

const AdminDialogHeader = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <SheetHeader
        className={cn("text-center", className)}
        {...props}
    />
);
AdminDialogHeader.displayName = "AdminDialogHeader";

const AdminDialogFooter = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <SheetFooter
        className={cn(
            "flex flex-col-reverse gap-2 sm:flex-row sm:justify-center",
            className
        )}
        {...props}
    />
);
AdminDialogFooter.displayName = "AdminDialogFooter";

const AdminDialogTitle = SheetTitle;
const AdminDialogDescription = SheetDescription;

export {
    AdminDialog,
    AdminDialogTrigger,
    AdminDialogContent,
    AdminDialogHeader,
    AdminDialogFooter,
    AdminDialogTitle,
    AdminDialogDescription,
    AdminDialogClose,
};
