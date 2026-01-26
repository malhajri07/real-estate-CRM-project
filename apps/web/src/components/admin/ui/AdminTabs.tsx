import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/**
 * AdminTabs - RTL-aware wrapper for Shadcn Tabs
 * Ensures correct styling for RTL contexts.
 */

const AdminTabs = Tabs;

const AdminTabsList = React.forwardRef<
    React.ElementRef<typeof TabsList>,
    React.ComponentPropsWithoutRef<typeof TabsList>
>(({ className, ...props }, ref) => (
    <TabsList
        ref={ref}
        className={cn(
            "w-full justify-start", // Ensure tabs align to start (Right in RTL)
            className
        )}
        {...props}
    />
));
AdminTabsList.displayName = "AdminTabsList";

const AdminTabsTrigger = React.forwardRef<
    React.ElementRef<typeof TabsTrigger>,
    React.ComponentPropsWithoutRef<typeof TabsTrigger>
>(({ className, ...props }, ref) => (
    <TabsTrigger
        ref={ref}
        className={cn(
            // Add RTL-specific styling if needed, e.g. logical border radii
            "data-[state=active]:shadow-sm",
            className
        )}
        {...props}
    />
));
AdminTabsTrigger.displayName = "AdminTabsTrigger";

const AdminTabsContent = React.forwardRef<
    React.ElementRef<typeof TabsContent>,
    React.ComponentPropsWithoutRef<typeof TabsContent>
>(({ className, ...props }, ref) => (
    <TabsContent
        ref={ref}
        className={cn(
            "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            className
        )}
        {...props}
    />
));
AdminTabsContent.displayName = "AdminTabsContent";

export { AdminTabs, AdminTabsList, AdminTabsTrigger, AdminTabsContent };
