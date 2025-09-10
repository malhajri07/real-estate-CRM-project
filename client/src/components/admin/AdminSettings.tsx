import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Users, 
  Building2, 
  MessageSquare, 
  Phone, 
  Mail, 
  Globe, 
  Shield,
  BarChart3,
  Bell,
  Save,
  RefreshCw
} from 'lucide-react';
import { useAuth, UserRole } from '@/components/auth/AuthProvider';

interface AdminSettings {
  // Platform Features
  platformFeatures: {
    socialMediaIntegration: boolean;
    whatsappIntegration: boolean;
    smsIntegration: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
    analyticsEnabled: boolean;
    auditLogging: boolean;
  };
  
  // Corporate Limits
  corporateLimits: {
    maxAgentsPerCorp: number;
    maxPropertiesPerAgent: number;
    maxListingsPerAgent: number;
  };
  
  // Contact Limits
  contactLimits: {
    maxBuyersPerAgent: number;
    maxSellersPerAgent: number;
    maxDailyContacts: number;
    maxWeeklyContacts: number;
  };
  
  // Social Media Settings
  socialMedia: {
    facebookEnabled: boolean;
    twitterEnabled: boolean;
    instagramEnabled: boolean;
    linkedinEnabled: boolean;
    tiktokEnabled: boolean;
  };
  
  // Communication Settings
  communication: {
    whatsappBusinessEnabled: boolean;
    smsProvider: string;
    emailProvider: string;
    autoResponseEnabled: boolean;
    businessHoursOnly: boolean;
  };
  
  // System Settings
  systemSettings: {
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    emailVerificationRequired: boolean;
    phoneVerificationRequired: boolean;
    twoFactorRequired: boolean;
  };
}

const defaultSettings: AdminSettings = {
  platformFeatures: {
    socialMediaIntegration: true,
    whatsappIntegration: true,
    smsIntegration: true,
    emailNotifications: true,
    pushNotifications: true,
    analyticsEnabled: true,
    auditLogging: true,
  },
  corporateLimits: {
    maxAgentsPerCorp: 50,
    maxPropertiesPerAgent: 100,
    maxListingsPerAgent: 200,
  },
  contactLimits: {
    maxBuyersPerAgent: 30,
    maxSellersPerAgent: 20,
    maxDailyContacts: 50,
    maxWeeklyContacts: 200,
  },
  socialMedia: {
    facebookEnabled: true,
    twitterEnabled: true,
    instagramEnabled: true,
    linkedinEnabled: true,
    tiktokEnabled: false,
  },
  communication: {
    whatsappBusinessEnabled: true,
    smsProvider: 'twilio',
    emailProvider: 'sendgrid',
    autoResponseEnabled: true,
    businessHoursOnly: false,
  },
  systemSettings: {
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerificationRequired: true,
    phoneVerificationRequired: true,
    twoFactorRequired: false,
  },
};

