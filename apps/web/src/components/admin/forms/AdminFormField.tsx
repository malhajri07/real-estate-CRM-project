/**
 * AdminFormField.tsx - Admin Form Field Component
 * 
 * Location: apps/web/src/ → Components/ → Admin Components → forms/ → AdminFormField.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Admin form field component. Provides:
 * - Standardized form field interface
 * - Multiple input types
 * - Label and error display
 * 
 * Related Files:
 * - Used in admin forms for form fields
 */

import { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface AdminFormFieldProps {
    label: string;
    name: string;
    type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea';
    value?: string | number;
    onChange?: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    error?: string;
    helperText?: string;
    disabled?: boolean;
    className?: string;
    rows?: number; // for textarea
    icon?: ReactNode;
}

export function AdminFormField({
    label,
    name,
    type = 'text',
    value,
    onChange,
    placeholder,
    required = false,
    error,
    helperText,
    disabled = false,
    className,
    rows = 4,
    icon,
}: AdminFormFieldProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onChange?.(e.target.value);
    };

    return (
        <div className={cn('space-y-2', className)}>
            <Label htmlFor={name} className="text-sm font-medium">
                {label}
                {required && <span className="text-red-500 mr-1">*</span>}
            </Label>

            <div className="relative">
                {icon && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                        {icon}
                    </div>
                )}

                {type === 'textarea' ? (
                    <Textarea
                        id={name}
                        name={name}
                        value={value}
                        onChange={handleChange}
                        placeholder={placeholder}
                        disabled={disabled}
                        rows={rows}
                        className={cn(
                            error && 'border-red-500 focus-visible:ring-red-500',
                            icon && 'pr-10'
                        )}
                    />
                ) : (
                    <Input
                        id={name}
                        name={name}
                        type={type}
                        value={value}
                        onChange={handleChange}
                        placeholder={placeholder}
                        disabled={disabled}
                        className={cn(
                            error && 'border-red-500 focus-visible:ring-red-500',
                            icon && 'pr-10'
                        )}
                    />
                )}
            </div>

            {error && (
                <p className="text-sm text-red-500">{error}</p>
            )}

            {helperText && !error && (
                <p className="text-sm text-muted-foreground">{helperText}</p>
            )}
        </div>
    );
}
