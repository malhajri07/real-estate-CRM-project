
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Clock, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import type { Activity } from "@shared/types";
import { BUTTON_PRIMARY_CLASSES, PAGE_WRAPPER, TABLE_STYLES, BADGE_STYLES, LOADING_STYLES, EMPTY_STYLES, CARD_STYLES, TYPOGRAPHY, INPUT_STYLES, getIconSpacing } from "@/config/platform-theme";

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

    const getStatusBadgeColor = (completed: boolean) => {
        return completed ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700";
    };

    if (isLoading) {
        return (
            <div className={LOADING_STYLES.container} dir={dir}>
                <div className={LOADING_STYLES.text}>{t("common.loading")}</div>
            </div>
        );
    }

    return (
        <div className={PAGE_WRAPPER} dir={dir}>
            <Card className={CARD_STYLES.container}>
                <CardHeader className={CARD_STYLES.header}>
                    <div className="flex items-center justify-between">
                        <CardTitle className={TYPOGRAPHY.cardTitle}>
                            {t("nav.activities")} ({filteredActivities?.length || 0})
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative w-64">
                                <Search className={cn("absolute top-3 h-4 w-4 text-slate-500", dir === "rtl" ? "right-3" : "left-3")} />
                                <Input
                                    placeholder={t("common.search")}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={cn(INPUT_STYLES.search, dir === "rtl" ? "pr-9" : "pl-9")}
                                />
                            </div>
                            <Button className={BUTTON_PRIMARY_CLASSES}>
                                <Plus className={iconSpacing} size={16} />
                                {t("activities.add_activity")}
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className={CARD_STYLES.content}>
                    {!filteredActivities || filteredActivities.length === 0 ? (
                        <div className={cn(EMPTY_STYLES.container, "text-center")}>
                            <div className={cn(EMPTY_STYLES.description, "mb-4")}>
                                {searchQuery ? t("common.no_results") : t("activities.no_activities")}
                            </div>
                            {!searchQuery && (
                                <Button className={BUTTON_PRIMARY_CLASSES}>
                                    <Plus className={iconSpacing} size={16} />
                                    {t("activities.create_first")}
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
                            <Table className={TABLE_STYLES.container}>
                                <TableHeader className={cn(TABLE_STYLES.header, "bg-slate-50")}>
                                    <TableRow>
                                        <TableHead className={cn(TABLE_STYLES.headerCell, "text-end")}>{t("activities.table.title")}</TableHead>
                                        <TableHead className={cn(TABLE_STYLES.headerCell, "text-end")}>{t("activities.table.type")}</TableHead>
                                        <TableHead className={cn(TABLE_STYLES.headerCell, "text-end")}>{t("activities.table.date")}</TableHead>
                                        <TableHead className={cn(TABLE_STYLES.headerCell, "text-end")}>{t("activities.table.status")}</TableHead>
                                        <TableHead className={cn(TABLE_STYLES.headerCell, "text-end w-[100px]")}>{t("activities.table.actions")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className={TABLE_STYLES.body}>
                                    {filteredActivities.map((activity) => (
                                        <TableRow key={activity.id} className="divide-y divide-slate-200">
                                            <TableCell className={cn(TABLE_STYLES.cell, "text-end font-medium")}>
                                                {activity.title}
                                            </TableCell>
                                            <TableCell className={cn(TABLE_STYLES.cell, "text-end")}>
                                                <Badge variant="outline" className="capitalize">{activity.type}</Badge>
                                            </TableCell>
                                            <TableCell className={cn(TABLE_STYLES.cell, "text-end")}>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-slate-500" />
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
                                            <TableCell className={cn(TABLE_STYLES.cell, "text-end")}>
                                                <Badge className={cn(BADGE_STYLES.base, getStatusBadgeColor(!!activity.completed))}>
                                                    {activity.completed ? t("status.completed") : t("status.pending")}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className={cn(TABLE_STYLES.cell, "text-end")}>
                                                <Button variant="ghost" size="sm" onClick={() => { }}>
                                                    <Check className="w-4 h-4" />
                                                </Button>
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
