
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Clock, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import EmptyState from "@/components/ui/empty-state";
import PageHeader from "@/components/ui/page-header";
import { QueryErrorFallback } from "@/components/ui/query-error-fallback";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { PAGE_WRAPPER } from "@/config/platform-theme";
import { cn } from "@/lib/utils";
import { formatAdminDate } from "@/lib/formatters";
import type { Activity } from "@shared/types";
import { useMinLoadTime } from "@/hooks/useMinLoadTime";

export default function Activities() {
    const [searchQuery, setSearchQuery] = useState("");
    const { t, dir, language } = useLanguage();
    const showSkeleton = useMinLoadTime();
    const locale = language === "ar" ? "ar-SA" : "en-US";
    const iconSpacing = "me-2";

    const { data: activities, isLoading, isError, refetch } = useQuery<Activity[]>({
        queryKey: ["/api/activities"],
    });

    const filteredActivities = activities?.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isError) {
        return (
            <div className={PAGE_WRAPPER} dir={dir}>
                <PageHeader title={t("nav.activities") || "الأنشطة"} />
                <QueryErrorFallback message={t("activities.load_error") || "فشل تحميل الأنشطة"} onRetry={() => refetch()} />
            </div>
        );
    }

    if (isLoading || showSkeleton) {
        return (
            <div className={PAGE_WRAPPER} dir={dir}>
                <PageHeader title={t("nav.activities") || "الأنشطة"} />
                <TableSkeleton rows={5} cols={5} />
            </div>
        );
    }

    return (
        <div className={PAGE_WRAPPER} dir={dir}>
            <PageHeader title={`${t("nav.activities") || "الأنشطة"} (${filteredActivities?.length || 0})`}>
                <div className="flex items-center gap-2">
                    <div className="relative w-64">
                        <Search className="absolute end-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t("common.search")}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pe-9"
                        />
                    </div>
                    <Button>
                        <Plus className={iconSpacing} size={16} />
                        {t("activities.add_activity")}
                    </Button>
                </div>
            </PageHeader>

            <Card>
                <CardContent className="pt-6">
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
                        <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="text-start w-[80px]">{"الإجراءات"}</TableHead>
                                    <TableHead className="text-start">{"الحالة"}</TableHead>
                                    <TableHead className="text-start">{"التاريخ"}</TableHead>
                                    <TableHead className="text-start">{"النوع"}</TableHead>
                                    <TableHead className="text-start">{"العنوان"}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredActivities.map((activity) => (
                                    <TableRow key={activity.id}>
                                        <TableCell>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="sm" onClick={() => { }}>
                                                        <Check className="w-4 h-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>إكمال</TooltipContent>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={activity.completed ? "success" : "secondary"}>
                                                {activity.completed ? "مكتمل" : "قيد الانتظار"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-muted-foreground" />
                                                <span>
                                                    {activity.scheduledDate
                                                        ? formatAdminDate(activity.scheduledDate)
                                                        : "لا يوجد تاريخ"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">{activity.type}</Badge>
                                        </TableCell>
                                        <TableCell className="font-bold">
                                            {activity.title}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
