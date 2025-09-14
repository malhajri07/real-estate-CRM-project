import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth/AuthProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDarkMode } from '@/contexts/DarkModeContext';
import { Shield, Users, Building2, UserCheck, Activity, RefreshCw, Settings, Lock, Bell, BarChart3, Database, DollarSign, MessageSquare, Share2, Mail, Smartphone, FileText, TrendingUp, PieChart, CreditCard, AlertTriangle, ChevronDown, ChevronRight, Save, Edit, Eye, Plus, Trash2, GripVertical, Phone, MapPin, Link, Navigation, Star, Target, Zap, Globe, Heart, Award, CheckCircle, XCircle, Moon, Sun, LogOut } from 'lucide-react';

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  isActive: boolean;
  roles: string[];
  organizationId: string;
  lastActiveAt: string;
  createdAt: string;
}

interface Organization {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  userCount: number;
  createdAt: string;
}

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalOrganizations: number;
  activeOrganizations: number;
}

interface LandingPageFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
  order: number;
}

interface LandingPageStat {
  id: string;
  number: string;
  label: string;
  suffix?: string;
  order: number;
}

interface LandingPageSolutionFeature {
  id: string;
  text: string;
  icon: string;
  order: number;
}

interface LandingPageSolution {
  id: string;
  title: string;
  description: string;
  icon: string;
  order: number;
  features: LandingPageSolutionFeature[];
}

interface LandingPageHeroMetric {
  id: string;
  value: string;
  label: string;
  color: string;
  order: number;
}

interface LandingPageContactInfo {
  id: string;
  type: string;
  label: string;
  value: string;
  icon: string;
  order: number;
}

interface LandingPageNavigation {
  id: string;
  text: string;
  url: string;
  order: number;
}

interface LandingPageFooterLink {
  id: string;
  text: string;
  url: string;
  category: string;
  order: number;
}

interface LandingPageContent {
  id?: string;
  loadingText: string;
  heroWelcomeText: string;
  heroTitle: string;
  heroSubtitle: string;
  heroButton: string;
  heroLoginButton: string;
  heroDashboardTitle: string;
  featuresTitle: string;
  featuresDescription: string;
  solutionsTitle: string;
  solutionsDescription: string;
  statsTitle: string;
  pricingTitle: string;
  pricingSubtitle: string;
  contactTitle: string;
  contactDescription: string;
  footerDescription: string;
  footerCopyright: string;
  features: LandingPageFeature[];
  stats: LandingPageStat[];
  solutions: LandingPageSolution[];
  heroDashboardMetrics: LandingPageHeroMetric[];
  contactInfo: LandingPageContactInfo[];
  navigation: LandingPageNavigation[];
  footerLinks: LandingPageFooterLink[];
}

