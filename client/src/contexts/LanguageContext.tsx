import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation keys
const translations = {
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
    
    // Language
    'language.arabic': 'العربية',
    'language.english': 'English',
    
    // System
    'nav.system_title': 'نظام إدارة العقارات',
    'nav.settings': 'الإعدادات',
    'nav.logout': 'تسجيل الخروج',
    'nav.welcome': 'مرحباً',
  },
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.leads': 'Leads',
    'nav.properties': 'Properties',
    'nav.pipeline': 'Pipeline',
    'nav.clients': 'Clients',
    'nav.reports': 'Reports',
    'nav.notifications': 'Notifications',
    'nav.campaigns': 'Campaigns',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.loading': 'Loading dashboard...',
    'dashboard.total_leads': 'Total Leads',
    'dashboard.active_properties': 'Active Properties',
    'dashboard.deals_in_pipeline': 'Deals in Pipeline',
    'dashboard.monthly_revenue': 'Monthly Revenue',
    'dashboard.recent_leads': 'Recent Leads',
    'dashboard.todays_activities': "Today's Activities",
    'dashboard.no_activities_today': 'No activities scheduled for today',
    'dashboard.pipeline_overview': 'Pipeline Overview',
    
    // Leads
    'leads.title': 'Lead Management',
    'leads.add_lead': 'Add Lead',
    'leads.first_name': 'First Name',
    'leads.last_name': 'Last Name',
    'leads.email': 'Email',
    'leads.phone': 'Phone',
    'leads.lead_source': 'Lead Source',
    'leads.interest_type': 'Interest Type',
    'leads.budget_range': 'Budget Range',
    'leads.status': 'Status',
    'leads.notes': 'Notes',
    'leads.search_placeholder': 'Search leads...',
    'leads.whatsapp': 'WhatsApp',
    'leads.activities': 'Activities',
    
    // Properties
    'properties.title': 'Property Management',
    'properties.add_property': 'Add Property',
    'properties.property_title': 'Property Title',
    'properties.description': 'Description',
    'properties.address': 'Address',
    'properties.city': 'City',
    'properties.state': 'State',
    'properties.zip_code': 'ZIP Code',
    'properties.price': 'Price',
    'properties.property_type': 'Property Type',
    'properties.bedrooms': 'Bedrooms',
    'properties.bathrooms': 'Bathrooms',
    'properties.square_feet': 'Square Feet',
    'properties.features': 'Features',
    'properties.photo_url': 'Photo URL',
    'properties.search_placeholder': 'Search properties...',
    
    // Forms
    'form.save': 'Save',
    'form.cancel': 'Cancel',
    'form.submit': 'Submit',
    'form.close': 'Close',
    'form.edit': 'Edit',
    'form.delete': 'Delete',
    'form.add': 'Add',
    'form.required': 'Required',
    'form.search': 'Search...',
    'form.view_all': 'View All',
    
    // Status values
    'status.new': 'New',
    'status.qualified': 'Qualified',
    'status.showing': 'Showing',
    'status.negotiation': 'Negotiation',
    'status.closed': 'Closed',
    'status.lost': 'Lost',
    'status.active': 'Active',
    'status.pending': 'Pending',
    'status.sold': 'Sold',
    
    // Interest types
    'interest.buying': 'Buying',
    'interest.selling': 'Selling',
    'interest.renting': 'Renting',
    'interest.investment': 'Investment',
    
    // Property types
    'property_type.house': 'House',
    'property_type.apartment': 'Apartment',
    'property_type.villa': 'Villa',
    'property_type.commercial': 'Commercial',
    'property_type.land': 'Land',
    
    // Messages
    'message.success': 'Success',
    'message.error': 'Error occurred',
    'message.confirm_delete': 'Are you sure you want to delete this item?',
    
    // WhatsApp
    'whatsapp.send_message': 'Send WhatsApp Message',
    'whatsapp.message_placeholder': 'Type your message here...',
    'whatsapp.send': 'Send',
    
    // Language
    'language.arabic': 'العربية',
    'language.english': 'English',
    
    // System
    'nav.system_title': 'Real Estate CRM',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',
    'nav.welcome': 'Welcome',
  }
};

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'ar';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    
    // Update body class for styling
    if (language === 'ar') {
      document.body.classList.add('rtl');
      document.body.classList.remove('ltr');
    } else {
      document.body.classList.add('ltr');
      document.body.classList.remove('rtl');
    }
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
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