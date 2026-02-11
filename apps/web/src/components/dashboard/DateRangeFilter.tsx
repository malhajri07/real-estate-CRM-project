
import React, { useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { useLanguage } from '@/contexts/LanguageContext';

export function DateRangeFilter({
    className,
}: React.HTMLAttributes<HTMLDivElement>) {
    const [date, setDate] = useState<DateRange | undefined>({
        from: new Date(2024, 0, 20),
        to: new Date(2024, 0, 20),
    });
    const { language, t } = useLanguage();
    const locale = language === 'ar' ? arSA : enUS;

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[260px] justify-start text-end font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="ms-2 h-4 w-4" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "LLL dd, y", { locale })} -{" "}
                                    {format(date.to, "LLL dd, y", { locale })}
                                </>
                            ) : (
                                format(date.from, "LLL dd, y", { locale })
                            )
                        ) : (
                            <span>{t('common.pick_date') || 'اختر التاريخ'}</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
                        locale={locale}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}
