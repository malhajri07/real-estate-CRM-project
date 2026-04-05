import { SarPrice } from "@/components/ui/sar-symbol";
import { Users, Building, Target, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import type { Lead, Property, Deal } from "@shared/types";

export interface ReportTableProps {
  agentPerformanceData: { agent: string; deals: number; revenue: number; conversion: number }[];
  filteredDeals: Deal[];
  filteredProperties: Property[];
  filteredLeads: Lead[];
  totalPipelineValue: number;
  averageDealValue: number;
  commissionRatePercentage: number;
  conversionRate: number;
  averagePropertyPrice: number;
  totalCommission: number;
  formatCurrency: (amount: number) => string;
  formatNumber: (num: number) => string;
  formatPercentage: (num: number) => string;
}

export default function ReportTable({
  agentPerformanceData,
  filteredDeals,
  filteredProperties,
  filteredLeads,
  totalPipelineValue,
  averageDealValue,
  commissionRatePercentage,
  conversionRate,
  averagePropertyPrice,
  totalCommission,
  formatCurrency,
  formatNumber,
  formatPercentage,
}: ReportTableProps) {
  return (
    <>
      {/* Agents Tab */}
      <TabsContent value="agents" className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Users size={20} />
                <span>جدول أداء الوسطاء</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>الوكيل</TableHead>
                    <TableHead>عدد الصفقات</TableHead>
                    <TableHead>الإيرادات</TableHead>
                    <TableHead>معدل التحويل</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agentPerformanceData.map((agent, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{agent.agent}</TableCell>
                      <TableCell>{formatNumber(agent.deals)}</TableCell>
                      <TableCell><SarPrice value={agent.revenue} /></TableCell>
                      <TableCell>{formatPercentage(agent.conversion)}</TableCell>
                      <TableCell>
                        <Badge variant={agent.conversion > 20 ? "default" : "secondary"}>
                          {agent.conversion > 20 ? "ممتاز" : "جيد"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Advanced Analytics Tab */}
      <TabsContent value="analytics" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Target size={20} />
                <span>ملخص خط الأنابيب</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">إجمالي الصفقات</span>
                  <span className="font-bold">{formatNumber(filteredDeals.length)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">الصفقات النشطة</span>
                  <span className="font-bold">
                    {formatNumber(filteredDeals.filter(d => !["closed", "lost"].includes(d.stage)).length)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">الصفقات المكتملة</span>
                  <span className="font-bold text-primary">
                    {formatNumber(filteredDeals.filter(d => d.stage === "closed").length)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">قيمة خط الأنابيب</span>
                  <SarPrice value={totalPipelineValue} className="font-bold" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Building size={20} />
                <span>تحليلات العقارات</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">إجمالي العقارات</span>
                  <span className="font-bold">{formatNumber(filteredProperties.length)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">القوائم النشطة</span>
                  <span className="font-bold">
                    {formatNumber(filteredProperties.filter(p => p.status === "active").length)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">العقارات المباعة</span>
                  <span className="font-bold text-primary">
                    {formatNumber(filteredProperties.filter(p => p.status === "sold").length)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">متوسط السعر</span>
                  <SarPrice value={averagePropertyPrice} className="font-bold" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Zap size={20} />
                <span>مقاييس الأداء</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">تحويل العملاء المحتملين</span>
                  <span className="font-bold">{formatPercentage(conversionRate)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">متوسط حجم الصفقة</span>
                  <span className="font-bold">{formatCurrency(averageDealValue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">معدل العمولة</span>
                  <span className="font-bold">{formatPercentage(commissionRatePercentage)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">الإيرادات الشهرية</span>
                  <span className="font-bold text-primary">{formatCurrency(totalCommission)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </>
  );
}