export default function AdminSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AdminSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${String(displayHours).padStart(2, '0')}:${minutes} ${ampm}`;
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // In a real app, this would fetch from the API
      setSettings(defaultSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would save to the API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setHasChanges(false);
      console.log('Settings saved:', settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = (path: string, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      const keys = path.split('.');
      let current: any = newSettings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      setHasChanges(true);
      return newSettings;
    });
  };

  if (!user || !user.roles.includes('WEBSITE_ADMIN' as UserRole)) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">غير مصرح لك بالوصول إلى إعدادات الإدارة</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">إعدادات الإدارة</h2>
          <p className="text-gray-600">إدارة إعدادات المنصة والميزات</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadSettings}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            تحديث
          </Button>
          <Button
            onClick={saveSettings}
            disabled={!hasChanges || isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="features" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            الميزات
          </TabsTrigger>
          <TabsTrigger value="limits" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            الحدود
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            وسائل التواصل
          </TabsTrigger>
          <TabsTrigger value="communication" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            التواصل
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            النظام
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            التحليلات
          </TabsTrigger>
        </TabsList>

        {/* Platform Features Tab */}
        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                ميزات المنصة
              </CardTitle>
              <CardDescription>
                تفعيل أو إلغاء تفعيل الميزات الرئيسية للمنصة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-blue-500" />
                    <div>
                      <Label className="text-sm font-medium">تكامل وسائل التواصل الاجتماعي</Label>
                      <p className="text-xs text-gray-500">تفعيل مشاركة العقارات على وسائل التواصل</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.platformFeatures.socialMediaIntegration}
                    onCheckedChange={(checked) => 
                      updateSetting('platformFeatures.socialMediaIntegration', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-green-500" />
                    <div>
                      <Label className="text-sm font-medium">تكامل واتساب</Label>
                      <p className="text-xs text-gray-500">إرسال رسائل واتساب للعملاء</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.platformFeatures.whatsappIntegration}
                    onCheckedChange={(checked) => 
                      updateSetting('platformFeatures.whatsappIntegration', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-purple-500" />
                    <div>
                      <Label className="text-sm font-medium">رسائل SMS</Label>
                      <p className="text-xs text-gray-500">إرسال رسائل نصية للعملاء</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.platformFeatures.smsIntegration}
                    onCheckedChange={(checked) => 
                      updateSetting('platformFeatures.smsIntegration', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-orange-500" />
                    <div>
                      <Label className="text-sm font-medium">إشعارات البريد الإلكتروني</Label>
                      <p className="text-xs text-gray-500">إرسال إشعارات عبر البريد الإلكتروني</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.platformFeatures.emailNotifications}
                    onCheckedChange={(checked) => 
                      updateSetting('platformFeatures.emailNotifications', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-red-500" />
                    <div>
                      <Label className="text-sm font-medium">الإشعارات الفورية</Label>
                      <p className="text-xs text-gray-500">إشعارات فورية في المتصفح</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.platformFeatures.pushNotifications}
                    onCheckedChange={(checked) => 
                      updateSetting('platformFeatures.pushNotifications', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-indigo-500" />
                    <div>
                      <Label className="text-sm font-medium">التحليلات والإحصائيات</Label>
                      <p className="text-xs text-gray-500">تتبع الأداء والإحصائيات</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.platformFeatures.analyticsEnabled}
                    onCheckedChange={(checked) => 
                      updateSetting('platformFeatures.analyticsEnabled', checked)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Limits Tab */}
        <TabsContent value="limits" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Corporate Limits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  حدود الشركات
                </CardTitle>
                <CardDescription>
                  تحديد الحد الأقصى للوكلاء والممتلكات لكل شركة
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="maxAgents">الحد الأقصى للوكلاء لكل شركة</Label>
                  <Input
                    id="maxAgents"
                    type="number"
                    value={settings.corporateLimits.maxAgentsPerCorp}
                    onChange={(e) => 
                      updateSetting('corporateLimits.maxAgentsPerCorp', parseInt(e.target.value))
                    }
                    min="1"
                    max="1000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxProperties">الحد الأقصى للممتلكات لكل وكيل</Label>
                  <Input
                    id="maxProperties"
                    type="number"
                    value={settings.corporateLimits.maxPropertiesPerAgent}
                    onChange={(e) => 
                      updateSetting('corporateLimits.maxPropertiesPerAgent', parseInt(e.target.value))
                    }
                    min="1"
                    max="1000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxListings">الحد الأقصى للإعلانات لكل وكيل</Label>
                  <Input
                    id="maxListings"
                    type="number"
                    value={settings.corporateLimits.maxListingsPerAgent}
                    onChange={(e) => 
                      updateSetting('corporateLimits.maxListingsPerAgent', parseInt(e.target.value))
                    }
                    min="1"
                    max="1000"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact Limits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  حدود التواصل
                </CardTitle>
                <CardDescription>
                  تحديد الحد الأقصى للتواصل مع العملاء
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="maxBuyers">الحد الأقصى للمشترين لكل وكيل</Label>
                  <Input
                    id="maxBuyers"
                    type="number"
                    value={settings.contactLimits.maxBuyersPerAgent}
                    onChange={(e) => 
                      updateSetting('contactLimits.maxBuyersPerAgent', parseInt(e.target.value))
                    }
                    min="1"
                    max="1000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxSellers">الحد الأقصى للبائعين لكل وكيل</Label>
                  <Input
                    id="maxSellers"
                    type="number"
                    value={settings.contactLimits.maxSellersPerAgent}
                    onChange={(e) => 
                      updateSetting('contactLimits.maxSellersPerAgent', parseInt(e.target.value))
                    }
                    min="1"
                    max="1000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxDailyContacts">الحد الأقصى للتواصل اليومي</Label>
                  <Input
                    id="maxDailyContacts"
                    type="number"
                    value={settings.contactLimits.maxDailyContacts}
                    onChange={(e) => 
                      updateSetting('contactLimits.maxDailyContacts', parseInt(e.target.value))
                    }
                    min="1"
                    max="1000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxWeeklyContacts">الحد الأقصى للتواصل الأسبوعي</Label>
                  <Input
                    id="maxWeeklyContacts"
                    type="number"
                    value={settings.contactLimits.maxWeeklyContacts}
                    onChange={(e) => 
                      updateSetting('contactLimits.maxWeeklyContacts', parseInt(e.target.value))
                    }
                    min="1"
                    max="1000"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Social Media Tab */}
        <TabsContent value="social" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                وسائل التواصل الاجتماعي
              </CardTitle>
              <CardDescription>
                تفعيل أو إلغاء تفعيل منصات وسائل التواصل الاجتماعي
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { key: 'facebookEnabled', name: 'فيسبوك', color: 'text-blue-600', icon: '📘' },
                  { key: 'twitterEnabled', name: 'تويتر', color: 'text-blue-400', icon: '🐦' },
                  { key: 'instagramEnabled', name: 'إنستغرام', color: 'text-pink-500', icon: '📷' },
                  { key: 'linkedinEnabled', name: 'لينكد إن', color: 'text-blue-700', icon: '💼' },
                  { key: 'tiktokEnabled', name: 'تيك توك', color: 'text-black', icon: '🎵' },
                ].map((platform) => (
                  <div key={platform.key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{platform.icon}</span>
                      <div>
                        <Label className="text-sm font-medium">{platform.name}</Label>
                        <p className="text-xs text-gray-500">مشاركة العقارات</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.socialMedia[platform.key as keyof typeof settings.socialMedia]}
                      onCheckedChange={(checked) => 
                        updateSetting(`socialMedia.${platform.key}`, checked)
                      }
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Communication Tab */}
        <TabsContent value="communication" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  إعدادات التواصل
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">واتساب للأعمال</Label>
                    <p className="text-xs text-gray-500">تفعيل واتساب للأعمال</p>
                  </div>
                  <Switch
                    checked={settings.communication.whatsappBusinessEnabled}
                    onCheckedChange={(checked) => 
                      updateSetting('communication.whatsappBusinessEnabled', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">الرد التلقائي</Label>
                    <p className="text-xs text-gray-500">إرسال ردود تلقائية</p>
                  </div>
                  <Switch
                    checked={settings.communication.autoResponseEnabled}
                    onCheckedChange={(checked) => 
                      updateSetting('communication.autoResponseEnabled', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">ساعات العمل فقط</Label>
                    <p className="text-xs text-gray-500">التواصل خلال ساعات العمل</p>
                  </div>
                  <Switch
                    checked={settings.communication.businessHoursOnly}
                    onCheckedChange={(checked) => 
                      updateSetting('communication.businessHoursOnly', checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  مزودي الخدمة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="smsProvider">مزود خدمة SMS</Label>
                  <select
                    id="smsProvider"
                    value={settings.communication.smsProvider}
                    onChange={(e) => 
                      updateSetting('communication.smsProvider', e.target.value)
                    }
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="twilio">Twilio</option>
                    <option value="aws-sns">AWS SNS</option>
                    <option value="nexmo">Nexmo</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailProvider">مزود خدمة البريد الإلكتروني</Label>
                  <select
                    id="emailProvider"
                    value={settings.communication.emailProvider}
                    onChange={(e) => 
                      updateSetting('communication.emailProvider', e.target.value)
                    }
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="sendgrid">SendGrid</option>
                    <option value="aws-ses">AWS SES</option>
                    <option value="mailgun">Mailgun</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                إعدادات النظام
              </CardTitle>
              <CardDescription>
                إعدادات الأمان والنظام العامة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">وضع الصيانة</Label>
                    <p className="text-xs text-gray-500">إيقاف المنصة مؤقتاً للصيانة</p>
                  </div>
                  <Switch
                    checked={settings.systemSettings.maintenanceMode}
                    onCheckedChange={(checked) => 
                      updateSetting('systemSettings.maintenanceMode', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">تفعيل التسجيل</Label>
                    <p className="text-xs text-gray-500">السماح للمستخدمين الجدد بالتسجيل</p>
                  </div>
                  <Switch
                    checked={settings.systemSettings.registrationEnabled}
                    onCheckedChange={(checked) => 
                      updateSetting('systemSettings.registrationEnabled', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">التحقق من البريد الإلكتروني</Label>
                    <p className="text-xs text-gray-500">مطلوب للتفعيل</p>
                  </div>
                  <Switch
                    checked={settings.systemSettings.emailVerificationRequired}
                    onCheckedChange={(checked) => 
                      updateSetting('systemSettings.emailVerificationRequired', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">التحقق من الهاتف</Label>
                    <p className="text-xs text-gray-500">مطلوب للتفعيل</p>
                  </div>
                  <Switch
                    checked={settings.systemSettings.phoneVerificationRequired}
                    onCheckedChange={(checked) => 
                      updateSetting('systemSettings.phoneVerificationRequired', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">المصادقة الثنائية</Label>
                    <p className="text-xs text-gray-500">مطلوبة لجميع المستخدمين</p>
                  </div>
                  <Switch
                    checked={settings.systemSettings.twoFactorRequired}
                    onCheckedChange={(checked) => 
                      updateSetting('systemSettings.twoFactorRequired', checked)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                إحصائيات المنصة
              </CardTitle>
              <CardDescription>
                نظرة عامة على إحصائيات المنصة والأداء
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">1,234</div>
                  <div className="text-sm text-gray-600">إجمالي المستخدمين</div>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">567</div>
                  <div className="text-sm text-gray-600">الوكلاء النشطون</div>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">8,901</div>
                  <div className="text-sm text-gray-600">العقارات المدرجة</div>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600">2,345</div>
                  <div className="text-sm text-gray-600">المعاملات المكتملة</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
