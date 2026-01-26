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
                className
            )}
            {...props}
        >
            {children}
        </SheetContent>
    );
});
AdminSheetContent.displayName = "AdminSheetContent";

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
            "sm:justify-start", // Often users want actions at the start or end, adjust as needed. 
            // Standard shadcn footer is 'sm:justify-end'. 
            // In RTL, justify-end puts it on the Left.
            // Usually we want Form actions on the Left (End) in RTL too?
            // Actually, 'justify-end' respects flex direction.
            // RTL flex-direction is row-reverse? No, usually just row, but Start is Right.
            // So 'justify-end' in RTL (row) puts items on the Left. Correct.
            // So we might not need to override this unless we want them on the Right (Start).
            // Let's keep specific overrides minimal unless we see a bug.
            className
        )}
        {...props}
    />
);
AdminSheetFooter.displayName = "AdminSheetFooter";

const AdminSheetTitle = SheetTitle;
const AdminSheetDescription = SheetDescription;
