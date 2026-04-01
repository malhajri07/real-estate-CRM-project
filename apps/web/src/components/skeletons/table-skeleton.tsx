import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
  showHeader?: boolean;
}

export function TableSkeleton({ rows = 8, cols = 6, showHeader = true }: TableSkeletonProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm animate-pulse">
      <Table>
        {showHeader && (
          <TableHeader className="bg-muted/50">
            <TableRow>
              {Array.from({ length: cols }).map((_, i) => (
                <TableHead key={i} className="px-6 py-4 text-start">
                  <Skeleton className="h-4 w-20 rounded-lg" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        )}
        <TableBody className="divide-y divide-border">
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <TableRow key={rowIdx}>
              {Array.from({ length: cols }).map((_, colIdx) => (
                <TableCell key={colIdx} className="px-6 py-4">
                  <Skeleton className="h-4 w-full max-w-[120px] rounded-lg" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
