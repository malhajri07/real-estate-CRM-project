/**
 * AdminExport.tsx - Admin Export Component
 * 
 * Location: apps/web/src/ → Components/ → Admin Components → utilities/ → AdminExport.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Admin export component. Provides:
 * - Data export functionality
 * - Multiple export formats (CSV, Excel, PDF)
 * - Export options
 * 
 * Related Files:
 * - Used in admin pages for data export
 */

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdminExportProps {
    data: any[];
    filename?: string;
    formats?: ('csv' | 'json' | 'excel')[];
}

export function AdminExport({ data, filename = 'export', formats = ['csv', 'json'] }: AdminExportProps) {
    const { toast } = useToast();

    const exportToCSV = () => {
        if (data.length === 0) {
            toast({
                variant: 'destructive',
                title: 'لا توجد بيانات',
                description: 'لا توجد بيانات للتصدير',
            });
            return;
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map((row) =>
                headers.map((header) => {
                    const value = row[header];
                    // Escape commas and quotes
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value ?? '';
                }).join(',')
            ),
        ].join('\n');

        downloadFile(csvContent, `${filename}.csv`, 'text/csv');
        toast({
            title: 'تم التصدير بنجاح',
            description: `تم تصدير ${data.length} سجل إلى ملف CSV`,
        });
    };

    const exportToJSON = () => {
        if (data.length === 0) {
            toast({
                variant: 'destructive',
                title: 'لا توجد بيانات',
                description: 'لا توجد بيانات للتصدير',
            });
            return;
        }

        const jsonContent = JSON.stringify(data, null, 2);
        downloadFile(jsonContent, `${filename}.json`, 'application/json');
        toast({
            title: 'تم التصدير بنجاح',
            description: `تم تصدير ${data.length} سجل إلى ملف JSON`,
        });
    };

    const downloadFile = (content: string, filename: string, mimeType: string) => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 ms-2" />
                    تصدير
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {formats.includes('csv') && (
                    <DropdownMenuItem onClick={exportToCSV}>
                        <FileSpreadsheet className="h-4 w-4 ms-2" />
                        تصدير كملف CSV
                    </DropdownMenuItem>
                )}
                {formats.includes('json') && (
                    <DropdownMenuItem onClick={exportToJSON}>
                        <FileText className="h-4 w-4 ms-2" />
                        تصدير كملف JSON
                    </DropdownMenuItem>
                )}
                {formats.includes('excel') && (
                    <DropdownMenuItem disabled>
                        <FileSpreadsheet className="h-4 w-4 ms-2" />
                        تصدير كملف Excel (قريباً)
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
