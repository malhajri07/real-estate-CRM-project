import { createContext, useContext, useEffect, ReactNode } from 'react';

interface LanguageContextType {
  t: (key: string) => string;
  dir: 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Arabic translations only
const translations = {
  // Navigation
  'nav.dashboard': 'لوحة التحكم',
  'nav.leads': 'العملاء المحتملين',
  'nav.properties': 'العقارات',
  'nav.pipeline': 'خط الأنابيب',
  'nav.clients': 'العملاء',
  'nav.reports': 'التقارير',
  'nav.notifications': 'الإشعارات',
  'nav.campaigns': 'الحملات',
  
  // Dashboard
  'dashboard.title': 'لوحة التحكم',
  'dashboard.loading': 'جار تحميل لوحة التحكم...',
  'dashboard.total_leads': 'إجمالي العملاء المحتملين',
  'dashboard.active_properties': 'العقارات النشطة',
  'dashboard.deals_in_pipeline': 'الصفقات في المسار',
  'dashboard.monthly_revenue': 'الإيرادات الشهرية',
  'dashboard.recent_leads': 'العملاء المحتملون الجدد',
  'dashboard.todays_activities': 'أنشطة اليوم',
  'dashboard.no_activities_today': 'لا توجد أنشطة اليوم',
  'dashboard.pipeline_overview': 'نظرة عامة على المسار',
  
  // Leads
  'leads.title': 'إدارة العملاء المحتملين',
  'leads.add_lead': 'إضافة عميل محتمل',
  'leads.first_name': 'الاسم الأول',
  'leads.last_name': 'اسم العائلة',
  'leads.email': 'البريد الإلكتروني',
  'leads.phone': 'رقم الهاتف',
  'leads.lead_source': 'مصدر العميل',
  'leads.interest_type': 'نوع الاهتمام',
  'leads.budget_range': 'نطاق الميزانية',
  'leads.status': 'الحالة',
  'leads.notes': 'الملاحظات',
  'leads.search_placeholder': 'البحث عن العملاء المحتملين...',
  'leads.whatsapp': 'واتساب',
  'leads.activities': 'الأنشطة',
  
  // Properties
  'properties.title': 'إدارة العقارات',
  'properties.add_property': 'إضافة عقار',
  'properties.property_title': 'عنوان العقار',
  'properties.description': 'الوصف',
  'properties.address': 'العنوان',
  'properties.city': 'المدينة',
  'properties.state': 'المنطقة',
  'properties.zip_code': 'الرمز البريدي',
  'properties.price': 'السعر',
  'properties.property_type': 'نوع العقار',
  'properties.bedrooms': 'عدد الغرف',
  'properties.bathrooms': 'عدد الحمامات',
  'properties.square_feet': 'المساحة (متر مربع)',
  'properties.features': 'المميزات',
  'properties.photo_url': 'رابط الصورة',
  'properties.search_placeholder': 'البحث عن العقارات...',
  
  // Forms
  'form.save': 'حفظ',
  'form.cancel': 'إلغاء',
  'form.submit': 'إرسال',
  'form.close': 'إغلاق',
  'form.edit': 'تعديل',
  'form.delete': 'حذف',
  'form.add': 'إضافة',
  'form.required': 'مطلوب',
  'form.search': 'البحث...',
  'form.view_all': 'عرض الكل',
  
  // Status values
  'status.new': 'جديد',
  'status.qualified': 'مؤهل',
  'status.showing': 'معاينة',
  'status.negotiation': 'تفاوض',
  'status.closed': 'مغلق',
  'status.lost': 'مفقود',
  'status.active': 'نشط',
  'status.pending': 'معلق',
  'status.sold': 'مباع',
  
  // Interest types
  'interest.buying': 'شراء',
  'interest.selling': 'بيع',
  'interest.renting': 'إيجار',
  'interest.investment': 'استثمار',
  
  // Property types
  'property_type.house': 'منزل',
  'property_type.apartment': 'شقة',
  'property_type.villa': 'فيلا',
  'property_type.commercial': 'تجاري',
  'property_type.land': 'أرض',
  
  // Messages
  'message.success': 'تم بنجاح',
  'message.error': 'حدث خطأ',
  'message.confirm_delete': 'هل تريد حذف هذا العنصر؟',
  
  // WhatsApp
  'whatsapp.send_message': 'إرسال رسالة واتساب',
  'whatsapp.message_placeholder': 'اكتب رسالتك هنا...',
  'whatsapp.send': 'إرسال',
  
  // System
  'nav.system_title': 'نظام إدارة العقارات',
  'nav.settings': 'الإعدادات',
  'nav.logout': 'تسجيل الخروج',
  'nav.welcome': 'مرحباً',
  
  // Reports
  'reports.title': 'التقارير والإحصائيات',
  'reports.lead_conversion': 'معدل تحويل العملاء',
  'reports.avg_deal_size': 'متوسط حجم الصفقة',
  'reports.commission_rate': 'معدل العمولة',
  'reports.closed_deals': 'الصفقات المغلقة',
  'reports.total_pipeline_value': 'القيمة الإجمالية للمسار',
  'reports.deal_pipeline_summary': 'ملخص مسار الصفقات',
  'reports.property_analytics': 'تحليلات العقارات',
  'reports.performance_metrics': 'مقاييس الأداء',
  'reports.total_deals': 'إجمالي الصفقات',
  'reports.active_deals': 'الصفقات النشطة',
  'reports.total_properties': 'إجمالي العقارات',
  'reports.active_listings': 'القوائم النشطة',
  'reports.sold_properties': 'العقارات المباعة',
  'reports.average_price': 'متوسط السعر',
};

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  useEffect(() => {
    // Set document to Arabic RTL
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';
    document.body.classList.add('rtl');
    document.body.classList.remove('ltr');
  }, []);

  const t = (key: string): string => {
    return translations[key as keyof typeof translations] || key;
  };

  const contextValue: LanguageContextType = {
    t,
    dir: 'rtl'
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}