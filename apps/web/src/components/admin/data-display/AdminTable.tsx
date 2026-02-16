/**
 * AdminTable.tsx - Admin Table Component
 * 
 * Location: apps/web/src/ → Components/ → Admin Components → data-display/ → AdminTable.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Admin table component for data display. Provides:
 * - Sortable table
 * - Pagination
 * - Row selection
 * - Actions
 * 
 * Related Files:
 * - Used throughout admin pages for data tables
 */

import { ReactNode, useState, useMemo } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Search,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { AdminEmptyState } from './AdminEmptyState';

export interface AdminTableColumn<T> {
    key: string;
    label: string;
    sortable?: boolean;
    render?: (item: T) => ReactNode;
    className?: string;
}

interface AdminTableProps<T> {
    columns: AdminTableColumn<T>[];
    data: T[];
    keyExtractor: (item: T) => string;
    loading?: boolean;
    selectable?: boolean;
    onSelectionChange?: (selectedIds: string[]) => void;
    searchable?: boolean;
    searchPlaceholder?: string;
    emptyState?: ReactNode;
    className?: string;
    pageSize?: number;
}

type SortDirection = 'asc' | 'desc' | null;

export function AdminTable<T extends Record<string, any>>({
    columns,
    data,
    keyExtractor,
    loading = false,
    selectable = false,
    onSelectionChange,
    searchable = false,
    searchPlaceholder = 'البحث...',
    emptyState,
    className,
    pageSize = 10,
}: AdminTableProps<T>) {
    const { dir } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);

    // Filter data based on search term
    const filteredData = useMemo(() => {
        if (!searchTerm) return data;

        return data.filter((item) => {
            return Object.values(item).some((value) => {
                if (value === null || value === undefined) return false;
                return String(value).toLowerCase().includes(searchTerm.toLowerCase());
            });
        });
    }, [data, searchTerm]);

    // Sort data
    const sortedData = useMemo(() => {
        if (!sortColumn || !sortDirection) return filteredData;

        return [...filteredData].sort((a, b) => {
            const aValue = a[sortColumn];
            const bValue = b[sortColumn];

            if (aValue === bValue) return 0;

            const comparison = aValue < bValue ? -1 : 1;
            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [filteredData, sortColumn, sortDirection]);

    // Paginate data
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return sortedData.slice(startIndex, startIndex + pageSize);
    }, [sortedData, currentPage, pageSize]);

    const totalPages = Math.ceil(sortedData.length / pageSize);

    const handleSort = (columnKey: string) => {
        if (sortColumn === columnKey) {
            if (sortDirection === 'asc') {
                setSortDirection('desc');
            } else if (sortDirection === 'desc') {
                setSortColumn(null);
                setSortDirection(null);
            }
        } else {
            setSortColumn(columnKey);
            setSortDirection('asc');
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allIds = new Set(paginatedData.map(keyExtractor));
            setSelectedIds(allIds);
            onSelectionChange?.(Array.from(allIds));
        } else {
            setSelectedIds(new Set());
            onSelectionChange?.([]);
        }
    };

    const handleSelectRow = (id: string, checked: boolean) => {
        const newSelectedIds = new Set(selectedIds);
        if (checked) {
            newSelectedIds.add(id);
        } else {
            newSelectedIds.delete(id);
        }
        setSelectedIds(newSelectedIds);
        onSelectionChange?.(Array.from(newSelectedIds));
    };

    const allSelected = paginatedData.length > 0 && paginatedData.every((item) =>
        selectedIds.has(keyExtractor(item))
    );

    const someSelected = paginatedData.some((item) =>
        selectedIds.has(keyExtractor(item))
    );

    if (loading) {
        return (
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
            </div>
        );
    }

    return (
        <div className={cn('space-y-4', className)}>
            {searchable && (
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute end-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="pe-10"
                        />
                    </div>
                </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50/80">
                        <TableRow className="border-b border-slate-200 hover:bg-transparent">
                            {selectable && (
                                <TableHead className="w-12 text-center">
                                    <Checkbox
                                        checked={allSelected}
                                        onCheckedChange={handleSelectAll}
                                        aria-label="Select all"
                                        className={someSelected && !allSelected ? 'data-[state=checked]:bg-primary/50 border-slate-300' : 'border-slate-300'}
                                    />
                                </TableHead>
                            )}
                            {columns.map((column) => (
                                <TableHead key={column.key} className={cn("text-start h-12 text-xs font-semibold text-slate-600 uppercase tracking-wider", column.className)}>
                                    {column.sortable ? (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 -me-3 text-xs font-semibold hover:bg-slate-200/50 text-slate-600"
                                            onClick={() => handleSort(column.key)}
                                        >
                                            {column.label}
                                            {sortColumn === column.key ? (
                                                sortDirection === 'asc' ? (
                                                    <ArrowUp className="me-2 h-3 w-3" />
                                                ) : (
                                                    <ArrowDown className="me-2 h-3 w-3" />
                                                )
                                            ) : (
                                                <ArrowUpDown className="me-2 h-3 w-3 opacity-30" />
                                            )}
                                        </Button>
                                    ) : (
                                        column.label
                                    )}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length + (selectable ? 1 : 0)} className="h-64">
                                    {emptyState || (
                                        <AdminEmptyState
                                            title="لا توجد بيانات"
                                            description="لم يتم العثور على أي سجلات"
                                        />
                                    )}
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedData.map((item) => {
                                const id = keyExtractor(item);
                                const isSelected = selectedIds.has(id);

                                return (
                                    <TableRow
                                        key={id}
                                        className={cn(
                                            "transition-colors hover:bg-slate-50/80 border-b border-slate-100 last:border-0",
                                            isSelected ? 'bg-emerald-50/60 hover:bg-emerald-50/80' : ''
                                        )}
                                    >
                                        {selectable && (
                                            <TableCell className="text-center">
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={(checked) => handleSelectRow(id, checked as boolean)}
                                                    aria-label={`Select row ${id}`}
                                                    className="border-slate-300"
                                                />
                                            </TableCell>
                                        )}
                                        {columns.map((column) => (
                                            <TableCell key={column.key} className={cn("py-4 text-sm text-slate-700", column.className)}>
                                                {column.render ? column.render(item) : item[column.key]}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        عرض {((currentPage - 1) * pageSize) + 1} إلى {Math.min(currentPage * pageSize, sortedData.length)} من {sortedData.length}
                    </div>
                    <div className={cn("flex items-center gap-2", dir === "rtl" && "flex-row-reverse")}>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronRight className="h-4 w-4 ms-1" />
                            السابق
                        </Button>
                        <div className="flex items-center gap-1">
                            {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }

                                return (
                                    <Button
                                        key={i}
                                        variant={currentPage === pageNum ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setCurrentPage(pageNum)}
                                        className="w-8 h-8 p-0"
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            })}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            التالي
                            <ChevronLeft className="h-4 w-4 me-1" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
