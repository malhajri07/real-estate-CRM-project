import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/**
 * AdminDialog - Now implemented as a bottom drawer (Sheet side="bottom")
 * for a unified mobile-first UX. Drop-in replacement for the old centered Dialog.
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
        className={cn(
            "max-h-[85vh] rounded-t-2xl overflow-y-auto",
            "bg-card border-t border-border shadow-lg",
            className
        )}
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
        className={cn("text-start", className)}
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
            "flex flex-col-reverse sm:flex-row sm:justify-end gap-2",
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
