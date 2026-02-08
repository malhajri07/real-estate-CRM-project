import * as React from "react";
import { Sheet, SheetPortal, SheetOverlay, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/**
 * AdminSheet - RTL-aware wrapper for Shadcn Sheet (Drawer)
 * Maps logical 'start'/'end' sides to physical 'right'/'left' for RTL context.
 */

const AdminSheet = Sheet;
const AdminSheetTrigger = SheetTrigger;
const AdminSheetClose = SheetClose;
const AdminSheetPortal = SheetPortal;
const AdminSheetOverlay = SheetOverlay;

interface AdminSheetContentProps
    extends Omit<React.ComponentPropsWithoutRef<typeof SheetContent>, "side"> {
    side?: "top" | "bottom" | "left" | "right" | "start" | "end";
}

const AdminSheetContent = React.forwardRef<
    React.ElementRef<typeof SheetContent>,
    AdminSheetContentProps
>(({ side = "start", className, children, ...props }, ref) => {
    // Logic to map logical side to physical side based on RTL
    // In RTL: Start is Right, End is Left.
    // We assume the app is running in RTL mode for the Admin Dashboard.

    let physicalSide: "top" | "bottom" | "left" | "right" = "right"; // Default to Start (Right)

    if (side === "top" || side === "bottom") {
        physicalSide = side;
    } else if (side === "start") {
        physicalSide = "right";
    } else if (side === "end") {
        physicalSide = "left";
    } else {
        // Fallback if they passed literal left/right
        physicalSide = side;
    }

    return (
        <SheetContent
            ref={ref}
            side={physicalSide}
            className={cn(
                // Ensure close button uses logical positioning override
                // Standard shadcn generic sheet might hardcode right-4.
                "[&>button]:right-auto [&>button]:end-4",
                "bg-white/85 backdrop-blur-2xl border-l border-white/20 shadow-2xl ring-1 ring-white/40", // Aurora Deluxe Drawer
                className
            )}
            {...props}
        >
            {children}
        </SheetContent>
    );
});
AdminSheetContent.displayName = "AdminSheetContent";

const AdminSheetHeader = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <SheetHeader
        className={cn("text-start", className)}
        {...props}
    />
);
AdminSheetHeader.displayName = "AdminSheetHeader";

const AdminSheetFooter = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <SheetFooter
        className={cn(
            "sm:justify-start",
            className
        )}
        {...props}
    />
);
AdminSheetFooter.displayName = "AdminSheetFooter";

const AdminSheetTitle = SheetTitle;
const AdminSheetDescription = SheetDescription;

export {
    AdminSheet,
    AdminSheetTrigger,
    AdminSheetClose,
    AdminSheetContent,
    AdminSheetHeader,
    AdminSheetFooter,
    AdminSheetTitle,
    AdminSheetDescription,
};