export default function RBACDashboard() {
  const { user, token, logout } = useAuth();
  const { dir } = useLanguage();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeUsers: 0,
    totalOrganizations: 0,
    activeOrganizations: 0
  });

  const [activeSidebarItem, setActiveSidebarItem] = useState('overview');
  const [activeSubPage, setActiveSubPage] = useState('dashboard');
  const [expandedItems, setExpandedItems] = useState<string[]>(['overview']);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showOrgDialog, setShowOrgDialog] = useState(false);
  
  // CMS State
  const [landingPageContent, setLandingPageContent] = useState<LandingPageContent | null>(null);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [activeContentTab, setActiveContentTab] = useState('hero');
  const [editingItem, setEditingItem] = useState<{type: string, id?: string} | null>(null);

  const adminMenuItems = [
    {
      id: 'overview',
      label: 'نظرة عامة',
      description: 'إحصائيات المنصة',
      icon: BarChart3,
      subPages: [
        { id: 'dashboard', label: 'لوحة التحكم الرئيسية' },
        { id: 'statistics', label: 'الإحصائيات العامة' },
        { id: 'recent-activity', label: 'النشاط الأخير' }
      ]
    },
    {
      id: 'user-management',
      label: 'إدارة المستخدمين',
      description: 'المستخدمين والأدوار',
      icon: Users,
      subPages: [
        { id: 'all-users', label: 'جميع المستخدمين' },
        { id: 'active-users', label: 'المستخدمون النشطون' },
        { id: 'pending-users', label: 'المستخدمون المعلقون' },
        { id: 'user-roles', label: 'أدوار المستخدمين' },
        { id: 'user-permissions', label: 'صلاحيات المستخدمين' }
      ]
    },
    {
      id: 'role-management',
      label: 'إدارة الأدوار',
      description: 'الصلاحيات والأذونات',
      icon: Shield,
      subPages: [
        { id: 'roles-list', label: 'قائمة الأدوار' },
        { id: 'create-role', label: 'إنشاء دور جديد' },
        { id: 'permissions', label: 'إدارة الصلاحيات' },
        { id: 'role-assignments', label: 'تعيين الأدوار' }
      ]
    },
    {
      id: 'organization-management',
      label: 'إدارة المنظمات',
      description: 'الشركات والوكالات',
      icon: Building2,
      subPages: [
        { id: 'organizations-list', label: 'قائمة المنظمات' },
        { id: 'create-organization', label: 'إنشاء منظمة جديدة' },
        { id: 'organization-types', label: 'أنواع المنظمات' },
        { id: 'organization-settings', label: 'إعدادات المنظمات' }
      ]
    },
    {
      id: 'revenue-management',
      label: 'الإيرادات والاشتراكات',
      description: 'تتبع الإيرادات والاشتراكات',
      icon: DollarSign,
      subPages: [
        { id: 'revenue-overview', label: 'نظرة عامة على الإيرادات' },
        { id: 'subscriptions', label: 'الاشتراكات النشطة' },
        { id: 'payment-methods', label: 'طرق الدفع' },
        { id: 'revenue-reports', label: 'تقارير الإيرادات' },
        { id: 'subscription-plans', label: 'خطط الاشتراك' }
      ]
    },
    {
      id: 'complaints-management',
      label: 'إدارة الشكاوى',
      description: 'الشكاوى والاستفسارات',
      icon: AlertTriangle,
      subPages: [
        { id: 'all-complaints', label: 'جميع الشكاوى' },
        { id: 'open-complaints', label: 'الشكاوى المفتوحة' },
        { id: 'resolved-complaints', label: 'الشكاوى المحلولة' },
        { id: 'complaint-categories', label: 'فئات الشكاوى' },
        { id: 'response-templates', label: 'قوالب الردود' }
      ]
    },
    {
      id: 'integrations',
      label: 'التكاملات',
      description: 'وسائل التواصل والرسائل',
      icon: Share2,
      subPages: [
        { id: 'whatsapp-settings', label: 'إعدادات WhatsApp' },
        { id: 'email-settings', label: 'إعدادات البريد الإلكتروني' },
        { id: 'sms-settings', label: 'إعدادات الرسائل النصية' },
        { id: 'social-media', label: 'وسائل التواصل الاجتماعي' },
        { id: 'api-integrations', label: 'تكاملات API' }
      ]
    },
    {
      id: 'content-management',
      label: 'إدارة المحتوى',
      description: 'صفحات الهبوط والمحتوى',
      icon: FileText,
      subPages: [
        { id: 'landing-pages', label: 'صفحات الهبوط' },
        { id: 'articles', label: 'المقالات' },
        { id: 'media-library', label: 'مكتبة الوسائط' },
        { id: 'seo-settings', label: 'إعدادات SEO' },
        { id: 'content-templates', label: 'قوالب المحتوى' }
      ]
    },
    {
      id: 'features-plans',
      label: 'الميزات والخطط',
      description: 'ميزات الشركات والأفراد',
      icon: Settings,
      subPages: [
        { id: 'feature-comparison', label: 'مقارنة الميزات' },
        { id: 'pricing-plans', label: 'خطط الأسعار' },
        { id: 'corporate-features', label: 'ميزات الشركات' },
        { id: 'individual-features', label: 'ميزات الأفراد' },
        { id: 'feature-requests', label: 'طلبات الميزات' }
      ]
    },
    {
      id: 'advanced-analytics',
      label: 'التحليلات المتقدمة',
      description: 'الرسوم البيانية والاتجاهات',
      icon: TrendingUp,
      subPages: [
        { id: 'user-analytics', label: 'تحليلات المستخدمين' },
        { id: 'revenue-analytics', label: 'تحليلات الإيرادات' },
        { id: 'usage-statistics', label: 'إحصائيات الاستخدام' },
        { id: 'performance-metrics', label: 'مقاييس الأداء' },
        { id: 'custom-reports', label: 'التقارير المخصصة' }
      ]
    },
    {
      id: 'invoicing-payments',
      label: 'الفواتير والمدفوعات',
      description: 'إدارة الفواتير والمدفوعات',
      icon: CreditCard,
      subPages: [
        { id: 'invoices-list', label: 'قائمة الفواتير' },
        { id: 'create-invoice', label: 'إنشاء فاتورة جديدة' },
        { id: 'payment-tracking', label: 'تتبع المدفوعات' },
        { id: 'payment-methods', label: 'طرق الدفع' },
        { id: 'billing-settings', label: 'إعدادات الفواتير' }
      ]
    },
    {
      id: 'security-settings',
      label: 'الأمان',
      description: 'إعدادات الأمان',
      icon: Lock,
      subPages: [
        { id: 'access-control', label: 'التحكم في الوصول' },
        { id: 'security-logs', label: 'سجلات الأمان' },
        { id: 'two-factor-auth', label: 'المصادقة الثنائية' },
        { id: 'password-policies', label: 'سياسات كلمات المرور' },
        { id: 'security-alerts', label: 'تنبيهات الأمان' }
      ]
    },
    {
      id: 'notifications',
      label: 'الإشعارات',
      description: 'إدارة الإشعارات',
      icon: Bell,
      subPages: [
        { id: 'notification-center', label: 'مركز الإشعارات' },
        { id: 'email-notifications', label: 'إشعارات البريد الإلكتروني' },
        { id: 'push-notifications', label: 'الإشعارات الفورية' },
        { id: 'notification-templates', label: 'قوالب الإشعارات' },
        { id: 'notification-settings', label: 'إعدادات الإشعارات' }
      ]
    },
    {
      id: 'system-settings',
      label: 'إعدادات النظام',
      description: 'إعدادات عامة',
      icon: Database,
      subPages: [
        { id: 'general-settings', label: 'الإعدادات العامة' },
        { id: 'database-management', label: 'إدارة قاعدة البيانات' },
        { id: 'backup-restore', label: 'النسخ الاحتياطي والاستعادة' },
        { id: 'system-logs', label: 'سجلات النظام' },
        { id: 'maintenance', label: 'الصيانة' }
      ]
    }
  ];

  // CMS Functions
  const fetchLandingPageContent = async () => {
    setContentLoading(true);
    try {
      console.log('Fetching landing page content...');
      const response = await fetch('/api/cms/landing-page');
      console.log('Response status:', response.status);
      if (response.ok) {
      const data = await response.json();
        console.log('Landing page data:', data);
        setLandingPageContent(data.data);
      } else {
        console.error('Response not ok:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching landing page content:', error);
    } finally {
      setContentLoading(false);
    }
  };

  const saveLandingPageContent = async (content: LandingPageContent) => {
    setContentLoading(true);
    try {
      const response = await fetch('/api/cms/landing-page', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(content),
      });
      if (response.ok) {
      const data = await response.json();
        setLandingPageContent(data.data);
        setIsEditingContent(false);
        // Broadcast update to landing page (same tab and other tabs)
        try {
          localStorage.setItem('cmsLandingUpdatedAt', String(Date.now()));
          window.dispatchEvent(new Event('cms:landing-updated'));
        } catch (e) {
          // no-op if storage is unavailable
        }
      } else {
        const msg = await response.text().catch(() => '');
        console.error('Failed to save landing page content', response.status, msg);
      }
    } catch (error) {
      console.error('Error saving landing page content:', error);
    } finally {
      setContentLoading(false);
    }
  };

  // Helper functions for managing CMS content
  const addFeature = () => {
    if (!landingPageContent) return;
    const newFeature: LandingPageFeature = {
      id: `temp-${Date.now()}`,
      title: 'ميزة جديدة',
      description: 'وصف الميزة الجديدة',
      icon: 'Star',
      order: landingPageContent.features.length + 1
    };
    setLandingPageContent({
      ...landingPageContent,
      features: [...landingPageContent.features, newFeature]
    });
  };

  const updateFeature = (id: string, updates: Partial<LandingPageFeature>) => {
    if (!landingPageContent) return;
    setLandingPageContent({
      ...landingPageContent,
      features: landingPageContent.features.map(f => 
        f.id === id ? { ...f, ...updates } : f
      )
    });
  };

  const deleteFeature = (id: string) => {
    if (!landingPageContent) return;
    setLandingPageContent({
      ...landingPageContent,
      features: landingPageContent.features.filter(f => f.id !== id)
    });
  };

  const addStat = () => {
    if (!landingPageContent) return;
    const newStat: LandingPageStat = {
      id: `temp-${Date.now()}`,
      number: '0',
      label: 'إحصائية جديدة',
      suffix: '',
      order: landingPageContent.stats.length + 1
    };
    setLandingPageContent({
      ...landingPageContent,
      stats: [...landingPageContent.stats, newStat]
    });
  };

  const updateStat = (id: string, updates: Partial<LandingPageStat>) => {
    if (!landingPageContent) return;
    setLandingPageContent({
      ...landingPageContent,
      stats: landingPageContent.stats.map(s => 
        s.id === id ? { ...s, ...updates } : s
      )
    });
  };

  const deleteStat = (id: string) => {
    if (!landingPageContent) return;
    setLandingPageContent({
      ...landingPageContent,
      stats: landingPageContent.stats.filter(s => s.id !== id)
    });
  };

  const addSolution = () => {
    if (!landingPageContent) return;
    const newSolution: LandingPageSolution = {
      id: `temp-${Date.now()}`,
      title: 'حل جديد',
      description: 'وصف الحل الجديد',
      icon: 'Target',
      order: landingPageContent.solutions.length + 1,
      features: []
    };
    setLandingPageContent({
      ...landingPageContent,
      solutions: [...landingPageContent.solutions, newSolution]
    });
  };

  const updateSolution = (id: string, updates: Partial<LandingPageSolution>) => {
    if (!landingPageContent) return;
    setLandingPageContent({
      ...landingPageContent,
      solutions: landingPageContent.solutions.map(s => 
        s.id === id ? { ...s, ...updates } : s
      )
    });
  };

  const deleteSolution = (id: string) => {
    if (!landingPageContent) return;
    setLandingPageContent({
      ...landingPageContent,
      solutions: landingPageContent.solutions.filter(s => s.id !== id)
    });
  };

  // Hero Metrics Management
  const addHeroMetric = () => {
    if (!landingPageContent) return;
    const newMetric: LandingPageHeroMetric = {
      id: `temp-${Date.now()}`,
      value: '0',
      label: 'مقياس جديد',
      color: 'blue',
      order: landingPageContent.heroDashboardMetrics.length + 1
    };
    setLandingPageContent({
      ...landingPageContent,
      heroDashboardMetrics: [...landingPageContent.heroDashboardMetrics, newMetric]
    });
  };

  const updateHeroMetric = (id: string, updates: Partial<LandingPageHeroMetric>) => {
    if (!landingPageContent) return;
    setLandingPageContent({
      ...landingPageContent,
      heroDashboardMetrics: landingPageContent.heroDashboardMetrics.map(m => 
        m.id === id ? { ...m, ...updates } : m
      )
    });
  };

  const deleteHeroMetric = (id: string) => {
    if (!landingPageContent) return;
    setLandingPageContent({
      ...landingPageContent,
      heroDashboardMetrics: landingPageContent.heroDashboardMetrics.filter(m => m.id !== id)
    });
  };

  // Contact Info Management
  const addContactInfo = () => {
    if (!landingPageContent) return;
    const newContact: LandingPageContactInfo = {
      id: `temp-${Date.now()}`,
      type: 'phone',
      label: 'معلومات جديدة',
      value: '',
      icon: 'Phone',
      order: landingPageContent.contactInfo.length + 1
    };
    setLandingPageContent({
      ...landingPageContent,
      contactInfo: [...landingPageContent.contactInfo, newContact]
    });
  };

  const updateContactInfo = (id: string, updates: Partial<LandingPageContactInfo>) => {
    if (!landingPageContent) return;
    setLandingPageContent({
      ...landingPageContent,
      contactInfo: landingPageContent.contactInfo.map(c => 
        c.id === id ? { ...c, ...updates } : c
      )
    });
  };

  const deleteContactInfo = (id: string) => {
    if (!landingPageContent) return;
    setLandingPageContent({
      ...landingPageContent,
      contactInfo: landingPageContent.contactInfo.filter(c => c.id !== id)
    });
  };

  // Navigation Management
  const addNavigation = () => {
    if (!landingPageContent) return;
    const newNav: LandingPageNavigation = {
      id: `temp-${Date.now()}`,
      text: 'رابط جديد',
      url: '#',
      order: landingPageContent.navigation.length + 1
    };
    setLandingPageContent({
      ...landingPageContent,
      navigation: [...landingPageContent.navigation, newNav]
    });
  };

  const updateNavigation = (id: string, updates: Partial<LandingPageNavigation>) => {
    if (!landingPageContent) return;
    setLandingPageContent({
      ...landingPageContent,
      navigation: landingPageContent.navigation.map(n => 
        n.id === id ? { ...n, ...updates } : n
      )
    });
  };

  const deleteNavigation = (id: string) => {
    if (!landingPageContent) return;
    setLandingPageContent({
      ...landingPageContent,
      navigation: landingPageContent.navigation.filter(n => n.id !== id)
    });
  };

  // Footer Links Management
  const addFooterLink = () => {
    if (!landingPageContent) return;
    const newLink: LandingPageFooterLink = {
      id: `temp-${Date.now()}`,
      text: 'رابط جديد',
      url: '#',
      category: 'عام',
      order: landingPageContent.footerLinks.length + 1
    };
    setLandingPageContent({
      ...landingPageContent,
      footerLinks: [...landingPageContent.footerLinks, newLink]
    });
  };

  const updateFooterLink = (id: string, updates: Partial<LandingPageFooterLink>) => {
    if (!landingPageContent) return;
    setLandingPageContent({
      ...landingPageContent,
      footerLinks: landingPageContent.footerLinks.map(f => 
        f.id === id ? { ...f, ...updates } : f
      )
    });
  };

  const deleteFooterLink = (id: string) => {
    if (!landingPageContent) return;
    setLandingPageContent({
      ...landingPageContent,
      footerLinks: landingPageContent.footerLinks.filter(f => f.id !== id)
    });
  };

  // Solution Features Management
  const addSolutionFeature = (solutionId: string) => {
    if (!landingPageContent) return;
    const solution = landingPageContent.solutions.find(s => s.id === solutionId);
    if (!solution) return;
    
    const newFeature: LandingPageSolutionFeature = {
      id: `temp-${Date.now()}`,
      text: 'ميزة جديدة',
      icon: 'CheckCircle',
      order: solution.features.length + 1
    };
    
    setLandingPageContent({
      ...landingPageContent,
      solutions: landingPageContent.solutions.map(s => 
        s.id === solutionId 
          ? { ...s, features: [...s.features, newFeature] }
          : s
      )
    });
  };

  const updateSolutionFeature = (solutionId: string, featureId: string, updates: Partial<LandingPageSolutionFeature>) => {
    if (!landingPageContent) return;
    setLandingPageContent({
      ...landingPageContent,
      solutions: landingPageContent.solutions.map(s => 
        s.id === solutionId 
          ? { 
              ...s, 
              features: s.features.map(f => 
                f.id === featureId ? { ...f, ...updates } : f
              )
            }
          : s
      )
    });
  };

  const deleteSolutionFeature = (solutionId: string, featureId: string) => {
    if (!landingPageContent) return;
    setLandingPageContent({
      ...landingPageContent,
      solutions: landingPageContent.solutions.map(s => 
        s.id === solutionId 
          ? { ...s, features: s.features.filter(f => f.id !== featureId) }
          : s
      )
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, orgsRes] = await Promise.all([
        fetch('/api/rbac/users', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }),
        fetch('/api/rbac/organizations', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
      ]);

      if (usersRes.ok && orgsRes.ok) {
        const usersData = await usersRes.json();
        const orgsData = await orgsRes.json();
        
        setUsers(usersData);
        setOrganizations(orgsData);
        
        setStats({
          totalUsers: usersData.length,
          activeUsers: usersData.filter((u: User) => u.isActive).length,
          totalOrganizations: orgsData.length,
          activeOrganizations: orgsData.filter((o: Organization) => o.isActive).length
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchLandingPageContent();
  }, []);

  // Fetch landing page content when navigating to landing pages
  useEffect(() => {
    if (activeSubPage === 'landing-pages') {
      fetchLandingPageContent();
    }
  }, [activeSubPage]);

  const refreshData = () => {
    fetchData();
  };

  // Analytics state for الإحصائيات العامة
  const [overviewAnalytics, setOverviewAnalytics] = useState<any | null>(null);
  const [propertyStats, setPropertyStats] = useState<any | null>(null);
  const [communicationStats, setCommunicationStats] = useState<any | null>(null);
  const [systemStats, setSystemStats] = useState<any | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const authHeader: any = {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('auth_token') ? { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } : {})
      };

      const [ov, ps, cs, rbacStats, sys] = await Promise.all([
        fetch('/api/analytics/overview', { headers: authHeader }).then(r => r.ok ? r.json() : Promise.resolve(null)).catch(() => null),
        fetch('/api/analytics/properties', { headers: authHeader }).then(r => r.ok ? r.json() : Promise.resolve(null)).catch(() => null),
        fetch('/api/analytics/communication', { headers: authHeader }).then(r => r.ok ? r.json() : Promise.resolve(null)).catch(() => null),
        fetch('/api/rbac-admin/stats', { headers: authHeader }).then(r => r.ok ? r.json() : Promise.resolve(null)).catch(() => null),
        fetch('/api/analytics/performance', { headers: authHeader }).then(r => r.ok ? r.json() : Promise.resolve(null)).catch(() => null),
      ]);

      setOverviewAnalytics(ov);
      setPropertyStats(ps);
      setCommunicationStats(cs);
      setSystemStats(sys);

      // Fold in recent logins if available
      if (rbacStats?.success && rbacStats.stats) {
        setOverviewAnalytics((prev: any) => ({ ...(prev || {}), recentLogins: rbacStats.stats.recentLogins }));
      }
    } catch (e) {
      console.error('Error loading analytics', e);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Pull analytics only when needed
  useEffect(() => {
    if (activeSidebarItem === 'overview' && activeSubPage === 'statistics') {
      fetchAnalytics();
    }
  }, [activeSidebarItem, activeSubPage]);

  const handleLogout = () => {
    logout();
    window.location.href = '/home/login';
  };

  const handleBackToSelection = () => {
    window.location.href = '/home/platform';
  };

  const renderContent = () => {
    switch (activeSidebarItem) {
      case 'overview':
        if (activeSubPage === 'statistics') {
          // Derive user-based KPIs from available users[]
          const toDate = new Date();
          const startOfToday = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
          const startOfYesterday = new Date(startOfToday);
          startOfYesterday.setDate(startOfYesterday.getDate() - 1);
          const endOfYesterday = new Date(startOfToday);

          const startOfWeek = new Date(startOfToday);
          startOfWeek.setDate(startOfWeek.getDate() - 7);
          const prevWeekStart = new Date(startOfWeek);
          prevWeekStart.setDate(prevWeekStart.getDate() - 7);

          const startOfMonth = new Date(toDate.getFullYear(), toDate.getMonth(), 1);
          const prevMonthStart = new Date(toDate.getFullYear(), toDate.getMonth() - 1, 1);
          const prevMonthEnd = new Date(startOfMonth);

          const quarter = Math.floor(toDate.getMonth() / 3);
          const startOfQuarter = new Date(toDate.getFullYear(), quarter * 3, 1);
          const prevQuarterStart = new Date(toDate.getFullYear(), (quarter - 1) * 3, 1);
          const prevQuarterEnd = new Date(startOfQuarter);

          const parseDate = (d: any) => (d ? new Date(d) : null);
          const createds = users.map(u => parseDate((u as any).createdAt)).filter(Boolean) as Date[];

          const countBetween = (arr: Date[], s: Date, e: Date) => arr.filter(d => d >= s && d < e).length;

          const newToday = countBetween(createds, startOfToday, new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000));
          const newYesterday = countBetween(createds, startOfYesterday, endOfYesterday);
          const newThisWeek = countBetween(createds, startOfWeek, startOfToday);
          const newPrevWeek = countBetween(createds, prevWeekStart, startOfWeek);
          const newThisMonth = countBetween(createds, startOfMonth, startOfToday);
          const newPrevMonth = countBetween(createds, prevMonthStart, prevMonthEnd);
          const newThisQuarter = countBetween(createds, startOfQuarter, startOfToday);
          const newPrevQuarter = countBetween(createds, prevQuarterStart, prevQuarterEnd);

          const pct = (a: number, b: number) => (b === 0 ? 0 : Math.round(((a - b) / Math.max(1, b)) * 100));

          return (
            <div className="space-y-6">
              <div className="content-header">
                <div>
                  <h3 className="content-title">الإحصائيات العامة</h3>
                  <p className="content-subtitle">أداء الحسابات والمحتوى والتواصل عبر الفترات الزمنية</p>
                </div>
                <div className="content-actions">
                  <Button variant="outline" size="sm" onClick={fetchAnalytics} disabled={analyticsLoading}>
                    <RefreshCw size={16} className={cn(analyticsLoading ? 'animate-spin' : '')} /> تحديث
                  </Button>
                </div>
              </div>

              {/* Accounts KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card><CardContent className="p-4">
                  <p className="text-xs text-gray-500">المستخدمون الجدد (اليوم)</p>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold">{newToday}</span>
                    <span className={`text-xs ${newToday >= newYesterday ? 'text-green-600' : 'text-red-600'}`}>{pct(newToday, newYesterday)}%</span>
                  </div>
                </CardContent></Card>
                <Card><CardContent className="p-4">
                  <p className="text-xs text-gray-500">المستخدمون الجدد (أمس)</p>
                  <div className="text-2xl font-bold">{newYesterday}</div>
                </CardContent></Card>
                <Card><CardContent className="p-4">
                  <p className="text-xs text-gray-500">أسبوعياً (WtW)</p>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold">{newThisWeek}</span>
                    <span className={`text-xs ${newThisWeek >= newPrevWeek ? 'text-green-600' : 'text-red-600'}`}>{pct(newThisWeek, newPrevWeek)}%</span>
                  </div>
                </CardContent></Card>
                <Card><CardContent className="p-4">
                  <p className="text-xs text-gray-500">شهرياً (MtM)</p>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold">{newThisMonth}</span>
                    <span className={`text-xs ${newThisMonth >= newPrevMonth ? 'text-green-600' : 'text-red-600'}`}>{pct(newThisMonth, newPrevMonth)}%</span>
                  </div>
                </CardContent></Card>
                <Card><CardContent className="p-4">
                  <p className="text-xs text-gray-500">ربع سنوي (QtQ)</p>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold">{newThisQuarter}</span>
                    <span className={`text-xs ${newThisQuarter >= newPrevQuarter ? 'text-green-600' : 'text-red-600'}`}>{pct(newThisQuarter, newPrevQuarter)}%</span>
                  </div>
                </CardContent></Card>
              </div>

              {/* Communications */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card><CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">رسائل WhatsApp</p>
                      <div className="text-2xl font-bold">{communicationStats?.whatsappMessages ?? '—'}</div>
                    </div>
                    <MessageSquare className="w-6 h-6 text-green-600" />
                  </div>
                </CardContent></Card>
                <Card><CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">رسائل البريد الإلكتروني</p>
                      <div className="text-2xl font-bold">{communicationStats?.emailsSent ?? '—'}</div>
                    </div>
                    <Mail className="w-6 h-6 text-blue-600" />
                  </div>
                </CardContent></Card>
                <Card><CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">رسائل SMS (OTP)</p>
                      <div className="text-2xl font-bold">{communicationStats?.smsSent ?? '—'}</div>
                    </div>
                    <Smartphone className="w-6 h-6 text-purple-600" />
                  </div>
                </CardContent></Card>
                <Card><CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">معدل الاستجابة</p>
                      <div className="text-2xl font-bold">{communicationStats?.responseRate ? `${communicationStats.responseRate}%` : '—'}</div>
                    </div>
                    <TrendingUp className="w-6 h-6 text-indigo-600" />
                  </div>
                </CardContent></Card>
              </div>

              {/* Listings and Cities */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader><CardTitle className="text-lg">المنشورات حسب نوع العقار</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {propertyStats?.byType ? (
                        Object.entries(propertyStats.byType).map(([type, count]: any) => (
                          <div key={type} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm text-gray-700">{type}</span>
                            <span className="font-semibold">{count as any}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">لا تتوفر بيانات</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-lg">المنشورات حسب المدن</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {propertyStats?.byCity ? (
                        Object.entries(propertyStats.byCity).map(([city, count]: any) => (
                          <div key={city} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm text-gray-700">{city}</span>
                            <span className="font-semibold">{count as any}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">لا تتوفر بيانات</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Overview extras */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card><CardContent className="p-4">
                  <p className="text-xs text-gray-500">إجمالي المستخدمين</p>
                  <div className="text-2xl font-bold">{overviewAnalytics?.totalUsers ?? stats.totalUsers}</div>
                </CardContent></Card>
                <Card><CardContent className="p-4">
                  <p className="text-xs text-gray-500">المستخدمون النشطون</p>
                  <div className="text-2xl font-bold">{overviewAnalytics?.activeUsers ?? stats.activeUsers}</div>
                </CardContent></Card>
                <Card><CardContent className="p-4">
                  <p className="text-xs text-gray-500">تسجيلات الدخول خلال 24 ساعة</p>
                  <div className="text-2xl font-bold">{overviewAnalytics?.recentLogins ?? '—'}</div>
                </CardContent></Card>
              </div>

              {/* System/Performance Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">إحصائيات النظام والأداء</CardTitle>
                  <CardDescription>مؤشرات صحة النظام وقاعدة البيانات</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-3 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500">تحميل المعالج (1م/5م/15م)</p>
                      <div className="mt-1 text-sm font-semibold">
                        {systemStats?.os?.loadAvg ? `${systemStats.os.loadAvg['1m'].toFixed(2)} / ${systemStats.os.loadAvg['5m'].toFixed(2)} / ${systemStats.os.loadAvg['15m'].toFixed(2)}` : '—'}
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500">الذاكرة المستخدمة / الكلية</p>
                      <div className="mt-1 text-sm font-semibold">
                        {systemStats?.os ? `${Math.round(systemStats.os.usedMem/1e6)}MB / ${Math.round(systemStats.os.totalMem/1e6)}MB (${systemStats.os.totalMem? Math.round(systemStats.os.usedMem*100/systemStats.os.totalMem): 0}%)` : '—'}
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500">حجم قاعدة البيانات (SQLite)</p>
                      <div className="mt-1 text-sm font-semibold">
                        {systemStats?.db ? `${(systemStats.db.sizeBytes/1e6).toFixed(2)} MB` : '—'}
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500">عدد المستخدمين</p>
                      <div className="mt-1 text-sm font-semibold">{systemStats?.counts?.users ?? '—'}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500">عقارات / عملاء محتملون</p>
                      <div className="mt-1 text-sm font-semibold">{systemStats?.counts ? `${systemStats.counts.properties} / ${systemStats.counts.leads}` : '—'}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500">منظمات/وكلاء قيد التحقق</p>
                      <div className="mt-1 text-sm font-semibold">{systemStats?.counts ? `${systemStats.counts.organizationsPendingVerification} / ${systemStats.counts.agentsPendingVerification}` : '—'}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500">مطالبات نشطة</p>
                      <div className="mt-1 text-sm font-semibold">{systemStats?.counts?.activeClaims ?? '—'}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500">تحذيرات كلمات المرور</p>
                      <div className="mt-1 text-sm font-semibold">{systemStats?.counts?.weakPasswordHashes ?? 0}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500">وقت تشغيل الخادم</p>
                      <div className="mt-1 text-sm font-semibold">{systemStats?.os ? `${Math.floor(systemStats.os.uptimeSec/3600)} ساعة` : '—'}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            {/* Main Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">إجمالي المستخدمين</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
                      <p className="text-xs text-green-600 mt-1">+12% من الشهر الماضي</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">المستخدمون النشطون</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.activeUsers.toLocaleString()}</p>
                      <p className="text-xs text-green-600 mt-1">+8% من الشهر الماضي</p>
                </div>
                    <UserCheck className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                      <p className="text-sm font-medium text-gray-600">إجمالي المنظمات</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.totalOrganizations.toLocaleString()}</p>
                      <p className="text-xs text-blue-600 mt-1">+5 منظمة جديدة</p>
                </div>
                <Building2 className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                      <p className="text-sm font-medium text-gray-600">المنظمات النشطة</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.activeOrganizations.toLocaleString()}</p>
                      <p className="text-xs text-indigo-600 mt-1">معدل نشاط 85%</p>
                </div>
                    <Activity className="w-8 h-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        </div>

            {/* Additional Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">إحصائيات النظام</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">إجمالي العقارات</span>
                      <span className="font-semibold">1,247</span>
                        </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">العقارات النشطة</span>
                      <span className="font-semibold">1,156</span>
                      </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">طلبات الشراء</span>
                      <span className="font-semibold">89</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">المعاملات المكتملة</span>
                      <span className="font-semibold">234</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">نشاط المستخدمين</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">تسجيلات اليوم</span>
                      <span className="font-semibold text-green-600">+23</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">تسجيلات هذا الأسبوع</span>
                      <span className="font-semibold text-green-600">+156</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">تسجيلات هذا الشهر</span>
                      <span className="font-semibold text-green-600">+1,234</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">معدل الاحتفاظ</span>
                      <span className="font-semibold text-blue-600">78%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

            <Card>
              <CardHeader>
                  <CardTitle className="text-lg">أداء النظام</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">وقت الاستجابة</span>
                      <span className="font-semibold text-green-600">245ms</span>
                  </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">معدل النجاح</span>
                      <span className="font-semibold text-green-600">99.8%</span>
                </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">استخدام الخادم</span>
                      <span className="font-semibold text-yellow-600">67%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">مساحة التخزين</span>
                      <span className="font-semibold text-blue-600">2.4GB</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">النشاط الأخير</CardTitle>
                <CardDescription>آخر الأنشطة في النظام</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 ">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                      <p className="text-sm font-medium">مستخدم جديد انضم للنظام</p>
                      <p className="text-xs text-gray-500">أحمد محمد - منذ 5 دقائق</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 ">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">عقار جديد تم إضافته</p>
                      <p className="text-xs text-gray-500">فيلا في الرياض - منذ 12 دقيقة</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 ">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">منظمة جديدة تم تسجيلها</p>
                      <p className="text-xs text-gray-500">شركة العقارات المتقدمة - منذ 1 ساعة</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 ">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">معاملة مكتملة</p>
                      <p className="text-xs text-gray-500">بيع شقة في جدة - منذ 2 ساعة</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'users':
  return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold">إدارة المستخدمين</h3>
              <Button className="bg-blue-600 hover:bg-blue-700">
                إضافة مستخدم جديد
              </Button>
            </div>

            {/* User Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
              <div>
                      <p className="text-sm text-gray-600">إجمالي المستخدمين</p>
                      <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
                    <Users className="w-6 h-6 text-blue-600" />
            </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">المستخدمون النشطون</p>
                      <p className="text-2xl font-bold text-green-600">{stats.activeUsers}</p>
                    </div>
                    <UserCheck className="w-6 h-6 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">المديرون</p>
                      <p className="text-2xl font-bold text-purple-600">12</p>
                    </div>
                    <Shield className="w-6 h-6 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">المستخدمون الجدد</p>
                      <p className="text-2xl font-bold text-orange-600">23</p>
                    </div>
                    <Activity className="w-6 h-6 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* User Filters */}
            <Card>
              <CardHeader>
                <CardTitle>فلترة المستخدمين</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Select>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="اختر الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع المستخدمين</SelectItem>
                      <SelectItem value="active">النشطون فقط</SelectItem>
                      <SelectItem value="inactive">غير النشطون</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="اختر الدور" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الأدوار</SelectItem>
                      <SelectItem value="admin">المديرون</SelectItem>
                      <SelectItem value="agent">الوكلاء</SelectItem>
                      <SelectItem value="user">المستخدمون</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="البحث بالاسم أو البريد الإلكتروني" className="w-64" />
                </div>
              </CardContent>
            </Card>

            {/* Users List */}
            <Card>
              <CardHeader>
                <CardTitle>قائمة المستخدمين</CardTitle>
                <CardDescription>إدارة جميع مستخدمي النظام</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.length > 0 ? users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4 ">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {user.fullName?.charAt(0) || user.username?.charAt(0) || 'U'}
                          </span>
                            </div>
                              <div>
                          <p className="font-medium">{user.fullName || 'غير محدد'}</p>
                          <p className="text-sm text-gray-500">{user.username}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                              </div>
                      </div>
                      <div className="flex items-center space-x-4 ">
                            <Badge variant={user.isActive ? "default" : "secondary"}>
                          {user.isActive ? "نشط" : "غير نشط"}
                            </Badge>
                        <div className="flex space-x-2 ">
                          <Button variant="outline" size="sm">تعديل</Button>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            حذف
                              </Button>
                            </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">لا يوجد مستخدمون في النظام</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'organizations':
        return (
          <div className="space-y-6">
                <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold">إدارة المنظمات</h3>
              <Button className="bg-blue-600 hover:bg-blue-700">
                    إضافة منظمة جديدة
                  </Button>
                </div>

            {/* Organization Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">إجمالي المنظمات</p>
                      <p className="text-2xl font-bold">{stats.totalOrganizations}</p>
                    </div>
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">المنظمات النشطة</p>
                      <p className="text-2xl font-bold text-green-600">{stats.activeOrganizations}</p>
                    </div>
                    <Activity className="w-6 h-6 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">متوسط المستخدمين</p>
                      <p className="text-2xl font-bold text-purple-600">45</p>
                    </div>
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Organizations List */}
            <Card>
              <CardHeader>
                <CardTitle>قائمة المنظمات</CardTitle>
                <CardDescription>إدارة جميع المنظمات والشركات</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {organizations.length > 0 ? organizations.map((org) => (
                    <div key={org.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4 ">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">{org.name}</p>
                          <p className="text-sm text-gray-500">{org.description}</p>
                          <p className="text-xs text-gray-400">{org.userCount} مستخدم</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 ">
                            <Badge variant={org.isActive ? "default" : "secondary"}>
                          {org.isActive ? "نشط" : "غير نشط"}
                            </Badge>
                        <div className="flex space-x-2 ">
                          <Button variant="outline" size="sm">تعديل</Button>
                          <Button variant="outline" size="sm">المستخدمون</Button>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            حذف
                              </Button>
            </div>
          </div>
        </div>
                  )) : (
                    <div className="text-center py-8">
                      <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">لا توجد منظمات في النظام</p>
      </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'roles':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold">إدارة الأدوار</h3>
              <Button className="bg-blue-600 hover:bg-blue-700">
                إضافة دور جديد
                              </Button>
                            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                  <CardTitle className="flex items-center space-x-2 ">
                    <Shield className="w-5 h-5 text-red-600" />
                    <span>مدير النظام</span>
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="text-sm text-gray-600 mb-4">صلاحيات كاملة على النظام</p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 ">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs">إدارة المستخدمين</span>
                        </div>
                    <div className="flex items-center space-x-2 ">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs">إدارة المنظمات</span>
                    </div>
                    <div className="flex items-center space-x-2 ">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs">إعدادات النظام</span>
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-2 ">
                    <Button variant="outline" size="sm">تعديل</Button>
                    <Button variant="outline" size="sm">المستخدمون</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                  <CardTitle className="flex items-center space-x-2 ">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span>مدير المنظمة</span>
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="text-sm text-gray-600 mb-4">إدارة منظمة واحدة</p>
                        <div className="space-y-2">
                    <div className="flex items-center space-x-2 ">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs">إدارة وكلاء المنظمة</span>
                        </div>
                    <div className="flex items-center space-x-2 ">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs">عرض التقارير</span>
                          </div>
                    <div className="flex items-center space-x-2 ">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-xs">صلاحيات محدودة</span>
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-2 ">
                    <Button variant="outline" size="sm">تعديل</Button>
                    <Button variant="outline" size="sm">المستخدمون</Button>
                        </div>
                      </CardContent>
                    </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 ">
                    <UserCheck className="w-5 h-5 text-green-600" />
                    <span>وكيل عقاري</span>
                  </CardTitle>
                      </CardHeader>
                      <CardContent>
                  <p className="text-sm text-gray-600 mb-4">إدارة العقارات والعمليات</p>
                        <div className="space-y-2">
                    <div className="flex items-center space-x-2 ">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs">إدارة العقارات</span>
                              </div>
                    <div className="flex items-center space-x-2 ">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs">إدارة العملاء</span>
                          </div>
                    <div className="flex items-center space-x-2 ">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-xs">عرض التقارير الأساسية</span>
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-2 ">
                    <Button variant="outline" size="sm">تعديل</Button>
                    <Button variant="outline" size="sm">المستخدمون</Button>
                        </div>
                      </CardContent>
                    </Card>
                </div>
          </div>
        );

      case 'cms':
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold">إدارة المحتوى</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>محتوى الصفحة الرئيسية</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                    <Label>العنوان الرئيسي</Label>
                    <Input placeholder="أهلاً بك في منصة العقارات" />
                    </div>
                  <div>
                    <Label>الوصف</Label>
                    <Textarea placeholder="وصف الصفحة الرئيسية..." />
                  </div>
                  <Button>حفظ التغييرات</Button>
              </CardContent>
            </Card>

              <Card>
                <CardHeader>
                  <CardTitle>إعدادات الموقع</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                    <Label>اسم الموقع</Label>
                    <Input placeholder="عقاراتي" />
                    </div>
                  <div>
                    <Label>شعار الموقع</Label>
                    <Input type="file" />
                  </div>
                  <div>
                    <Label>لغة الموقع</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="العربية" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ar">العربية</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button>حفظ الإعدادات</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold">الأمان والحماية</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 ">
                    <Lock className="w-5 h-5 text-red-600" />
                    <span>إعدادات الأمان</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>تسجيل الدخول بخطوتين</span>
                    <Button variant="outline" size="sm">تفعيل</Button>
                    </div>
                  <div className="flex items-center justify-between">
                    <span>تشفير البيانات</span>
                    <Badge variant="default">مفعل</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>نسخ احتياطية تلقائية</span>
                    <Badge variant="default">مفعل</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>مراقبة محاولات الدخول</span>
                    <Badge variant="default">مفعل</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>سجل الأمان</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 ">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm">تسجيل دخول ناجح</p>
                        <p className="text-xs text-gray-500">admin1 - منذ 5 دقائق</p>
                    </div>
                    </div>
                    <div className="flex items-center space-x-3 ">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm">محاولة دخول فاشلة</p>
                        <p className="text-xs text-gray-500">IP: 192.168.1.100 - منذ 15 دقيقة</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 ">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm">تغيير كلمة مرور</p>
                        <p className="text-xs text-gray-500">user123 - منذ ساعة</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold">التحليلات والتقارير</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                  <CardTitle>إحصائيات الاستخدام</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>زيارات اليوم</span>
                      <span className="font-semibold">1,234</span>
                      </div>
                    <div className="flex justify-between">
                      <span>زيارات هذا الأسبوع</span>
                      <span className="font-semibold">8,567</span>
                    </div>
                    <div className="flex justify-between">
                      <span>زيارات هذا الشهر</span>
                      <span className="font-semibold">45,678</span>
                    </div>
                    <div className="flex justify-between">
                      <span>معدل الارتداد</span>
                      <span className="font-semibold text-green-600">32%</span>
                    </div>
                </div>
              </CardContent>
            </Card>

              <Card>
                <CardHeader>
                  <CardTitle>أداء النظام</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>وقت الاستجابة المتوسط</span>
                      <span className="font-semibold text-green-600">245ms</span>
            </div>
                    <div className="flex justify-between">
                      <span>معدل النجاح</span>
                      <span className="font-semibold text-green-600">99.8%</span>
            </div>
                    <div className="flex justify-between">
                      <span>استخدام الخادم</span>
                      <span className="font-semibold text-yellow-600">67%</span>
            </div>
                    <div className="flex justify-between">
                      <span>مساحة التخزين المستخدمة</span>
                      <span className="font-semibold">2.4GB / 10GB</span>
            </div>
            </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'revenue':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">إجمالي الإيرادات الشهرية</p>
                      <p className="text-3xl font-bold text-gray-900">$45,230</p>
                      <p className="text-xs text-green-600 mt-1">+12.5% من الشهر الماضي</p>
                </div>
                    <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                      <p className="text-sm font-medium text-gray-600">الاشتراكات النشطة</p>
                      <p className="text-3xl font-bold text-gray-900">1,247</p>
                      <p className="text-xs text-blue-600 mt-1">+8% من الشهر الماضي</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">متوسط قيمة الاشتراك</p>
                      <p className="text-3xl font-bold text-gray-900">$36.30</p>
                      <p className="text-xs text-purple-600 mt-1">+2.1% من الشهر الماضي</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">معدل التجديد</p>
                      <p className="text-3xl font-bold text-gray-900">87.3%</p>
                      <p className="text-xs text-green-600 mt-1">+1.2% من الشهر الماضي</p>
                    </div>
                    <RefreshCw className="w-8 h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
        </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>خطط الاشتراك</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">الخطة الأساسية</p>
                        <p className="text-sm text-gray-600">للأفراد والمستقلين</p>
                        </div>
                      <div className="text-right">
                        <p className="font-bold">$29/شهر</p>
                        <p className="text-sm text-green-600">456 مشترك</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">الخطة المهنية</p>
                        <p className="text-sm text-gray-600">للشركات الصغيرة</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">$79/شهر</p>
                        <p className="text-sm text-green-600">234 مشترك</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">الخطة المؤسسية</p>
                        <p className="text-sm text-gray-600">للشركات الكبيرة</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">$199/شهر</p>
                        <p className="text-sm text-green-600">89 مشترك</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>الإيرادات حسب النوع</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-blue-500 rounded"></div>
                        <span className="text-sm">الاشتراكات الشهرية</span>
                      </div>
                      <span className="font-medium">$32,450 (72%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                        <span className="text-sm">الاشتراكات السنوية</span>
                      </div>
                      <span className="font-medium">$8,900 (20%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-purple-500 rounded"></div>
                        <span className="text-sm">الخدمات الإضافية</span>
                      </div>
                      <span className="font-medium">$3,880 (8%)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'complaints':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">إجمالي الشكاوى</p>
                      <p className="text-3xl font-bold text-gray-900">127</p>
                      <p className="text-xs text-red-600 mt-1">+5 من هذا الأسبوع</p>
                  </div>
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">الشكاوى المفتوحة</p>
                      <p className="text-3xl font-bold text-gray-900">23</p>
                      <p className="text-xs text-orange-600 mt-1">تحتاج متابعة</p>
                    </div>
                    <MessageSquare className="w-8 h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">متوسط وقت الحل</p>
                      <p className="text-3xl font-bold text-gray-900">2.3</p>
                      <p className="text-xs text-green-600 mt-1">أيام</p>
                    </div>
                    <Activity className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>الشكاوى الأخيرة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">مشكلة في تسجيل الدخول</p>
                        <p className="text-sm text-gray-600">أحمد محمد - منذ ساعتين</p>
                    </div>
                  </div>
                    <Badge variant="destructive">عاجل</Badge>
                </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">مشكلة في رفع الصور</p>
                        <p className="text-sm text-gray-600">فاطمة أحمد - منذ 4 ساعات</p>
                      </div>
                    </div>
                    <Badge variant="secondary">متوسط</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">استفسار عن الميزات</p>
                        <p className="text-sm text-gray-600">محمد علي - منذ 6 ساعات</p>
                      </div>
                    </div>
                    <Badge variant="outline">منخفض</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'integrations':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                            <div>
                      <p className="text-sm font-medium text-gray-600">WhatsApp</p>
                      <p className="text-2xl font-bold text-green-600">مفعل</p>
                      <p className="text-xs text-gray-600 mt-1">1,234 رسالة اليوم</p>
                            </div>
                    <Smartphone className="w-8 h-8 text-green-600" />
                            </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                              <div>
                      <p className="text-sm font-medium text-gray-600">البريد الإلكتروني</p>
                      <p className="text-2xl font-bold text-blue-600">مفعل</p>
                      <p className="text-xs text-gray-600 mt-1">567 إيميل اليوم</p>
                              </div>
                    <Mail className="w-8 h-8 text-blue-600" />
                            </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">SMS</p>
                      <p className="text-2xl font-bold text-purple-600">مفعل</p>
                      <p className="text-xs text-gray-600 mt-1">89 رسالة اليوم</p>
                    </div>
                    <MessageSquare className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">وسائل التواصل</p>
                      <p className="text-2xl font-bold text-pink-600">مفعل</p>
                      <p className="text-xs text-gray-600 mt-1">Facebook, Instagram</p>
                    </div>
                    <Share2 className="w-8 h-8 text-pink-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                  <CardTitle>إعدادات WhatsApp</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>رقم WhatsApp Business</span>
                      <span className="font-mono">+966501234567</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>الرسائل المرسلة اليوم</span>
                      <span className="font-bold text-green-600">1,234</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>الرسائل المستلمة</span>
                      <span className="font-bold text-blue-600">567</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>معدل الاستجابة</span>
                      <span className="font-bold text-purple-600">94.2%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>إعدادات البريد الإلكتروني</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>خادم SMTP</span>
                      <span className="font-mono">smtp.gmail.com</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>الإيميلات المرسلة اليوم</span>
                      <span className="font-bold text-green-600">567</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>معدل التسليم</span>
                      <span className="font-bold text-blue-600">98.7%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>معدل الفتح</span>
                      <span className="font-bold text-purple-600">23.4%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'cms':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                  <div>
                      <p className="text-sm font-medium text-gray-600">صفحات الهبوط</p>
                      <p className="text-3xl font-bold text-gray-900">24</p>
                      <p className="text-xs text-green-600 mt-1">+3 صفحات جديدة</p>
                  </div>
                    <FileText className="w-8 h-8 text-blue-600" />
                </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">المقالات</p>
                      <p className="text-3xl font-bold text-gray-900">156</p>
                      <p className="text-xs text-blue-600 mt-1">+12 مقال هذا الأسبوع</p>
                    </div>
                    <FileText className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">الصور والملفات</p>
                      <p className="text-3xl font-bold text-gray-900">2,847</p>
                      <p className="text-xs text-purple-600 mt-1">+89 ملف اليوم</p>
                    </div>
                    <FileText className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>صفحات الهبوط النشطة</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">الصفحة الرئيسية</p>
                        <p className="text-sm text-gray-600">الرئيسية</p>
                            </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">نشطة</p>
                        <p className="text-sm text-gray-600">1,234 زيارة</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">صفحة الخدمات</p>
                        <p className="text-sm text-gray-600">الخدمات</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">نشطة</p>
                        <p className="text-sm text-gray-600">567 زيارة</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">صفحة الاتصال</p>
                        <p className="text-sm text-gray-600">الاتصال</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">نشطة</p>
                        <p className="text-sm text-gray-600">234 زيارة</p>
                      </div>
                    </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                  <CardTitle>إحصائيات المحتوى</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="space-y-4">
                        <div className="flex items-center justify-between">
                      <span>إجمالي المشاهدات</span>
                      <span className="font-bold">45,678</span>
                        </div>
                    <div className="flex items-center justify-between">
                      <span>معدل الارتداد</span>
                      <span className="font-bold text-green-600">32.1%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>متوسط وقت الجلسة</span>
                      <span className="font-bold text-blue-600">2:34</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>معدل التحويل</span>
                      <span className="font-bold text-purple-600">4.2%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'features':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>ميزات الشركات</CardTitle>
                      </CardHeader>
                      <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>إدارة متعددة المستخدمين</span>
                              </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>تقارير متقدمة وتحليلات</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>API مخصص</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>دعم أولوية</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>تخصيص العلامة التجارية</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>تكامل مع أنظمة CRM</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>نسخ احتياطية يومية</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>أمان متقدم</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

              <Card>
                <CardHeader>
                  <CardTitle>ميزات الأفراد</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>إدارة العقارات الأساسية</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>إدارة العملاء</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>تقارير أساسية</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>دعم البريد الإلكتروني</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>تطبيق الجوال</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>تكامل WhatsApp</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>نسخ احتياطية أسبوعية</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>أمان أساسي</span>
                    </div>
                </div>
              </CardContent>
            </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>مقارنة الخطط</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right p-3">الميزة</th>
                        <th className="text-center p-3">الأفراد</th>
                        <th className="text-center p-3">الشركات</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-3">عدد العقارات</td>
                        <td className="text-center p-3">100</td>
                        <td className="text-center p-3">غير محدود</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">عدد المستخدمين</td>
                        <td className="text-center p-3">1</td>
                        <td className="text-center p-3">غير محدود</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">التقارير</td>
                        <td className="text-center p-3">أساسية</td>
                        <td className="text-center p-3">متقدمة</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">الدعم</td>
                        <td className="text-center p-3">بريد إلكتروني</td>
                        <td className="text-center p-3">أولوية + هاتف</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">المشتركون اليوم</p>
                      <p className="text-3xl font-bold text-gray-900">23</p>
                      <p className="text-xs text-green-600 mt-1">+15% من أمس</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">المشتركون هذا الأسبوع</p>
                      <p className="text-3xl font-bold text-gray-900">156</p>
                      <p className="text-xs text-blue-600 mt-1">+8% من الأسبوع الماضي</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">المشتركون هذا الشهر</p>
                      <p className="text-3xl font-bold text-gray-900">1,234</p>
                      <p className="text-xs text-purple-600 mt-1">+12% من الشهر الماضي</p>
                    </div>
                    <PieChart className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">المشتركون هذا العام</p>
                      <p className="text-3xl font-bold text-gray-900">8,567</p>
                      <p className="text-xs text-orange-600 mt-1">+25% من العام الماضي</p>
                    </div>
                    <Activity className="w-8 h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                  <CardTitle>اتجاهات الاشتراك (آخر 30 يوم)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">رسم بياني للاتجاهات</p>
                      <p className="text-sm text-gray-500">سيتم إضافة الرسوم البيانية قريباً</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>توزيع المشتركين حسب النوع</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-blue-500 rounded"></div>
                        <span>الأفراد</span>
                      </div>
                      <span className="font-medium">1,456 (65%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                        <span>الشركات الصغيرة</span>
                      </div>
                      <span className="font-medium">567 (25%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-purple-500 rounded"></div>
                        <span>الشركات الكبيرة</span>
                      </div>
                      <span className="font-medium">234 (10%)</span>
                    </div>
                </div>
              </CardContent>
            </Card>
      </div>
          </div>
        );

      case 'invoicing':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">الفواتير المرسلة</p>
                      <p className="text-3xl font-bold text-gray-900">1,247</p>
                      <p className="text-xs text-green-600 mt-1">+23 هذا الشهر</p>
            </div>
                    <FileText className="w-8 h-8 text-blue-600" />
            </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">المدفوعات المستلمة</p>
                      <p className="text-3xl font-bold text-gray-900">1,189</p>
                      <p className="text-xs text-green-600 mt-1">95.3% معدل الدفع</p>
            </div>
                    <CreditCard className="w-8 h-8 text-green-600" />
            </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">الفواتير المعلقة</p>
                      <p className="text-3xl font-bold text-gray-900">58</p>
                      <p className="text-xs text-orange-600 mt-1">تحتاج متابعة</p>
            </div>
                    <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">إجمالي المبالغ</p>
                      <p className="text-3xl font-bold text-gray-900">$45,230</p>
                      <p className="text-xs text-purple-600 mt-1">هذا الشهر</p>
          </div>
                    <DollarSign className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>الفواتير الأخيرة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">#INV-2024-001</p>
                        <p className="text-sm text-gray-600">شركة العقارات المتقدمة</p>
            </div>
                      <div className="text-right">
                        <p className="font-bold">$199.00</p>
                        <Badge variant="default">مدفوعة</Badge>
            </div>
            </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">#INV-2024-002</p>
                        <p className="text-sm text-gray-600">أحمد محمد - وكيل عقاري</p>
            </div>
                      <div className="text-right">
                        <p className="font-bold">$79.00</p>
                        <Badge variant="secondary">معلقة</Badge>
            </div>
          </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">#INV-2024-003</p>
                        <p className="text-sm text-gray-600">فاطمة أحمد - مستشارة عقارية</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">$29.00</p>
                        <Badge variant="default">مدفوعة</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>طرق الدفع</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                        <span>البطاقات الائتمانية</span>
                      </div>
                      <span className="font-medium">$28,450 (63%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Smartphone className="w-5 h-5 text-green-600" />
                        <span>التحويل البنكي</span>
                      </div>
                      <span className="font-medium">$12,340 (27%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <DollarSign className="w-5 h-5 text-purple-600" />
                        <span>الدفع النقدي</span>
                      </div>
                      <span className="font-medium">$4,440 (10%)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'content-management':
        return (
          <div className="space-y-6">
            {activeSubPage === 'landing-pages' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">إدارة صفحة الهبوط</h2>
                    <p className="text-gray-600">تحرير محتوى الصفحة الرئيسية</p>
                  </div>
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => window.open('/home', '_blank')}
                      className="flex items-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>معاينة الصفحة</span>
                    </Button>
                    <Button
                      onClick={() => setIsEditingContent(!isEditingContent)}
                      className="flex items-center space-x-2"
                    >
                      <Edit className="w-4 h-4" />
                      <span>{isEditingContent ? 'إلغاء التحرير' : 'تحرير المحتوى'}</span>
                    </Button>
                  </div>
                </div>

                {contentLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
                    <p>جار تحميل المحتوى...</p>
                  </div>
                ) : landingPageContent ? (
                  <div className="space-y-6">
                    {/* Content Tabs */}
                    <Tabs dir="rtl" value={activeContentTab} onValueChange={setActiveContentTab}>
                      <div className="w-full">
                      <TabsList
                        className="w-full flex flex-row-reverse flex-wrap items-center justify-end gap-4 rounded-2xl bg-white dark:bg-gray-900 p-2 ring-1 ring-slate-200 dark:ring-gray-700 shadow-sm"
                      >
                        <TabsTrigger
                          value="hero"
                          className="flex items-center justify-center gap-2 flex-row-reverse rounded-xl px-5 py-2 text-sm font-medium text-blue-800/90 dark:text-blue-200/90 transition min-w-[7.5rem]
                                     hover:bg-white/70 dark:hover:bg-gray-800/80
                                     data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800
                                     data-[state=active]:text-blue-900 dark:data-[state=active]:text-blue-100
                                     data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-blue-100 dark:data-[state=active]:ring-gray-700"
                        >
                          <span>البطل</span>
                          <Zap className="w-4 h-4 opacity-70" />
                        </TabsTrigger>
                        <TabsTrigger
                          value="features"
                          className="flex items-center justify-center gap-2 flex-row-reverse rounded-xl px-5 py-2 text-sm font-medium text-blue-800/90 dark:text-blue-200/90 transition min-w-[7.5rem]
                                     hover:bg-white/70 dark:hover:bg-gray-800/80
                                     data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800
                                     data-[state=active]:text-blue-900 dark:data-[state=active]:text-blue-100
                                     data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-blue-100 dark:data-[state=active]:ring-gray-700"
                        >
                          <span>الميزات</span>
                          <Star className="w-4 h-4 opacity-70" />
                        </TabsTrigger>
                        <TabsTrigger
                          value="stats"
                          className="flex items-center justify-center gap-2 flex-row-reverse rounded-xl px-5 py-2 text-sm font-medium text-blue-800/90 dark:text-blue-200/90 transition min-w-[7.5rem]
                                     hover:bg-white/70 dark:hover:bg-gray-800/80
                                     data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800
                                     data-[state=active]:text-blue-900 dark:data-[state=active]:text-blue-100
                                     data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-blue-100 dark:data-[state=active]:ring-gray-700"
                        >
                          <span>الإحصائيات</span>
                          <PieChart className="w-4 h-4 opacity-70" />
                        </TabsTrigger>
                        <TabsTrigger
                          value="solutions"
                          className="flex items-center justify-center gap-2 flex-row-reverse rounded-xl px-5 py-2 text-sm font-medium text-blue-800/90 dark:text-blue-200/90 transition min-w-[7.5rem]
                                     hover:bg-white/70 dark:hover:bg-gray-800/80
                                     data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800
                                     data-[state=active]:text-blue-900 dark:data-[state=active]:text-blue-100
                                     data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-blue-100 dark:data-[state=active]:ring-gray-700"
                        >
                          <span>الحلول</span>
                          <Target className="w-4 h-4 opacity-70" />
                        </TabsTrigger>
                        <TabsTrigger
                          value="pricing"
                          className="flex items-center justify-center gap-2 flex-row-reverse rounded-xl px-5 py-2 text-sm font-medium text-blue-800/90 dark:text-blue-200/90 transition min-w-[7.5rem]
                                     hover:bg-white/70 dark:hover:bg-gray-800/80
                                     data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800
                                     data-[state=active]:text-blue-900 dark:data-[state=active]:text-blue-100
                                     data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-blue-100 dark:data-[state=active]:ring-gray-700"
                        >
                          <span>الأسعار</span>
                          <DollarSign className="w-4 h-4 opacity-70" />
                        </TabsTrigger>
                        <TabsTrigger
                          value="contact"
                          className="flex items-center justify-center gap-2 flex-row-reverse rounded-xl px-5 py-2 text-sm font-medium text-blue-800/90 dark:text-blue-200/90 transition min-w-[7.5rem]
                                     hover:bg-white/70 dark:hover:bg-gray-800/80
                                     data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800
                                     data-[state=active]:text-blue-900 dark:data-[state=active]:text-blue-100
                                     data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-blue-100 dark:data-[state=active]:ring-gray-700"
                        >
                          <span>التواصل</span>
                          <Mail className="w-4 h-4 opacity-70" />
                        </TabsTrigger>
                        <TabsTrigger
                          value="navigation"
                          className="flex items-center justify-center gap-2 flex-row-reverse rounded-xl px-5 py-2 text-sm font-medium text-blue-800/90 dark:text-blue-200/90 transition min-w-[7.5rem]
                                     hover:bg-white/70 dark:hover:bg-gray-800/80
                                     data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800
                                     data-[state=active]:text-blue-900 dark:data-[state=active]:text-blue-100
                                     data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-blue-100 dark:data-[state=active]:ring-gray-700"
                        >
                          <span>التنقل</span>
                          <Navigation className="w-4 h-4 opacity-70" />
                        </TabsTrigger>
                        <TabsTrigger
                          value="footer"
                          className="flex items-center justify-center gap-2 flex-row-reverse rounded-xl px-5 py-2 text-sm font-medium text-blue-800/90 dark:text-blue-200/90 transition min-w-[7.5rem]
                                     hover:bg-white/70 dark:hover:bg-gray-800/80
                                     data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800
                                     data-[state=active]:text-blue-900 dark:data-[state=active]:text-blue-100
                                     data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-blue-100 dark:data-[state=active]:ring-gray-700"
                        >
                          <span>التذييل</span>
                          <FileText className="w-4 h-4 opacity-70" />
                        </TabsTrigger>
                      </TabsList>
                      </div>

                      {/* Hero Section */}
                      <TabsContent value="hero" className="space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>قسم البطل (Hero Section)</CardTitle>
                            <CardDescription>النص الرئيسي في أعلى الصفحة</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="heroWelcomeText">نص الترحيب</Label>
              <Input
                                  id="heroWelcomeText"
                                  value={landingPageContent.heroWelcomeText}
                                  onChange={(e) => setLandingPageContent({
                                    ...landingPageContent,
                                    heroWelcomeText: e.target.value
                                  })}
                                  disabled={!isEditingContent}
              />
            </div>
                              <div>
                                <Label htmlFor="heroTitle">العنوان الرئيسي</Label>
              <Input
                                  id="heroTitle"
                                  value={landingPageContent.heroTitle}
                                  onChange={(e) => setLandingPageContent({
                                    ...landingPageContent,
                                    heroTitle: e.target.value
                                  })}
                                  disabled={!isEditingContent}
              />
            </div>
                            </div>
                            <div>
                              <Label htmlFor="heroSubtitle">العنوان الفرعي</Label>
                              <Textarea
                                id="heroSubtitle"
                                value={landingPageContent.heroSubtitle}
                                onChange={(e) => setLandingPageContent({
                                  ...landingPageContent,
                                  heroSubtitle: e.target.value
                                })}
                                disabled={!isEditingContent}
                                rows={3}
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="heroButton">نص زر البدء</Label>
              <Input
                                  id="heroButton"
                                  value={landingPageContent.heroButton}
                                  onChange={(e) => setLandingPageContent({
                                    ...landingPageContent,
                                    heroButton: e.target.value
                                  })}
                                  disabled={!isEditingContent}
              />
            </div>
                              <div>
                                <Label htmlFor="heroLoginButton">نص زر تسجيل الدخول</Label>
              <Input
                                  id="heroLoginButton"
                                  value={landingPageContent.heroLoginButton}
                                  onChange={(e) => setLandingPageContent({
                                    ...landingPageContent,
                                    heroLoginButton: e.target.value
                                  })}
                                  disabled={!isEditingContent}
              />
            </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Hero Dashboard Metrics */}
                        <Card>
                          <CardHeader>
                            <div className="flex justify-between items-center">
                              <div>
                                <CardTitle>مقاييس لوحة التحكم</CardTitle>
                                <CardDescription>الإحصائيات المعروضة في قسم البطل</CardDescription>
                              </div>
                              {isEditingContent && (
                                <Button onClick={addHeroMetric} size="sm" className="flex items-center space-x-2">
                                  <Plus className="w-4 h-4" />
                                  <span>إضافة مقياس</span>
                                </Button>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-4">
                              {landingPageContent.heroDashboardMetrics.map((metric, index) => (
                                <Card key={metric.id} className="p-4">
                                  <div className="flex items-center space-x-4">
                                    <GripVertical className="w-5 h-5 text-gray-400" />
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                                      <div>
                                        <Label>القيمة</Label>
              <Input
                                          value={metric.value}
                                          onChange={(e) => updateHeroMetric(metric.id, { value: e.target.value })}
                                          disabled={!isEditingContent}
              />
            </div>
                                      <div>
                                        <Label>التسمية</Label>
                                        <Input
                                          value={metric.label}
                                          onChange={(e) => updateHeroMetric(metric.id, { label: e.target.value })}
                                          disabled={!isEditingContent}
                                        />
                                      </div>
                                      <div>
                                        <Label>اللون</Label>
                                        <Select
                                          value={metric.color}
                                          onValueChange={(value) => updateHeroMetric(metric.id, { color: value })}
                                          disabled={!isEditingContent}
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                </SelectTrigger>
                <SelectContent>
                                            <SelectItem value="blue">أزرق</SelectItem>
                                            <SelectItem value="green">أخضر</SelectItem>
                                            <SelectItem value="orange">برتقالي</SelectItem>
                                            <SelectItem value="purple">بنفسجي</SelectItem>
                                            <SelectItem value="red">أحمر</SelectItem>
                                            <SelectItem value="yellow">أصفر</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
                                    {isEditingContent && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => deleteHeroMetric(metric.id)}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="w-4 h-4" />
            </Button>
                                    )}
                                  </div>
                                </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

                      {/* Features Section */}
                      <TabsContent value="features" className="space-y-6">
                        <Card>
                          <CardHeader>
                            <div className="flex justify-between items-center">
                              <div>
                                <CardTitle>قسم الميزات</CardTitle>
                                <CardDescription>إدارة ميزات المنصة</CardDescription>
                              </div>
                              {isEditingContent && (
                                <Button onClick={addFeature} size="sm" className="flex items-center space-x-2">
                                  <Plus className="w-4 h-4" />
                                  <span>إضافة ميزة</span>
            </Button>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="featuresTitle">عنوان الميزات</Label>
                                <Input
                                  id="featuresTitle"
                                  value={landingPageContent.featuresTitle}
                                  onChange={(e) => setLandingPageContent({
                                    ...landingPageContent,
                                    featuresTitle: e.target.value
                                  })}
                                  disabled={!isEditingContent}
                                />
                              </div>
                              <div>
                                <Label htmlFor="featuresDescription">وصف الميزات</Label>
                                <Textarea
                                  id="featuresDescription"
                                  value={landingPageContent.featuresDescription}
                                  onChange={(e) => setLandingPageContent({
                                    ...landingPageContent,
                                    featuresDescription: e.target.value
                                  })}
                                  disabled={!isEditingContent}
                                  rows={3}
                                />
                              </div>
      </div>

                            {/* Features List */}
                            <div className="space-y-4">
                              <h4 className="font-medium">قائمة الميزات</h4>
                              {landingPageContent.features.map((feature, index) => (
                                <Card key={feature.id} className="p-4">
                                  <div className="flex items-start space-x-4">
                                    <GripVertical className="w-5 h-5 text-gray-400 mt-1" />
                                    <div className="flex-1 space-y-3">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                          <Label>عنوان الميزة</Label>
              <Input
                                            value={feature.title}
                                            onChange={(e) => updateFeature(feature.id, { title: e.target.value })}
                                            disabled={!isEditingContent}
              />
            </div>
                                        <div>
                                          <Label>الأيقونة</Label>
                                          <Select
                                            value={feature.icon}
                                            onValueChange={(value) => updateFeature(feature.id, { icon: value })}
                                            disabled={!isEditingContent}
                                          >
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="Star">نجمة</SelectItem>
                                              <SelectItem value="Shield">درع</SelectItem>
                                              <SelectItem value="Users">مستخدمون</SelectItem>
                                              <SelectItem value="Building2">مبنى</SelectItem>
                                              <SelectItem value="BarChart3">رسم بياني</SelectItem>
                                              <SelectItem value="Zap">صاعقة</SelectItem>
                                              <SelectItem value="Target">هدف</SelectItem>
                                              <SelectItem value="Award">جائزة</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                      <div>
                                        <Label>وصف الميزة</Label>
                                        <Textarea
                                          value={feature.description}
                                          onChange={(e) => updateFeature(feature.id, { description: e.target.value })}
                                          disabled={!isEditingContent}
                                          rows={2}
                                        />
                                      </div>
                                    </div>
                                    {isEditingContent && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => deleteFeature(feature.id)}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      {/* Stats Section */}
                      <TabsContent value="stats" className="space-y-6">
                        <Card>
                          <CardHeader>
                            <div className="flex justify-between items-center">
                              <div>
                                <CardTitle>قسم الإحصائيات</CardTitle>
                                <CardDescription>إدارة الإحصائيات والأرقام</CardDescription>
                              </div>
                              {isEditingContent && (
                                <Button onClick={addStat} size="sm" className="flex items-center space-x-2">
                                  <Plus className="w-4 h-4" />
                                  <span>إضافة إحصائية</span>
                                </Button>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <Label htmlFor="statsTitle">عنوان الإحصائيات</Label>
              <Input
                                id="statsTitle"
                                value={landingPageContent.statsTitle}
                                onChange={(e) => setLandingPageContent({
                                  ...landingPageContent,
                                  statsTitle: e.target.value
                                })}
                                disabled={!isEditingContent}
              />
            </div>
                            
                            {/* Stats List */}
                            <div className="space-y-4">
                              <h4 className="font-medium">قائمة الإحصائيات</h4>
                              {landingPageContent.stats.map((stat, index) => (
                                <Card key={stat.id} className="p-4">
                                  <div className="flex items-center space-x-4">
                                    <GripVertical className="w-5 h-5 text-gray-400" />
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                                      <div>
                                        <Label>الرقم</Label>
              <Input
                                          value={stat.number}
                                          onChange={(e) => updateStat(stat.id, { number: e.target.value })}
                                          disabled={!isEditingContent}
              />
            </div>
                                      <div>
                                        <Label>التسمية</Label>
              <Input
                                          value={stat.label}
                                          onChange={(e) => updateStat(stat.id, { label: e.target.value })}
                                          disabled={!isEditingContent}
              />
            </div>
                                      <div>
                                        <Label>اللاحقة (اختياري)</Label>
              <Input
                                          value={stat.suffix || ''}
                                          onChange={(e) => updateStat(stat.id, { suffix: e.target.value })}
                                          disabled={!isEditingContent}
                                          placeholder="مثل: ﷼، +، %"
              />
            </div>
          </div>
                                    {isEditingContent && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => deleteStat(stat.id)}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      {/* Solutions Section */}
                      <TabsContent value="solutions" className="space-y-6">
                        <Card>
                          <CardHeader>
                            <div className="flex justify-between items-center">
                              <div>
                                <CardTitle>قسم الحلول</CardTitle>
                                <CardDescription>إدارة حلول المنصة</CardDescription>
                              </div>
                              {isEditingContent && (
                                <Button onClick={addSolution} size="sm" className="flex items-center space-x-2">
                                  <Plus className="w-4 h-4" />
                                  <span>إضافة حل</span>
                                </Button>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="solutionsTitle">عنوان الحلول</Label>
                                <Input
                                  id="solutionsTitle"
                                  value={landingPageContent.solutionsTitle}
                                  onChange={(e) => setLandingPageContent({
                                    ...landingPageContent,
                                    solutionsTitle: e.target.value
                                  })}
                                  disabled={!isEditingContent}
                                />
                              </div>
                              <div>
                                <Label htmlFor="solutionsDescription">وصف الحلول</Label>
                                <Textarea
                                  id="solutionsDescription"
                                  value={landingPageContent.solutionsDescription}
                                  onChange={(e) => setLandingPageContent({
                                    ...landingPageContent,
                                    solutionsDescription: e.target.value
                                  })}
                                  disabled={!isEditingContent}
                                  rows={3}
                                />
                              </div>
                            </div>
                            
                            {/* Solutions List */}
                            <div className="space-y-4">
                              <h4 className="font-medium">قائمة الحلول</h4>
                              {landingPageContent.solutions.map((solution, index) => (
                                <Card key={solution.id} className="p-4">
                                  <div className="flex items-start space-x-4">
                                    <GripVertical className="w-5 h-5 text-gray-400 mt-1" />
                                    <div className="flex-1 space-y-3">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                          <Label>عنوان الحل</Label>
                                          <Input
                                            value={solution.title}
                                            onChange={(e) => updateSolution(solution.id, { title: e.target.value })}
                                            disabled={!isEditingContent}
                                          />
                                        </div>
                                        <div>
                                          <Label>الأيقونة</Label>
                                          <Select
                                            value={solution.icon}
                                            onValueChange={(value) => updateSolution(solution.id, { icon: value })}
                                            disabled={!isEditingContent}
                                          >
                                            <SelectTrigger>
                                              <SelectValue />
                </SelectTrigger>
                <SelectContent>
                                              <SelectItem value="Target">هدف</SelectItem>
                                              <SelectItem value="Building2">مبنى</SelectItem>
                                              <SelectItem value="Users">مستخدمون</SelectItem>
                                              <SelectItem value="BarChart3">رسم بياني</SelectItem>
                                              <SelectItem value="Shield">درع</SelectItem>
                                              <SelectItem value="Zap">صاعقة</SelectItem>
                                              <SelectItem value="Star">نجمة</SelectItem>
                                              <SelectItem value="Award">جائزة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
                                      <div>
                                        <Label>وصف الحل</Label>
                                        <Textarea
                                          value={solution.description}
                                          onChange={(e) => updateSolution(solution.id, { description: e.target.value })}
                                          disabled={!isEditingContent}
                                          rows={2}
                                        />
                                      </div>
                                    </div>
                                    
                                    {/* Solution Features */}
                                    <div className="mt-4">
                                      <div className="flex justify-between items-center mb-3">
                                        <h5 className="font-medium text-sm">ميزات الحل</h5>
                                        {isEditingContent && (
                                          <Button 
                                            onClick={() => addSolutionFeature(solution.id)} 
                                            size="sm" 
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            <Plus className="w-3 h-3 mr-1" />
                                            إضافة ميزة
            </Button>
                                        )}
                                      </div>
                                      <div className="space-y-2">
                                        {solution.features.map((feature) => (
                                          <div key={feature.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                                            <GripVertical className="w-4 h-4 text-gray-400" />
                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                                              <Input
                                                value={feature.text}
                                                onChange={(e) => updateSolutionFeature(solution.id, feature.id, { text: e.target.value })}
                                                disabled={!isEditingContent}
                                                placeholder="نص الميزة"
                                                className="text-sm"
                                              />
                                              <Select
                                                value={feature.icon}
                                                onValueChange={(value) => updateSolutionFeature(solution.id, feature.id, { icon: value })}
                                                disabled={!isEditingContent}
                                              >
                                                <SelectTrigger className="text-sm">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="CheckCircle">✓</SelectItem>
                                                  <SelectItem value="Star">★</SelectItem>
                                                  <SelectItem value="Zap">⚡</SelectItem>
                                                  <SelectItem value="Shield">🛡️</SelectItem>
                                                  <SelectItem value="Target">🎯</SelectItem>
                                                  <SelectItem value="Award">🏆</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </div>
                                            {isEditingContent && (
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => deleteSolutionFeature(solution.id, feature.id)}
                                                className="text-red-600 hover:text-red-700 p-1"
                                              >
                                                <Trash2 className="w-3 h-3" />
            </Button>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    
                                    {isEditingContent && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => deleteSolution(solution.id)}
                                        className="text-red-600 hover:text-red-700 mt-4"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                        حذف الحل
                                      </Button>
                                    )}
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      {/* Pricing Section */}
                      <TabsContent value="pricing" className="space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>قسم الأسعار</CardTitle>
                            <CardDescription>محتوى قسم الأسعار</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="pricingTitle">عنوان الأسعار</Label>
              <Input
                                  id="pricingTitle"
                                  value={landingPageContent.pricingTitle}
                                  onChange={(e) => setLandingPageContent({
                                    ...landingPageContent,
                                    pricingTitle: e.target.value
                                  })}
                                  disabled={!isEditingContent}
              />
            </div>
                              <div>
                                <Label htmlFor="pricingSubtitle">العنوان الفرعي للأسعار</Label>
              <Input
                                  id="pricingSubtitle"
                                  value={landingPageContent.pricingSubtitle}
                                  onChange={(e) => setLandingPageContent({
                                    ...landingPageContent,
                                    pricingSubtitle: e.target.value
                                  })}
                                  disabled={!isEditingContent}
              />
            </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      {/* Contact Section */}
                      <TabsContent value="contact" className="space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>قسم التواصل</CardTitle>
                            <CardDescription>محتوى قسم التواصل</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="contactTitle">عنوان التواصل</Label>
              <Input
                                  id="contactTitle"
                                  value={landingPageContent.contactTitle}
                                  onChange={(e) => setLandingPageContent({
                                    ...landingPageContent,
                                    contactTitle: e.target.value
                                  })}
                                  disabled={!isEditingContent}
              />
            </div>
                              <div>
                                <Label htmlFor="contactDescription">وصف التواصل</Label>
                                <Textarea
                                  id="contactDescription"
                                  value={landingPageContent.contactDescription}
                                  onChange={(e) => setLandingPageContent({
                                    ...landingPageContent,
                                    contactDescription: e.target.value
                                  })}
                                  disabled={!isEditingContent}
                                  rows={3}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Contact Information */}
                        <Card>
                          <CardHeader>
                            <div className="flex justify-between items-center">
                              <div>
                                <CardTitle>معلومات التواصل</CardTitle>
                                <CardDescription>إدارة معلومات التواصل</CardDescription>
                              </div>
                              {isEditingContent && (
                                <Button onClick={addContactInfo} size="sm" className="flex items-center space-x-2">
                                  <Plus className="w-4 h-4" />
                                  <span>إضافة معلومات</span>
                                </Button>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-4">
                              {landingPageContent.contactInfo.map((contact, index) => (
                                <Card key={contact.id} className="p-4">
                                  <div className="flex items-center space-x-4">
                                    <GripVertical className="w-5 h-5 text-gray-400" />
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                                      <div>
                                        <Label>النوع</Label>
                                        <Select
                                          value={contact.type}
                                          onValueChange={(value) => updateContactInfo(contact.id, { type: value })}
                                          disabled={!isEditingContent}
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="phone">هاتف</SelectItem>
                                            <SelectItem value="email">بريد إلكتروني</SelectItem>
                                            <SelectItem value="address">عنوان</SelectItem>
                                            <SelectItem value="whatsapp">واتساب</SelectItem>
                                            <SelectItem value="website">موقع ويب</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <Label>التسمية</Label>
              <Input
                                          value={contact.label}
                                          onChange={(e) => updateContactInfo(contact.id, { label: e.target.value })}
                                          disabled={!isEditingContent}
              />
            </div>
                                      <div>
                                        <Label>القيمة</Label>
              <Input
                                          value={contact.value}
                                          onChange={(e) => updateContactInfo(contact.id, { value: e.target.value })}
                                          disabled={!isEditingContent}
              />
            </div>
                                      <div>
                                        <Label>الأيقونة</Label>
                                        <Select
                                          value={contact.icon}
                                          onValueChange={(value) => updateContactInfo(contact.id, { icon: value })}
                                          disabled={!isEditingContent}
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="Phone">هاتف</SelectItem>
                                            <SelectItem value="Mail">بريد</SelectItem>
                                            <SelectItem value="MapPin">موقع</SelectItem>
                                            <SelectItem value="MessageSquare">رسالة</SelectItem>
                                            <SelectItem value="Globe">موقع ويب</SelectItem>
                                          </SelectContent>
                                        </Select>
          </div>
                                    </div>
                                    {isEditingContent && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => deleteContactInfo(contact.id)}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      {/* Navigation Section */}
                      <TabsContent value="navigation" className="space-y-6">
                        <Card>
                          <CardHeader>
                            <div className="flex justify-between items-center">
                              <div>
                                <CardTitle>قائمة التنقل</CardTitle>
                                <CardDescription>إدارة روابط التنقل الرئيسية</CardDescription>
                              </div>
                              {isEditingContent && (
                                <Button onClick={addNavigation} size="sm" className="flex items-center space-x-2">
                                  <Plus className="w-4 h-4" />
                                  <span>إضافة رابط</span>
                                </Button>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-4">
                              {landingPageContent.navigation.map((nav, index) => (
                                <Card key={nav.id} className="p-4">
                                  <div className="flex items-center space-x-4">
                                    <GripVertical className="w-5 h-5 text-gray-400" />
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <div>
                                        <Label>نص الرابط</Label>
                                        <Input
                                          value={nav.text}
                                          onChange={(e) => updateNavigation(nav.id, { text: e.target.value })}
                                          disabled={!isEditingContent}
                                        />
                                      </div>
                                      <div>
                                        <Label>الرابط</Label>
                                        <Input
                                          value={nav.url}
                                          onChange={(e) => updateNavigation(nav.id, { url: e.target.value })}
                                          disabled={!isEditingContent}
                                          placeholder="#section أو /page"
                                        />
                                      </div>
                                    </div>
                                    {isEditingContent && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => deleteNavigation(nav.id)}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      {/* Footer Section */}
                      <TabsContent value="footer" className="space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>معلومات التذييل</CardTitle>
                            <CardDescription>محتوى التذييل</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="footerDescription">وصف التذييل</Label>
                                <Textarea
                                  id="footerDescription"
                                  value={landingPageContent.footerDescription}
                                  onChange={(e) => setLandingPageContent({
                                    ...landingPageContent,
                                    footerDescription: e.target.value
                                  })}
                                  disabled={!isEditingContent}
                                  rows={3}
                                />
                              </div>
                              <div>
                                <Label htmlFor="footerCopyright">حقوق النشر</Label>
                                <Input
                                  id="footerCopyright"
                                  value={landingPageContent.footerCopyright}
                                  onChange={(e) => setLandingPageContent({
                                    ...landingPageContent,
                                    footerCopyright: e.target.value
                                  })}
                                  disabled={!isEditingContent}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Footer Links */}
                        <Card>
                          <CardHeader>
                            <div className="flex justify-between items-center">
                              <div>
                                <CardTitle>روابط التذييل</CardTitle>
                                <CardDescription>إدارة روابط التذييل</CardDescription>
                              </div>
                              {isEditingContent && (
                                <Button onClick={addFooterLink} size="sm" className="flex items-center space-x-2">
                                  <Plus className="w-4 h-4" />
                                  <span>إضافة رابط</span>
                                </Button>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-4">
                              {landingPageContent.footerLinks.map((link, index) => (
                                <Card key={link.id} className="p-4">
                                  <div className="flex items-center space-x-4">
                                    <GripVertical className="w-5 h-5 text-gray-400" />
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                                      <div>
                                        <Label>نص الرابط</Label>
                                        <Input
                                          value={link.text}
                                          onChange={(e) => updateFooterLink(link.id, { text: e.target.value })}
                                          disabled={!isEditingContent}
                                        />
                                      </div>
                                      <div>
                                        <Label>الرابط</Label>
                                        <Input
                                          value={link.url}
                                          onChange={(e) => updateFooterLink(link.id, { url: e.target.value })}
                                          disabled={!isEditingContent}
                                        />
                                      </div>
                                      <div>
                                        <Label>الفئة</Label>
                                        <Input
                                          value={link.category}
                                          onChange={(e) => updateFooterLink(link.id, { category: e.target.value })}
                                          disabled={!isEditingContent}
                                          placeholder="عام، خدمات، دعم"
                                        />
                                      </div>
                                    </div>
                                    {isEditingContent && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => deleteFooterLink(link.id)}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </Tabs>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">لا يوجد محتوى</h3>
                    <p className="text-gray-500">لم يتم العثور على محتوى صفحة الهبوط</p>
                  </div>
                )}

                {isEditingContent && (
                  <div className="flex justify-end space-x-3 pt-6 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditingContent(false);
                        fetchLandingPageContent(); // Reset to original content
                      }}
                    >
              إلغاء
            </Button>
                    <Button
                      onClick={() => landingPageContent && saveLandingPageContent(landingPageContent)}
                      disabled={contentLoading}
                      className="flex items-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>حفظ التغييرات</span>
            </Button>
                  </div>
                )}
              </div>
            )}

            {activeSubPage === 'articles' && (
              <div className="text-center py-8">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">إدارة المقالات</h3>
                <p className="text-gray-500">هذه الصفحة قيد التطوير وسيتم إضافتها قريباً</p>
              </div>
            )}

            {activeSubPage === 'media-library' && (
              <div className="text-center py-8">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">مكتبة الوسائط</h3>
                <p className="text-gray-500">هذه الصفحة قيد التطوير وسيتم إضافتها قريباً</p>
              </div>
            )}

            {activeSubPage === 'seo-settings' && (
              <div className="text-center py-8">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">إعدادات SEO</h3>
                <p className="text-gray-500">هذه الصفحة قيد التطوير وسيتم إضافتها قريباً</p>
              </div>
            )}

            {activeSubPage === 'content-templates' && (
              <div className="text-center py-8">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">قوالب المحتوى</h3>
                <p className="text-gray-500">هذه الصفحة قيد التطوير وسيتم إضافتها قريباً</p>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">قيد التطوير</h3>
            <p className="text-gray-500">هذه الصفحة قيد التطوير وسيتم إضافتها قريباً</p>
    </div>
  );
}
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-800" dir="rtl">
      {/* Global fixed header across the viewport */}
      <div className="bg-white dark:bg-gray-900 shadow-md fixed inset-x-0 top-0 z-50 h-20">
        <div className="w-full px-6 sm:px-8 lg:px-12 h-full">
          <div className="flex justify-between items-center h-full">
            {/* Actions - left side */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={handleLogout}
                className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700"
                size="sm"
                aria-label="تسجيل الخروج"
              >
                <LogOut size={16} />
              </Button>
              <Button
                variant="outline"
                onClick={handleBackToSelection}
                className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700"
                size="sm"
                aria-label="العودة للمنصة"
              >
                <Navigation size={16} />
              </Button>
              <Button
                variant="outline"
                onClick={refreshData}
                disabled={loading}
                className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700"
                size="sm"
                aria-label="تحديث"
              >
                <RefreshCw size={16} className={cn(loading ? "animate-spin" : "")} />
              </Button>
              <Button
                variant="outline"
                onClick={toggleDarkMode}
                className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700"
                size="sm"
                aria-label="وضع المظهر"
              >
                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              </Button>
            </div>
            {/* Title - right side */}
            <div className="flex items-center gap-4 flex-row-reverse">
              <Shield className="w-8 h-8 text-blue-600" />
              <div className="text-right">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">لوحة التحكم المتقدمة</h1>
                <p className="text-gray-600 dark:text-gray-300">إدارة الأدوار والصلاحيات المتقدمة</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="fixed inset-x-0 top-20 bottom-0 flex flex-col md:flex-row min-h-0">
        {/* Admin Sidebar - Right Side */}
        <div className="order-last md:order-last w-full md:w-64 h-full bg-white dark:bg-gray-900 shadow-sm md:border-l border-t md:border-t-0 border-gray-200 dark:border-gray-800 flex-shrink-0 overflow-y-auto min-h-0 self-stretch flex flex-col">
          <div className="p-6">
            {/* Admin sidebar: every clickable has a deterministic id `Admin-<section>` for external mapping */}
            <nav className="space-y-1.5 pb-6">
              {adminMenuItems.map((item) => {
                const isExpanded = expandedItems.includes(item.id);
                const isActive = activeSidebarItem === item.id;
                
                return (
                  <div key={item.id} className="space-y-1">
                    {/* Main Menu Item */}
                    <button
                      id={`Admin-${item.id}`}
                      data-admin-key={`Admin-${item.id}`}
                      aria-label={item.label}
                      className={`cursor-pointer select-none w-full flex items-center px-5 py-3 rounded-lg text-right transition-colors outline-none focus-visible:ring-2 ring-slate-300 dark:ring-gray-700 ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      onClick={() => {
                        setActiveSidebarItem(item.id);
                        setActiveSubPage(item.subPages[0]?.id || '');
                        setExpandedItems(prev => (prev[0] === item.id ? [] : [item.id]));
                      }}
                    >
                      <div className="flex items-center gap-2 w-full">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        <span className="flex-1 text-right text-sm font-medium">{item.label}</span>
                        <item.icon className={`w-5 h-5 ${dir === 'rtl' ? 'ml-4' : 'mr-4'}`} />
                      </div>
                    </button>
                    
                    {/* Sub Pages */}
                    {isExpanded && item.subPages && (
                      <div className="mr-3 space-y-1">
                        {item.subPages.map((subPage) => (
                          <button
                            key={subPage.id}
                            id={`Admin-${item.id}-${subPage.id}`}
                            data-admin-key={`Admin-${item.id}-${subPage.id}`}
                            aria-label={`${item.label} - ${subPage.label}`}
                            className={`cursor-pointer select-none w-full flex items-center px-5 py-2 rounded-md text-right transition-colors text-sm outline-none focus-visible:ring-2 ring-slate-300 dark:ring-gray-700 ${
                              activeSubPage === subPage.id
                                ? 'bg-blue-100 text-blue-800 border-r-2 border-blue-600'
                                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                            }`}
                            onClick={() => {
                              setActiveSubPage(subPage.id);
                            }}
                          >
                            <span className="flex-1 text-right">{subPage.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
            </div>
            </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-y-auto min-w-0 min-h-0">
          {/* Content Area */}
          <div className="flex-1 bg-slate-50 dark:bg-gray-900/40">
            <div className="w-full px-6 sm:px-8 lg:px-12 py-10">
              <div dir="rtl" className="max-w-7xl mx-auto bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 sm:p-8 text-right">
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
