/**
 * AdminSearch.tsx - Admin Search Component
 * 
 * Location: apps/web/src/ → Components/ → Admin Components → utilities/ → AdminSearch.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Admin search component. Provides:
 * - Search input interface
 * - Search debouncing
 * - Search clearing
 * 
 * Related Files:
 * - Used in admin pages for search functionality
 */

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AdminSearchProps {
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
    onSearch?: (value: string) => void;
    debounceMs?: number;
    className?: string;
    showClearButton?: boolean;
}

export function AdminSearch({
    placeholder = 'البحث...',
    value: controlledValue,
    onChange,
    onSearch,
    debounceMs = 300,
    className,
    showClearButton = true,
}: AdminSearchProps) {
    const [internalValue, setInternalValue] = useState(controlledValue || '');
    const timeoutRef = useRef<NodeJS.Timeout>();

    const value = controlledValue !== undefined ? controlledValue : internalValue;

    useEffect(() => {
        if (controlledValue !== undefined) {
            setInternalValue(controlledValue);
        }
    }, [controlledValue]);

    const handleChange = (newValue: string) => {
        if (controlledValue === undefined) {
            setInternalValue(newValue);
        }
        onChange?.(newValue);

        // Debounce search
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            onSearch?.(newValue);
        }, debounceMs);
    };

    const handleClear = () => {
        handleChange('');
    };

    return (
        <div className={cn('relative', className)}>
            <Search className="absolute end-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => handleChange(e.target.value)}
                className={cn('pe-10', showClearButton && value && 'ps-10')}
            />
            {showClearButton && value && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="absolute start-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                >
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}
