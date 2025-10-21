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
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <section className="ui-section">
          <header className="ui-section__header">
            <h1 className="text-2xl font-display text-foreground">معاينة الواجهة العربية</h1>
            <span className="text-sm text-muted-foreground">تستخدم هذه الصفحة للتحقق من التغييرات البصرية</span>
          </header>
          <div className="ui-section__body">
            <div className="ui-stat-grid">
              {previewMetrics.map((metric) => (
                <div key={metric.label} className="ui-metric-card">
                  <div className="ui-metric-card__value">{metric.value}</div>
                  <p className="ui-metric-card__label">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="ui-section">
          <header className="ui-section__header">
            <h2 className="text-xl font-display text-foreground">تحديثات الفريق</h2>
            <span className="text-sm text-muted-foreground">آخر الأنشطة المسجلة</span>
          </header>
          <div className="ui-section__body">
            <ul className="ui-data-list">
              {recentUpdates.map((update) => (
                <li key={update.title} className="ui-data-list__item">
                  <div>
                    <p className="font-display text-sm text-foreground">{update.title}</p>
                    <p className="text-xs text-muted-foreground">{update.subtitle}</p>
                  </div>
                  <span className="text-xs font-semibold text-primary">مكتمل</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
