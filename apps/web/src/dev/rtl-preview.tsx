import React, { useEffect } from "react";

const previewMetrics = [
  { label: "إجمالي العملاء المحتملين", value: "1,240" },
  { label: "العقارات النشطة", value: "328" },
  { label: "الصفقات في المسار", value: "87" },
  { label: "الإيرادات الشهرية", value: "SAR 1.2M" },
];

const recentUpdates = [
  { title: "متابعة عميل محتمل", subtitle: "تم التواصل مع علي الحربي بشأن فيلا الرياض" },
  { title: "طلب تقييم عقار", subtitle: "تم إنشاء طلب تقييم جديد في جدة" },
  { title: "صفقة قيد التوقيع", subtitle: "صفقة مع مؤسسة السعادة العقارية في انتظار التوقيع" },
];

export default function RTLPreviewPage() {
  useEffect(() => {
    const previousDir = document.documentElement.getAttribute("dir");
    document.documentElement.setAttribute("dir", "rtl");
    return () => {
      if (previousDir) {
        document.documentElement.setAttribute("dir", previousDir);
      } else {
        document.documentElement.removeAttribute("dir");
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans" dir="rtl">
      <div className="page-container space-y-6">
        <section className="page-section">
          <header className="page-section__header">
            <h1 className="text-2xl font-display text-slate-900">معاينة الواجهة العربية</h1>
            <span className="text-sm text-slate-500">تستخدم هذه الصفحة للتحقق من التغييرات البصرية</span>
          </header>
          <div className="page-section__body">
            <div className="stats-grid">
              {previewMetrics.map((metric) => (
                <div key={metric.label} className="metric-card">
                  <div className="metric-card__value">{metric.value}</div>
                  <p className="metric-card__label">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="page-section glass-surface">
          <header className="page-section__header">
            <h2 className="text-xl font-display text-slate-800">تحديثات الفريق</h2>
            <span className="text-sm text-slate-500">آخر الأنشطة المسجلة</span>
          </header>
          <div className="page-section__body">
            <ul className="data-list">
              {recentUpdates.map((update) => (
                <li key={update.title} className="data-list__item">
                  <div>
                    <p className="font-display text-sm text-slate-900">{update.title}</p>
                    <p className="text-xs text-slate-500">{update.subtitle}</p>
                  </div>
                  <span className="text-emerald-600 text-xs font-semibold">مكتمل</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
