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
import { Shield, Users, Building2, UserCheck, Activity, RefreshCw, Settings, Lock, Bell, BarChart3, Database, DollarSign, MessageSquare, Share2, Mail, Smartphone, FileText, TrendingUp, PieChart, CreditCard, AlertTriangle, Save, Edit, Eye, Plus, Trash2, GripVertical, Phone, MapPin, Link, Navigation, Star, Target, Zap, Globe, Heart, Award, CheckCircle, XCircle, Moon, Sun, LogOut } from 'lucide-react';
import { AdminHeader } from '@/components/rbac/AdminHeader';
import { AdminSidebar, type SidebarItem } from '@/components/rbac/AdminSidebar';
import { useLocation } from 'wouter';
import { LandingStudio } from '@/components/cms/LandingStudio';

interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  phone?: string;
  licenseNumber?: string;
  isActive: boolean;
  roles: string[];
  organizationId: string;
  lastActiveAt: string;
  createdAt: string;
}

interface Organization {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  userCount: number;
  createdAt: string;
  status?: string;
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

interface RoleDefinition {
  name: string;
  displayName?: string;
  description?: string;
  permissions?: string[];
}

export default function RBACDashboard() {
  const { user, token, logout } = useAuth();
  const { dir } = useLanguage();
  const [, setLocation] = useLocation();
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
  const [showUserDetailsDialog, setShowUserDetailsDialog] = useState(false);
  const [showOrgDialog, setShowOrgDialog] = useState(false);
  const [roleDefinitions, setRoleDefinitions] = useState<RoleDefinition[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [userFilterStatus, setUserFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [userFilterRole, setUserFilterRole] = useState<string>('all');
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [userActionLoading, setUserActionLoading] = useState<string | null>(null); // تتبع حالة التحميل أثناء اتخاذ قرارات الموافقة على المستخدمين

  const normalizeUsersResponse = (payload: any): User[] => {
    if (!payload) return [];
    const rawUsers = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.users)
        ? payload.users
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

    return rawUsers.map((entry: any) => {
      const roles = Array.isArray(entry?.roles)
        ? entry.roles
        : typeof entry?.roles === 'string'
          ? [entry.roles]
          : [];

      const resolvedName = entry?.name || [entry?.firstName, entry?.lastName].filter(Boolean).join(' ').trim();

      return {
        id: entry?.id ?? '',
        username: entry?.username ?? '',
        email: entry?.email ?? '',
        name: resolvedName || entry?.username || '—',
        phone: entry?.phone ?? entry?.mobileNumber ?? entry?.mobile ?? entry?.contactPhone ?? '',
        licenseNumber: entry?.licenseNumber ?? entry?.agentProfile?.licenseNo ?? '',
        isActive: entry?.isActive ?? false,
        roles,
        organizationId: entry?.organization?.id ?? entry?.organizationId ?? '',
        lastActiveAt: entry?.lastLoginAt ?? entry?.lastActiveAt ?? '',
        createdAt: entry?.createdAt ?? '',
      };
    });
  };

  const normalizeOrganizationsResponse = (payload: any): Organization[] => {
    if (!payload) return [];
    const rawOrgs = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.organizations)
        ? payload.organizations
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

    return rawOrgs.map((entry: any) => {
      const status = entry?.status ?? entry?.state;
      const tradeOrLegalName = entry?.tradeName || entry?.legalName || entry?.name;

      return {
        id: entry?.id ?? '',
        name: tradeOrLegalName || '—',
        description: entry?.description ?? entry?.address ?? tradeOrLegalName ?? '',
        isActive: status ? String(status).toUpperCase() === 'ACTIVE' : entry?.isActive ?? false,
        userCount: entry?._count?.users ?? entry?.userCount ?? 0,
        createdAt: entry?.createdAt ?? '',
        status: status,
      };
    });
  };

  const authDisplayName =
    user?.name ||
    (typeof user?.username === 'string' && user.username) ||
    (typeof user?.email === 'string' ? user.email.split('@')[0] : undefined);

  
  // CMS State
  const [landingPageContent, setLandingPageContent] = useState<LandingPageContent | null>(null);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [activeContentTab, setActiveContentTab] = useState('hero');
  const [editingItem, setEditingItem] = useState<{type: string, id?: string} | null>(null);

  const adminMenuItems: SidebarItem[] = [
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
        fetch('/api/rbac-admin/users', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }),
        fetch('/api/rbac-admin/organizations', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        })
      ]);

      const usersPayload = await usersRes.json().catch(() => null);
      const orgsPayload = await orgsRes.json().catch(() => null);

      if (!usersRes.ok) {
        console.error('Failed to fetch RBAC users', usersRes.status, usersPayload);
      }
      if (!orgsRes.ok) {
        console.error('Failed to fetch RBAC organizations', orgsRes.status, orgsPayload);
      }

      const normalizedUsers = usersRes.ok ? normalizeUsersResponse(usersPayload) : [];
      const normalizedOrganizations = orgsRes.ok ? normalizeOrganizationsResponse(orgsPayload) : [];

      setUsers(normalizedUsers);
      setOrganizations(normalizedOrganizations);

      setStats({
        totalUsers: normalizedUsers.length,
        activeUsers: normalizedUsers.filter((u: User) => u.isActive).length,
        totalOrganizations: normalizedOrganizations.length,
        activeOrganizations: normalizedOrganizations.filter((o: Organization) => o.isActive).length
      });
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

  useEffect(() => {
    if (activeSidebarItem === 'user-management' && (activeSubPage === 'user-roles' || activeSubPage === 'user-permissions')) {
      if (!roleDefinitions.length && !rolesLoading) {
        fetchRolesCatalog();
      }
    }
  }, [activeSidebarItem, activeSubPage, roleDefinitions.length, rolesLoading]);

  const refreshData = () => {
    fetchData();
  };

  const handleViewUserDetails = (userRecord: User) => {
    setSelectedUser(userRecord);
    setShowUserDetailsDialog(true);
  };

  const resolveOrganizationName = (organizationId?: string) => {
    if (!organizationId) return '—';
    const org = organizations.find((entry) => entry.id === organizationId);
    return org?.name ?? `#${organizationId}`;
  };

  const fetchRolesCatalog = async () => {
    if (rolesLoading) return;
    try {
      setRolesLoading(true);
      setRolesError(null);
      const response = await fetch('/api/rbac-admin/roles', {
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('auth_token') ? { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } : {}),
        },
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        console.error('Failed to fetch RBAC roles', response.status, payload);
        setRolesError('تعذر تحميل الأدوار');
        return;
      }
      const rolesList = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.roles)
          ? payload.roles
          : [];
      setRoleDefinitions(rolesList as RoleDefinition[]);
    } catch (error) {
      console.error('Error fetching RBAC roles:', error);
      setRolesError('حدث خطأ أثناء تحميل الأدوار');
    } finally {
      setRolesLoading(false);
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const formatRelativeTime = (iso?: string) => {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    const diffMs = Date.now() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours <= 0) {
        const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
        return `منذ ${diffMinutes} دقيقة`;
      }
      return `منذ ${diffHours} ساعة`;
    }
    if (diffDays === 1) return 'منذ يوم';
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks === 1) return 'منذ أسبوع';
    if (diffWeeks < 5) return `منذ ${diffWeeks} أسابيع`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths === 1) return 'منذ شهر';
    return `منذ ${diffMonths} أشهر`;
  };

  // Analytics state for الإحصائيات العامة
  const [overviewAnalytics, setOverviewAnalytics] = useState<any | null>(null);
  const [propertyStats, setPropertyStats] = useState<any | null>(null);
  const [communicationStats, setCommunicationStats] = useState<any | null>(null);
  const [systemStats, setSystemStats] = useState<any | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const pendingUserApprovals = users.filter((candidate) => candidate && candidate.isActive === false).length;
  const pendingOrgApprovals = organizations.filter((org) => org && org.isActive === false).length;
  const pendingVerifications =
    (systemStats?.counts?.organizationsPendingVerification ?? 0) +
    (systemStats?.counts?.agentsPendingVerification ?? 0);
  const notificationBadgeCount = pendingUserApprovals + pendingOrgApprovals + pendingVerifications;
  const notificationMessage =
    notificationBadgeCount > 0
      ? `لديك ${notificationBadgeCount} إشعارات تحتاج إلى المراجعة`
      : null; // نعرض التنبيه العائم فقط عندما توجد إشعارات قيد المتابعة
  const handleNotificationNavigate = () => {
    if (pendingUserApprovals > 0) {
      setActiveSidebarItem('user-management');
      setExpandedItems(['user-management']);
      setActiveSubPage('pending-users');
      return;
    }
    if (pendingOrgApprovals > 0) {
      setActiveSidebarItem('organization-management');
      setExpandedItems(['organization-management']);
      setActiveSubPage('organizations-list');
      return;
    }
    if (pendingVerifications > 0) {
      setActiveSidebarItem('overview');
      setExpandedItems(['overview']);
      setActiveSubPage('statistics');
    }
  }; // عند النقر على التنبيه نوجه المستخدم للقسم الأكثر صلة بالتحديث

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
    setLocation('/login');
  };

  const handleBackToSelection = () => {
    setLocation('/home/platform');
  };

  // User approval handlers
  const handleApproveUser = async (userId: string) => {
    setUserActionLoading(userId); // تأكد من تعطيل الأزرار حتى تكتمل العملية
    try {
      const response = await fetch(`/api/rbac-admin/users/${userId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Refresh users list
        fetchData();
        alert('تمت الموافقة على المستخدم بنجاح');
      } else {
        alert('حدث خطأ في الموافقة على المستخدم');
      }
    } catch (error) {
      console.error('Error approving user:', error);
      alert('حدث خطأ في الموافقة على المستخدم');
    }
    setUserActionLoading(null); // إعادة تفعيل الأزرار بعد انتهاء الطلب
  };

  const handleRejectUser = async (userId: string) => {
    const reason = prompt('يرجى إدخال سبب الرفض:');
    if (!reason) return;

    setUserActionLoading(userId); // منع إرسال طلبات متعددة لنفس المستخدم أثناء الرفض
    try {
      const response = await fetch(`/api/rbac-admin/users/${userId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        // Refresh users list
        fetchData();
        alert('تم رفض المستخدم بنجاح');
      } else {
        alert('حدث خطأ في رفض المستخدم');
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
      alert('حدث خطأ في رفض المستخدم');
    }
    setUserActionLoading(null); // فك القفل بعد معالجة الرفض
  };

  const handleRequestMoreInfo = async (userId: string) => {
    const message = prompt('يرجى إدخال المعلومات المطلوبة من المستخدم:');
    if (!message) return;

    setUserActionLoading(userId); // حظر الأزرار أثناء إرسال طلب المعلومات
    try {
      const response = await fetch(`/api/rbac-admin/users/${userId}/request-info`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      });

      if (response.ok) {
        alert('تم إرسال طلب المعلومات للمستخدم');
      } else {
        alert('حدث خطأ في إرسال طلب المعلومات');
      }
    } catch (error) {
      console.error('Error requesting more info:', error);
      alert('حدث خطأ في إرسال طلب المعلومات');
    }
    setUserActionLoading(null); // إعادة الحالة الافتراضية بعد اكتمال الطلب
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
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">الإحصائيات العامة</h3>
                  <p className="text-gray-600">أداء الحسابات والمحتوى والتواصل عبر الفترات الزمنية</p>
                </div>
                <div className="flex items-center gap-2">
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
                  <div className="flex items-center space-x-4 rtl:space-x-reverse ">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                      <p className="text-sm font-medium">مستخدم جديد انضم للنظام</p>
                      <p className="text-xs text-gray-500">أحمد محمد - منذ 5 دقائق</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 rtl:space-x-reverse ">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">عقار جديد تم إضافته</p>
                      <p className="text-xs text-gray-500">فيلا في الرياض - منذ 12 دقيقة</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 rtl:space-x-reverse ">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">منظمة جديدة تم تسجيلها</p>
                      <p className="text-xs text-gray-500">شركة العقارات المتقدمة - منذ 1 ساعة</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 rtl:space-x-reverse ">
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

      case 'user-management': {
        const totalUsers = users.length;
        const activeUsersList = users.filter((candidate) => candidate?.isActive);
        const pendingUsersList = users.filter((candidate) => candidate && !candidate.isActive);
        const uniqueRoles = Array.from(new Set(users.flatMap((candidate) => candidate?.roles || []))).sort();
        const newUsersThisMonth = users.filter((candidate) => {
          if (!candidate?.createdAt) return false;
          const created = new Date(candidate.createdAt);
          if (Number.isNaN(created.getTime())) return false;
          const now = new Date();
          return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth();
        }).length;

        const statusBySubPage = activeSubPage === 'active-users'
          ? 'active'
          : activeSubPage === 'pending-users'
            ? 'inactive'
            : userFilterStatus;

        const effectiveRoleFilter = userFilterRole;
        const searchQuery = userSearchQuery.trim().toLowerCase();

        const filteredUsers = users
          .filter((candidate) => {
            if (!candidate) return false;
            if (statusBySubPage === 'active' && !candidate.isActive) return false;
            if (statusBySubPage === 'inactive' && candidate.isActive) return false;
            if (effectiveRoleFilter !== 'all' && !(candidate.roles || []).includes(effectiveRoleFilter)) {
              return false;
            }
            if (searchQuery) {
              const haystack = [candidate.name, candidate.username, candidate.phone, candidate.licenseNumber]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
              if (!haystack.includes(searchQuery)) return false;
            }
            return true;
          })
          .sort((a, b) => {
            const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
            return bTime - aTime;
          });

        const computedRoles = Array.from(new Set([
          ...uniqueRoles,
          ...roleDefinitions.map((role) => role.name),
        ])).sort();

        const rolesData = computedRoles.map((roleName) => {
          const roleDef = roleDefinitions.find((role) => role.name === roleName);
          const assignedUsers = users.filter((candidate) => (candidate.roles || []).includes(roleName));
          return {
            name: roleName,
            displayName: roleDef?.displayName || roleName,
            description: roleDef?.description || 'لم يتم توفير وصف لهذا الدور بعد.',
            permissions: roleDef?.permissions || [],
            assignedUsers,
            assignedCount: assignedUsers.length,
          };
        }).sort((a, b) => b.assignedCount - a.assignedCount);

        const permissionMap = new Map<string, { roles: string[]; assignedUsers: number }>();
        rolesData.forEach((role) => {
          role.permissions.forEach((permission) => {
            if (!permissionMap.has(permission)) {
              permissionMap.set(permission, { roles: [], assignedUsers: 0 });
            }
            const entry = permissionMap.get(permission)!;
            if (!entry.roles.includes(role.displayName)) {
              entry.roles.push(role.displayName);
            }
            entry.assignedUsers += role.assignedCount;
          });
        });

        const permissionEntries = Array.from(permissionMap.entries())
          .sort((a, b) => b[1].assignedUsers - a[1].assignedUsers);

        const usersViewTitle = activeSubPage === 'active-users'
          ? 'المستخدمون النشطون'
          : activeSubPage === 'pending-users'
            ? 'المستخدمون المعلقون'
            : 'جميع المستخدمين';

        const usersViewSubtitle = activeSubPage === 'active-users'
          ? 'عرض جميع المستخدمين الذين تم تفعيلهم ويمكنهم الوصول للنظام'
          : activeSubPage === 'pending-users'
            ? 'طلبات الانضمام التي تحتاج إلى موافقة أو متابعة'
            : 'قائمة شاملة بجميع حسابات المستخدمين داخل النظام';

        if (activeSubPage === 'user-roles') {
          if (rolesLoading && !rolesData.length) {
            return (
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-3 text-gray-500">
                  <div className="h-10 w-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">جار تحميل الأدوار...</span>
                </div>
              </div>
            );
          }

          return (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold">أدوار المستخدمين</h3>
                  <p className="text-sm text-gray-500">نظرة عامة على الأدوار المتاحة وعدد المستخدمين المرتبطين بكل دور</p>
                </div>
                <Badge variant="outline" className="text-blue-600 border-blue-200">
                  {computedRoles.length} دور معرف
                </Badge>
              </div>

              {rolesError && (
                <Alert variant="destructive">
                  <AlertDescription>{rolesError}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {rolesData.length > 0 ? rolesData.map((role) => (
                  <Card key={role.name} className="h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-lg">
                        <span>{role.displayName}</span>
                        <Badge variant="secondary" className="text-xs">
                          {role.assignedCount} مستخدم
                        </Badge>
                      </CardTitle>
                      <CardDescription>{role.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">الصلاحيات المرتبطة</p>
                          {role.permissions.length ? (
                            <div className="flex flex-wrap gap-2">
                              {role.permissions.map((permission) => (
                                <Badge key={permission} variant="outline" className="bg-slate-50 text-xs">
                                  {permission}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400">لا توجد صلاحيات محددة لهذا الدور.</p>
                          )}
                        </div>
                        <div className="border-t pt-3">
                          <p className="text-xs text-gray-500 mb-1">أحدث المستخدمين المرتبطين</p>
                          {role.assignedUsers.slice(0, 3).map((candidate) => (
                            <div key={candidate.id} className="flex items-center justify-between text-sm text-gray-600">
                              <span>{candidate.name || candidate.username}</span>
                              <span>{formatDate(candidate.createdAt)}</span>
                            </div>
                          ))}
                          {role.assignedCount > 3 && (
                            <p className="text-xs text-gray-400 mt-1">و{role.assignedCount - 3} مستخدمين آخرين</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )) : (
                  <Card className="col-span-full">
                    <CardContent className="py-10 text-center text-gray-500">
                      لم يتم تعريف أدوار حتى الآن.
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          );
        }

        if (activeSubPage === 'user-permissions') {
          if (rolesLoading && !permissionEntries.length) {
            return (
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-3 text-gray-500">
                  <div className="h-10 w-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">جار تحميل الصلاحيات...</span>
                </div>
              </div>
            );
          }

          return (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold">صلاحيات المستخدمين</h3>
                  <p className="text-sm text-gray-500">توزيع الصلاحيات على الأدوار وعدد المستخدمين الذين يمتلكون كل صلاحية</p>
                </div>
                <Badge variant="outline" className="text-indigo-600 border-indigo-200">
                  {permissionEntries.length} صلاحية
                </Badge>
              </div>

              {rolesError && (
                <Alert variant="destructive">
                  <AlertDescription>{rolesError}</AlertDescription>
                </Alert>
              )}

              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-right text-sm">
                      <thead className="bg-slate-100 text-gray-600">
                        <tr>
                          <th className="py-3 px-4 font-medium">الصلاحية</th>
                          <th className="py-3 px-4 font-medium">الأدوار المرتبطة</th>
                          <th className="py-3 px-4 font-medium">عدد المستخدمين</th>
                        </tr>
                      </thead>
                      <tbody>
                        {permissionEntries.length ? permissionEntries.map(([permission, info]) => (
                          <tr key={permission} className="border-b last:border-0">
                            <td className="py-3 px-4 text-gray-700">{permission}</td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-2 justify-end">
                                {info.roles.map((roleName) => (
                                  <Badge key={`${permission}-${roleName}`} variant="outline" className="bg-white text-xs">
                                    {roleName}
                                  </Badge>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-600">{info.assignedUsers}</td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={3} className="py-8 text-center text-gray-500">
                              لا توجد صلاحيات مسجلة حتى الآن.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold">{usersViewTitle}</h3>
                <p className="text-sm text-gray-500">{usersViewSubtitle}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-blue-600 border-blue-200">
                  {filteredUsers.length} مستخدم
                </Badge>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowUserDialog(true)}>
                  إضافة مستخدم جديد
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">إجمالي المستخدمين</p>
                      <p className="text-2xl font-bold">{totalUsers.toLocaleString()}</p>
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
                      <p className="text-2xl font-bold text-green-600">{activeUsersList.length.toLocaleString()}</p>
                    </div>
                    <UserCheck className="w-6 h-6 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">الحسابات المعلقة</p>
                      <p className="text-2xl font-bold text-orange-600">{pendingUsersList.length.toLocaleString()}</p>
                    </div>
                    <Activity className="w-6 h-6 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">مستخدمون جدد (هذا الشهر)</p>
                      <p className="text-2xl font-bold text-purple-600">{newUsersThisMonth.toLocaleString()}</p>
                    </div>
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>فلترة المستخدمين</CardTitle>
                <CardDescription>حدد المعايير لعرض المستخدمين المطلوبين</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Select
                    value={statusBySubPage}
                    onValueChange={(value) => setUserFilterStatus(value as 'all' | 'active' | 'inactive')}
                  >
                    <SelectTrigger className="w-48" disabled={activeSubPage !== 'all-users'}>
                      <SelectValue placeholder="اختر الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع المستخدمين</SelectItem>
                      <SelectItem value="active">النشطون فقط</SelectItem>
                      <SelectItem value="inactive">غير النشطون</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={effectiveRoleFilter}
                    onValueChange={(value) => setUserFilterRole(value)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="اختر الدور" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الأدوار</SelectItem>
                      {computedRoles.map((roleName) => (
                        <SelectItem key={roleName} value={roleName}>
                          {roleDefinitions.find((role) => role.name === roleName)?.displayName || roleName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    value={userSearchQuery}
                    onChange={(event) => setUserSearchQuery(event.target.value)}
                    placeholder="البحث بالاسم، اسم المستخدم، أو رقم الرخصة"
                    className="w-64"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>قائمة المستخدمين</CardTitle>
                <CardDescription>آخر تحديث {new Date().toLocaleTimeString('ar-SA')}</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredUsers.length ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-[960px] w-full text-right border-separate border-spacing-y-2 caption-top text-xs">
                      <caption className="pb-1 text-[11px] text-slate-500">
                        يعرض الجدول أحدث حسابات المستخدمين مع حالة الموافقة والإجراءات المتاحة
                      </caption>
                      <thead className="text-[11px] uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="bg-slate-50 px-3 py-2 rounded-s-2xl">الاسم</th>
                          <th className="bg-slate-50 px-3 py-2">اسم المستخدم</th>
                          <th className="bg-slate-50 px-3 py-2">رقم الجوال</th>
                          <th className="bg-slate-50 px-3 py-2">رقم رخصة فال</th>
                          <th className="bg-slate-50 px-3 py-2">تاريخ التسجيل</th>
                          <th className="bg-slate-50 px-3 py-2">آخر نشاط</th>
                          <th className="bg-slate-50 px-3 py-2">المنظمة</th>
                          <th className="bg-slate-50 px-3 py-2">الحالة</th>
                          <th className="bg-slate-50 px-3 py-2 rounded-e-2xl">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs text-slate-600">
                        {filteredUsers.map((candidate) => (
                          <tr key={candidate.id} className="bg-white shadow-sm rounded-2xl">
                            <td className="px-3 py-3 align-top rounded-s-2xl">
                              <div className="space-y-1.5">
                                <p className="font-medium text-slate-900 text-sm">{candidate.name || 'غير محدد'}</p>
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {(candidate.roles || []).map((roleName) => (
                                    <Badge key={`${candidate.id}-${roleName}`} variant="outline" className="bg-slate-50 text-[10px] px-2 py-0.5">
                                      {roleDefinitions.find((role) => role.name === roleName)?.displayName || roleName}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3 align-top">
                              <p className="font-medium text-slate-800">@{candidate.username}</p>
                            </td>
                            <td className="px-3 py-3 align-top">
                              <p className="font-medium text-slate-800">{candidate.phone || '—'}</p>
                            </td>
                            <td className="px-3 py-3 align-top">
                              <p className="font-medium text-slate-800">{candidate.licenseNumber || '—'}</p>
                            </td>
                            <td className="px-3 py-3 align-top">
                              <div className="space-y-1">
                                <p className="font-medium text-slate-800">{formatDate(candidate.createdAt)}</p>
                                <p className="text-[11px] text-slate-400">{formatRelativeTime(candidate.createdAt)}</p>
                              </div>
                            </td>
                            <td className="px-3 py-3 align-top">
                              <p className="font-medium text-slate-800">
                                {formatRelativeTime(candidate.lastActiveAt) || '—'}
                              </p>
                            </td>
                            <td className="px-3 py-3 align-top">
                              <p className="font-medium text-slate-800">{candidate.organizationId ? `#${candidate.organizationId}` : '—'}</p>
                            </td>
                            <td className="px-3 py-3 align-top">
                              <Badge variant={candidate.isActive ? 'default' : 'secondary'} className="px-2.5 py-0.5 text-[11px]">
                                {candidate.isActive ? 'نشط' : 'معلق'}
                              </Badge>
                            </td>
                            <td className="px-3 py-3 align-top rounded-e-2xl">
                              <div className="flex flex-wrap justify-end gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-3 text-xs"
                                  onClick={() => handleViewUserDetails(candidate)}
                                >
                                  تفاصيل
                                </Button>
                                {/* تبديل الأزرار بناءً على حالة المستخدم لإظهار خيارات الموافقة عند الحاجة */}
                                {candidate.isActive ? (
                                  <Button variant="outline" size="sm" className="h-7 px-3 text-xs text-red-600 hover:text-red-700">إيقاف</Button>
                                ) : (
                                  <>
                                    <Button
                                      size="sm"
                                      className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700 text-white"
                                      disabled={!candidate.id || userActionLoading === candidate.id}
                                      onClick={() => handleApproveUser(candidate.id)}
                                    >
                                      {userActionLoading === candidate.id ? 'جاري الموافقة...' : 'موافقة'}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 px-3 text-xs text-red-600 hover:text-red-700"
                                      disabled={!candidate.id || userActionLoading === candidate.id}
                                      onClick={() => handleRejectUser(candidate.id)}
                                    >
                                      {userActionLoading === candidate.id ? 'قيد المعالجة...' : 'رفض'}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 px-3 text-xs"
                                      disabled={!candidate.id || userActionLoading === candidate.id}
                                      onClick={() => handleRequestMoreInfo(candidate.id)}
                                    >
                                      {userActionLoading === candidate.id ? 'بانتظار الإنهاء...' : 'طلب معلومات'}
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-12 text-center text-gray-500">
                    لا توجد نتائج مطابقة للمعايير المحددة.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
      }

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
                      <div className="flex items-center space-x-4 rtl:space-x-reverse ">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">{org.name}</p>
                          <p className="text-sm text-gray-500">{org.description}</p>
                          <p className="text-xs text-gray-400">{org.userCount} مستخدم</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 rtl:space-x-reverse ">
                            <Badge variant={org.isActive ? "default" : "secondary"}>
                          {org.isActive ? "نشط" : "غير نشط"}
                            </Badge>
                        <div className="flex space-x-2 rtl:space-x-reverse ">
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
                  <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse ">
                    <Shield className="w-5 h-5 text-red-600" />
                    <span>مدير النظام</span>
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="text-sm text-gray-600 mb-4">صلاحيات كاملة على النظام</p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse ">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs">إدارة المستخدمين</span>
                        </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse ">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs">إدارة المنظمات</span>
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse ">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs">إعدادات النظام</span>
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-2 rtl:space-x-reverse ">
                    <Button variant="outline" size="sm">تعديل</Button>
                    <Button variant="outline" size="sm">المستخدمون</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                  <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse ">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span>مدير المنظمة</span>
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="text-sm text-gray-600 mb-4">إدارة منظمة واحدة</p>
                        <div className="space-y-2">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse ">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs">إدارة وكلاء المنظمة</span>
                        </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse ">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs">عرض التقارير</span>
                          </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse ">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-xs">صلاحيات محدودة</span>
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-2 rtl:space-x-reverse ">
                    <Button variant="outline" size="sm">تعديل</Button>
                    <Button variant="outline" size="sm">المستخدمون</Button>
                        </div>
                      </CardContent>
                    </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse ">
                    <UserCheck className="w-5 h-5 text-green-600" />
                    <span>وكيل عقاري</span>
                  </CardTitle>
                      </CardHeader>
                      <CardContent>
                  <p className="text-sm text-gray-600 mb-4">إدارة العقارات والعمليات</p>
                        <div className="space-y-2">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse ">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs">إدارة العقارات</span>
                              </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse ">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs">إدارة العملاء</span>
                          </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse ">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-xs">عرض التقارير الأساسية</span>
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-2 rtl:space-x-reverse ">
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
                  <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse ">
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
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">الخطة الأساسية</p>
                        <p className="text-sm text-gray-600">للأفراد والمستقلين</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">$29/شهر</p>
                        <p className="text-sm text-green-600">456 مشترك</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">الخطة المهنية</p>
                        <p className="text-sm text-gray-600">للشركات الصغيرة</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">$79/شهر</p>
                        <p className="text-sm text-green-600">234 مشترك</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-3 w-3 rounded-full bg-blue-500"></span>
                        <span>الأفراد</span>
                      </div>
                      <span className="font-semibold">$18,300 (40%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-3 w-3 rounded-full bg-green-500"></span>
                        <span>الشركات الصغيرة</span>
                      </div>
                      <span className="font-semibold">$12,750 (28%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-3 w-3 rounded-full bg-purple-500"></span>
                        <span>الشركات الكبرى</span>
                      </div>
                      <span className="font-semibold">$14,180 (32%)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>اتجاهات الاشتراك (آخر 30 يوم)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-60 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center space-y-2">
                      <TrendingUp className="w-12 h-12 text-gray-400 mx-auto" />
                      <p className="text-gray-600">سيتم إضافة الرسوم البيانية قريباً</p>
                      <p className="text-sm text-gray-500">متوسط النمو اليومي 3.2%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>MRR مقابل الهدف</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">MRR الحالي</p>
                      <p className="text-2xl font-bold text-gray-900">$45.2K</p>
                    </div>
                    <BarChart3 className="w-10 h-10 text-indigo-500" />
                  </div>
                  <div className="rounded-lg border border-dashed border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-700">
                    نحن نحقق 92% من هدف الربع الحالي. مطلوب $3.8K إضافية للوصول إلى الهدف الكامل.
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <p className="font-semibold text-gray-900">$12.4K</p>
                      <p>ترقيات الشهر</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">$1.1K</p>
                      <p>خصومات ممنوحة</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>تحليل تسرب المشتركين</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-rose-50 rounded-lg">
                    <div>
                      <p className="text-sm text-rose-600">معدل التسرب الشهري</p>
                      <p className="text-2xl font-bold text-rose-600">2.8%</p>
                    </div>
                    <Activity className="w-10 h-10 text-rose-500" />
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center justify-between">
                      <span>عدم الاستخدام</span>
                      <span className="font-medium">46%</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>قيود الميزانية</span>
                      <span className="font-medium">32%</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>الانتقال للمنافسين</span>
                      <span className="font-medium">22%</span>
                    </li>
                  </ul>
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

      case 'invoicing':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">المشتركون اليوم</p>
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

      case 'content-management':
        return (
          <LandingStudio />
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
    <>
      <Dialog open={showUserDetailsDialog} onOpenChange={setShowUserDetailsDialog}>
        <DialogContent className="sm:max-w-xl text-right">
          <DialogHeader>
            <DialogTitle>تفاصيل المتقدم</DialogTitle>
            <DialogDescription>
              نظرة شاملة على بيانات صاحب الطلب لتسهيل قرار الاعتماد أو التواصل.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-500">الاسم الكامل</span>
                <span className="text-slate-900">{selectedUser?.name || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-500">اسم المستخدم</span>
                <span className="text-slate-900">@{selectedUser?.username || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-500">البريد الإلكتروني</span>
                <span className="text-slate-900">{selectedUser?.email || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-500">رقم التواصل</span>
                <span className="text-slate-900">{selectedUser?.phone || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-500">الرقم المهني</span>
                <span className="text-slate-900">{selectedUser?.licenseNumber || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-500">المنظمة</span>
                <span className="text-slate-900">{resolveOrganizationName(selectedUser?.organizationId)}</span>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-500 mb-2">الأدوار الحالية</p>
              <div className="flex flex-wrap gap-2 justify-end">
                {(selectedUser?.roles || []).length > 0 ? (
                  selectedUser?.roles.map((role) => (
                    <Badge key={role} variant="outline" className="bg-white text-xs">
                      {role}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">لم يتم تعيين أدوار بعد</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 text-xs text-slate-500">
              <div className="flex items-center justify-between">
                <span>تاريخ التسجيل</span>
                <span className="text-slate-900 text-sm">{formatDate(selectedUser?.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>آخر نشاط</span>
                <span className="text-slate-900 text-sm">
                  {selectedUser?.lastActiveAt ? formatRelativeTime(selectedUser.lastActiveAt) : '—'}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            <Button variant="outline" onClick={() => setShowUserDetailsDialog(false)}>
              إغلاق
            </Button>
            <Button onClick={() => {
              if (selectedUser?.email) {
                window.location.href = `mailto:${selectedUser.email}`;
              } else {
                setShowUserDetailsDialog(false);
              }
            }}>
              مراسلة عبر البريد الإلكتروني
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="h-screen bg-gray-50">
      <AdminHeader
        title="لوحة التحكم المتقدمة"
        subtitle="إدارة الأدوار والصلاحيات المتقدمة"
        icon={Shield}
        onLogout={handleLogout}
        onBack={handleBackToSelection}
        onRefresh={refreshData}
        loading={loading}
        userName={authDisplayName}
        notificationCount={notificationBadgeCount}
        notificationMessage={notificationMessage} // تمرير الرسالة لعرض تنبيه عائم فوق أيقونة الإشعارات
        onNotificationAction={handleNotificationNavigate}
      />
      <div className="fixed inset-x-0 top-20 bottom-0 flex flex-col md:flex-row min-h-0">
        <AdminSidebar
          dir={dir === 'rtl' ? 'rtl' : 'ltr'}
          items={adminMenuItems}
          activeItem={activeSidebarItem}
          expandedItems={expandedItems}
          onToggleItem={(id) => {
            setActiveSidebarItem(id);
            setExpandedItems((prev) => (prev[0] === id ? [] : [id]));
          }}
          activeSubPage={activeSubPage}
          onSelectSubPage={(id) => setActiveSubPage(id)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-y-auto min-w-0 min-h-0">
          {/* Content Area */}
          <div className="flex-1 bg-slate-50">
            <div className="w-full px-6 sm:px-8 lg:px-12 py-10">
              <div className="max-w-10xl mx-auto bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8 text-right">
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
