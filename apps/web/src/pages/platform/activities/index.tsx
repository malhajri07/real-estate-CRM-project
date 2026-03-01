
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Clock, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import type { Activity } from "@shared/types";
import { PAGE_WRAPPER, getIconSpacing } from "@/config/platform-theme";

export default function Activities() {
    const [searchQuery, setSearchQuery] = useState("");
    const { t, dir, language } = useLanguage();
    const locale = language === "ar" ? "ar-SA" : "en-US";
    const iconSpacing = getIconSpacing(dir);

    const { data: activities, isLoading } = useQuery<Activity[]>({
        queryKey: ["/api/activities"],
    });

    const filteredActivities = activities?.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className={PAGE_WRAPPER} dir={dir}>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="w-full max-w-md space-y-4">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-8 w-1/2" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={PAGE_WRAPPER} dir={dir}>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>
                            {t("nav.activities")} ({filteredActivities?.length || 0})
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative w-64">
                                <Search className={cn("absolute top-3 h-4 w-4 text-muted-foreground", dir === "rtl" ? "right-3" : "left-3")} />
                                <Input
                                    placeholder={t("common.search")}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={dir === "rtl" ? "pr-9" : "pl-9"}
                                />
                            </div>
                            <Button>
                                <Plus className={iconSpacing} size={16} />
                                {t("activities.add_activity")}
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    {!filteredActivities || filteredActivities.length === 0 ? (
                        <EmptyState
                            title={searchQuery ? t("common.no_results") : t("activities.no_activities")}
                            description={!searchQuery ? t("activities.create_first") : undefined}
                            action={!searchQuery ? (
                                <Button>
                                    <Plus className={iconSpacing} size={16} />
                                    {t("activities.create_first")}
                                </Button>
                            ) : undefined}
                        />
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-end">{t("activities.table.title")}</TableHead>
                                    <TableHead className="text-end">{t("activities.table.type")}</TableHead>
                                    <TableHead className="text-end">{t("activities.table.date")}</TableHead>
                                    <TableHead className="text-end">{t("activities.table.status")}</TableHead>
                                    <TableHead className="text-end w-[100px]">{t("activities.table.actions")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredActivities.map((activity) => (
                                    <TableRow key={activity.id}>
                                        <TableCell className="text-end font-medium">
                                            {activity.title}
                                        </TableCell>
                                        <TableCell className="text-end">
                                            <Badge variant="outline" className="capitalize">{activity.type}</Badge>
                                        </TableCell>
                                        <TableCell className="text-end">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-muted-foreground" />
                                                <span>
                                                    {activity.scheduledDate
                                                        ? new Date(activity.scheduledDate).toLocaleDateString(locale)
                                                        : t("common.no_date")}
                                                    {' '}
                                                    {activity.scheduledDate
                                                        ? new Date(activity.scheduledDate).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
                                                        : ''}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-end">
                                            <Badge variant={activity.completed ? "success" : "secondary"}>
                                                {activity.completed ? t("status.completed") : t("status.pending")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-end">
                                            <Button variant="ghost" size="sm" onClick={() => { }}>
                                                <Check className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
