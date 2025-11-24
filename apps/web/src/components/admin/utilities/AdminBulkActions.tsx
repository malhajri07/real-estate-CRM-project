import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BulkAction {
    label: string;
    icon?: ReactNode;
    onClick: () => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary';
    disabled?: boolean;
}

interface AdminBulkActionsProps {
    selectedCount: number;
    actions: BulkAction[];
    onClear?: () => void;
    className?: string;
}

export function AdminBulkActions({
    selectedCount,
    actions,
    onClear,
    className,
}: AdminBulkActionsProps) {
    if (selectedCount === 0) return null;

    return (
        <div
            className={cn(
                'bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between',
                className
            )}
        >
            <div className="flex items-center gap-4">
                <div className="text-sm text-blue-900">
                    تم تحديد <span className="font-bold">{selectedCount}</span>{' '}
                    {selectedCount === 1 ? 'عنصر' : 'عناصر'}
                </div>
                {onClear && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClear}
                        className="h-7 text-blue-700 hover:text-blue-900 hover:bg-blue-100"
                    >
                        <X className="h-4 w-4 ml-1" />
                        إلغاء التحديد
                    </Button>
                )}
            </div>

            <div className="flex items-center gap-2">
                {actions.map((action, index) => (
                    <Button
                        key={index}
                        variant={action.variant || 'outline'}
                        size="sm"
                        onClick={action.onClick}
                        disabled={action.disabled}
                        className={cn(
                            action.variant === 'destructive' && 'text-red-600 hover:text-red-700'
                        )}
                    >
                        {action.icon && <span className="ml-2">{action.icon}</span>}
                        {action.label}
                    </Button>
                ))}
            </div>
        </div>
    );
}
