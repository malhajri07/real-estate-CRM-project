import { Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface ReportFiltersProps {
  selectedPeriod: string;
  onPeriodChange: (value: string) => void;
}

export default function ReportFilters({ selectedPeriod, onPeriodChange }: ReportFiltersProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-4 rtl:space-x-reverse">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Calendar size={20} className="text-muted-foreground" />
          <span className="text-xs font-bold uppercase tracking-wider text-foreground/80">فترة التقرير:</span>
          <Select value={selectedPeriod} onValueChange={onPeriodChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">٧ أيام</SelectItem>
              <SelectItem value="30">٣٠ يوماً</SelectItem>
              <SelectItem value="90">٩٠ يوماً</SelectItem>
              <SelectItem value="365">سنة واحدة</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
