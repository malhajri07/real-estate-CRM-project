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
              <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                <Users size={20} />
                <span>جدول أداء الوسطاء</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
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
                      <TableCell>{formatCurrency(agent.revenue)}</TableCell>
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
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Advanced Analytics Tab */}
      <TabsContent value="analytics" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                <Target size={20} />
                <span>ملخص خط الأنابيب</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">إجمالي الصفقات</span>
                  <span className="font-semibold">{formatNumber(filteredDeals.length)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">الصفقات النشطة</span>
                  <span className="font-semibold">
                    {formatNumber(filteredDeals.filter(d => !["closed", "lost"].includes(d.stage)).length)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">الصفقات المكتملة</span>
                  <span className="font-semibold text-emerald-600">
                    {formatNumber(filteredDeals.filter(d => d.stage === "closed").length)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">قيمة خط الأنابيب</span>
                  <span className="font-semibold">{formatCurrency(totalPipelineValue)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                <Building size={20} />
                <span>تحليلات العقارات</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">إجمالي العقارات</span>
                  <span className="font-semibold">{formatNumber(filteredProperties.length)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">القوائم النشطة</span>
                  <span className="font-semibold">
                    {formatNumber(filteredProperties.filter(p => p.status === "active").length)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">العقارات المباعة</span>
                  <span className="font-semibold text-emerald-600">
                    {formatNumber(filteredProperties.filter(p => p.status === "sold").length)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">متوسط السعر</span>
                  <span className="font-semibold">{formatCurrency(averagePropertyPrice)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                <Zap size={20} />
                <span>مقاييس الأداء</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">تحويل العملاء المحتملين</span>
                  <span className="font-semibold">{formatPercentage(conversionRate)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">متوسط حجم الصفقة</span>
                  <span className="font-semibold">{formatCurrency(averageDealValue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">معدل العمولة</span>
                  <span className="font-semibold">{formatPercentage(commissionRatePercentage)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">الإيرادات الشهرية</span>
                  <span className="font-semibold text-primary">{formatCurrency(totalCommission)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </>
  );
}
