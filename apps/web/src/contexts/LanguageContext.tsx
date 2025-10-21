import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';

interface LanguageContextType {
  t: (key: string) => string;
  dir: 'rtl' | 'ltr';
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

type SupportedLanguage = 'ar' | 'en';

const LANGUAGE_STORAGE_KEY = 'crm-language';
const FALLBACK_LANGUAGE: SupportedLanguage = 'ar';

const translations: Record<SupportedLanguage, Record<string, string>> = {
  ar: {
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
    'nav.search': 'ابحث عن عقار',
    'nav.listings': 'العقارات',
    'nav.agencies': 'الوكالات',
    'nav.post_listing': 'نشر إعلان',
    'nav.favorites': 'المفضلة',
    'nav.compare': 'المقارنة',
    'nav.login': 'تسجيل الدخول',
    'nav.signup': 'إنشاء حساب',

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

    // Public pages
    'public.listings_title': 'العقارات المتاحة',
    'public.listings_sub': 'استكشف أحدث العقارات مع تصفية متقدمة',
    'public.featured_title': 'عقارات مميزة',
    'public.latest_title': 'أحدث الإعلانات',
    'public.favorites_title': 'العقارات المفضلة',
    'public.compare_title': 'مقارنة العقارات',
    'public.post_title': 'نشر إعلان عقاري',
    'public.moderation_title': 'قائمة المراجعة',
    'public.agencies_title': 'الوكالات العقارية',
    'public.agency_title': 'ملف الوكالة',
    'public.agent_title': 'ملف الوسيط',
    'public.footer_rights': '© جميع الحقوق محفوظة',
    // Admin sidebar
    'admin.sidebar.overview': 'نظرة عامة',
    'admin.sidebar.overview.dashboard': 'لوحة التحكم الرئيسية',
    'admin.sidebar.overview.statistics': 'الإحصائيات العامة',
    'admin.sidebar.overview.recent_activity': 'النشاط الأخير',
    'admin.sidebar.user_management': 'إدارة المستخدمين',
    'admin.sidebar.user_management.all_users': 'جميع المستخدمين',
    'admin.sidebar.user_management.active_users': 'المستخدمون النشطون',
    'admin.sidebar.user_management.pending_users': 'المستخدمون المعلقون',
    'admin.sidebar.user_management.user_roles': 'أدوار المستخدمين',
    'admin.sidebar.user_management.user_permissions': 'صلاحيات المستخدمين',
    'admin.sidebar.role_management': 'إدارة الأدوار',
    'admin.sidebar.role_management.roles_list': 'قائمة الأدوار',
    'admin.sidebar.role_management.create_role': 'إنشاء دور جديد',
    'admin.sidebar.role_management.permissions': 'إدارة الصلاحيات',
    'admin.sidebar.role_management.role_assignments': 'تعيين الأدوار',
    'admin.sidebar.organization_management': 'إدارة المنظمات',
    'admin.sidebar.organization_management.organizations_list': 'قائمة المنظمات',
    'admin.sidebar.organization_management.create_organization': 'إنشاء منظمة جديدة',
    'admin.sidebar.organization_management.organization_types': 'أنواع المنظمات',
    'admin.sidebar.organization_management.organization_settings': 'إعدادات المنظمات',
    'admin.sidebar.revenue_management': 'الإيرادات والاشتراكات',
    'admin.sidebar.revenue_management.overview': 'نظرة عامة على الإيرادات',
    'admin.sidebar.revenue_management.subscriptions': 'الاشتراكات النشطة',
    'admin.sidebar.revenue_management.payment_methods': 'طرق الدفع',
    'admin.sidebar.revenue_management.reports': 'تقارير الإيرادات',
    'admin.sidebar.revenue_management.subscription_plans': 'خطط الاشتراك',
    'admin.sidebar.complaints_management': 'إدارة الشكاوى',
    'admin.sidebar.complaints_management.all': 'جميع الشكاوى',
    'admin.sidebar.complaints_management.open': 'الشكاوى المفتوحة',
    'admin.sidebar.complaints_management.resolved': 'الشكاوى المحلولة',
    'admin.sidebar.complaints_management.categories': 'فئات الشكاوى',
    'admin.sidebar.complaints_management.response_templates': 'قوالب الردود',
    'admin.sidebar.integrations': 'التكاملات',
    'admin.sidebar.integrations.whatsapp_settings': 'إعدادات WhatsApp',
    'admin.sidebar.integrations.email_settings': 'إعدادات البريد الإلكتروني',
    'admin.sidebar.integrations.sms_settings': 'إعدادات الرسائل النصية',
    'admin.sidebar.integrations.social_media': 'وسائل التواصل الاجتماعي',
    'admin.sidebar.integrations.api_integrations': 'تكاملات API',
    'admin.sidebar.content_management': 'إدارة المحتوى',
    'admin.sidebar.content_management.landing_pages': 'صفحات الهبوط',
    'admin.sidebar.content_management.articles': 'المقالات',
    'admin.sidebar.content_management.media_library': 'مكتبة الوسائط',
    'admin.sidebar.content_management.seo_settings': 'إعدادات SEO',
    'admin.sidebar.content_management.content_templates': 'قوالب المحتوى',
    'admin.sidebar.features_plans': 'الميزات والخطط',
    'admin.sidebar.features_plans.feature_comparison': 'مقارنة الميزات',
    'admin.sidebar.features_plans.pricing_plans': 'خطط الأسعار',
    'admin.sidebar.features_plans.corporate_features': 'ميزات الشركات',
    'admin.sidebar.features_plans.individual_features': 'ميزات الأفراد',
    'admin.sidebar.features_plans.feature_requests': 'طلبات الميزات',
    'admin.sidebar.advanced_analytics': 'التحليلات المتقدمة',
    'admin.sidebar.advanced_analytics.user_analytics': 'تحليلات المستخدمين',
    'admin.sidebar.advanced_analytics.revenue_analytics': 'تحليلات الإيرادات',
    'admin.sidebar.advanced_analytics.usage_statistics': 'إحصائيات الاستخدام',
    'admin.sidebar.advanced_analytics.performance_metrics': 'مقاييس الأداء',
    'admin.sidebar.advanced_analytics.custom_reports': 'التقارير المخصصة',
    'admin.sidebar.invoicing_payments': 'الفواتير والمدفوعات',
    'admin.sidebar.invoicing_payments.invoices_list': 'قائمة الفواتير',
    'admin.sidebar.invoicing_payments.create_invoice': 'إنشاء فاتورة جديدة',
    'admin.sidebar.invoicing_payments.payment_tracking': 'تتبع المدفوعات',
    'admin.sidebar.invoicing_payments.payment_methods': 'طرق الدفع',
    'admin.sidebar.invoicing_payments.billing_settings': 'إعدادات الفواتير',
    'admin.sidebar.security_settings': 'الأمان',
    'admin.sidebar.security_settings.access_control': 'التحكم في الوصول',
    'admin.sidebar.security_settings.security_logs': 'سجلات الأمان',
    'admin.sidebar.security_settings.two_factor': 'المصادقة الثنائية',
    'admin.sidebar.security_settings.password_policies': 'سياسات كلمات المرور',
    'admin.sidebar.security_settings.security_alerts': 'تنبيهات الأمان',
    'admin.sidebar.notifications': 'الإشعارات',
    'admin.sidebar.notifications.notification_center': 'مركز الإشعارات',
    'admin.sidebar.notifications.email_notifications': 'إشعارات البريد الإلكتروني',
    'admin.sidebar.notifications.push_notifications': 'الإشعارات الفورية',
    'admin.sidebar.notifications.notification_templates': 'قوالب الإشعارات',
    'admin.sidebar.notifications.notification_settings': 'إعدادات الإشعارات',
    'admin.sidebar.system_settings': 'إعدادات النظام',
    'admin.sidebar.system_settings.general_settings': 'الإعدادات العامة',
    'admin.sidebar.system_settings.database_management': 'إدارة قاعدة البيانات',
    'admin.sidebar.system_settings.backup_restore': 'النسخ الاحتياطي والاستعادة',
    'admin.sidebar.system_settings.system_logs': 'سجلات النظام',
    'admin.sidebar.system_settings.maintenance': 'الصيانة',
    // Listing card
    'listing.details': 'تفاصيل',
    'listing.save': 'حفظ',
    'listing.compare': 'مقارنة',
    'listing.added': 'تمت الإضافة إلى المفضلة',
    'listing.save_error': 'تعذر الحفظ',
    'listing.compare_added': 'تم تحديث المقارنة',
    'listing.no_photo': 'لا توجد صورة',
    'listing.back': 'رجوع',
    'listing.report': 'الإبلاغ عن إعلان',
    // Saved searches
    'saved.title': 'عمليات البحث المحفوظة',
    'saved.subtitle': 'إدارة التنبيهات والبحث السريع',
    'saved.add': 'إضافة بحث',
    'saved.run': 'تشغيل التنبيهات',
    'saved.delete': 'حذف',
    'saved.none': 'لا توجد عمليات بحث محفوظة',
  },
  en: {},
};

const SUPPORTED_LANGUAGES = Object.keys(translations) as SupportedLanguage[];

const isSupportedLanguage = (value: string | null): value is SupportedLanguage =>
  value !== null && SUPPORTED_LANGUAGES.includes(value as SupportedLanguage);

const resolveInitialLanguage = (): SupportedLanguage => {
  if (typeof window === 'undefined') {
    return FALLBACK_LANGUAGE;
  }

  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return isSupportedLanguage(stored) ? stored : FALLBACK_LANGUAGE;
};

const resolveDirection = (language: SupportedLanguage): LanguageContextType['dir'] =>
  language === 'ar' ? 'rtl' : 'ltr';

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState<SupportedLanguage>(resolveInitialLanguage);

  const dir = resolveDirection(language);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    document.documentElement.lang = language;
    document.documentElement.dir = dir;
    document.body.setAttribute('dir', dir);
    document.body.classList.toggle('rtl', dir === 'rtl');
    document.body.classList.toggle('ltr', dir === 'ltr');
  }, [dir, language]);

  const t = useCallback(
    (key: string): string => translations[language]?.[key] ?? key,
    [language]
  );

  const contextValue = useMemo<LanguageContextType>(
    () => ({
      t,
      dir,
      language,
      setLanguage,
    }),
    [t, dir, language]
  );

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
