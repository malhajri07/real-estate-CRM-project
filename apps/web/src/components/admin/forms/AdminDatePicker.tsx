/**
 * AdminDatePicker.tsx - Admin Date Picker Component
 * 
 * Location: apps/web/src/ → Components/ → Admin Components → forms/ → AdminDatePicker.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Admin date picker component. Provides:
 * - Date selection interface
 * - RTL support
 * - Date formatting
 * 
 * Related Files:
 * - Used in admin forms for date selection
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface AdminDatePickerProps {
    label?: string;
    value?: Date;
    onChange?: (date: Date | undefined) => void;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    error?: string;
    className?: string;
}

export function AdminDatePicker({
    label,
    value,
    onChange,
    placeholder = 'اختر تاريخ',
    disabled = false,
    required = false,
    error,
    className,
}: AdminDatePickerProps) {
    const [open, setOpen] = useState(false);

    return (
        <div className={cn('space-y-2', className)}>
            {label && (
                <Label className="text-sm font-medium">
                    {label}
                    {required && <span className="text-red-500 mr-1">*</span>}
                </Label>
            )}

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        disabled={disabled}
                        className={cn(
                            'w-full justify-start text-right font-normal',
                            !value && 'text-muted-foreground',
                            error && 'border-red-500'
                        )}
                    >
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {value ? format(value, 'PPP', { locale: ar }) : placeholder}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={value}
                        onSelect={(date) => {
                            onChange?.(date);
                            setOpen(false);
                        }}
                        locale={ar}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>

            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
}

export interface DateRange {
    from: Date | undefined;
    to: Date | undefined;
}

interface AdminDateRangePickerProps {
    label?: string;
    value?: DateRange;
    onChange?: (range: DateRange | undefined) => void;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    error?: string;
    className?: string;
}

export function AdminDateRangePicker({
    label,
    value,
    onChange,
    placeholder = 'اختر نطاق التاريخ',
    disabled = false,
    required = false,
    error,
    className,
}: AdminDateRangePickerProps) {
    const [open, setOpen] = useState(false);

    const formatRange = (range: DateRange | undefined) => {
        if (!range?.from) return placeholder;
        if (!range.to) return format(range.from, 'PPP', { locale: ar });
        return `${format(range.from, 'PPP', { locale: ar })} - ${format(range.to, 'PPP', { locale: ar })}`;
    };

    return (
        <div className={cn('space-y-2', className)}>
            {label && (
                <Label className="text-sm font-medium">
                    {label}
                    {required && <span className="text-red-500 mr-1">*</span>}
                </Label>
            )}

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        disabled={disabled}
                        className={cn(
                            'w-full justify-start text-right font-normal',
                            !value?.from && 'text-muted-foreground',
                            error && 'border-red-500'
                        )}
                    >
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {formatRange(value)}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="range"
                        selected={value}
                        onSelect={(range) => {
                            onChange?.(range as DateRange);
                            if (range?.from && range?.to) {
                                setOpen(false);
                            }
                        }}
                        locale={ar}
                        numberOfMonths={2}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>

            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
}
