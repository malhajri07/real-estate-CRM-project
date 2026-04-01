import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Save, Upload, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  department: string;
  avatar: string;
}

export interface ProfileSectionProps {
  userProfile: UserProfile;
  onUserProfileChange: (profile: UserProfile) => void;
  onSave: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProfileSection({
  userProfile,
  onUserProfileChange,
  onSave,
  isOpen,
  onOpenChange,
}: ProfileSectionProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <Card>
        <CardHeader className="border-b border-border pb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-primary/10 p-2 text-primary"><Users size={18} /></span>
            <div className="text-end">
              <CardTitle>الملف الشخصي للفريق</CardTitle>
              <CardDescription>تحكم ببياناتك الشخصية وصورتك الظاهرة في المنصة</CardDescription>
            </div>
          </div>
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full border border-border bg-card p-2 text-muted-foreground transition hover:text-foreground/80"
              aria-label="تبديل عرض الملف الشخصي"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-6 pt-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={userProfile.avatar} />
                <AvatarFallback className="text-lg">
                  {userProfile.firstName[0]}{userProfile.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Button variant="outline" className="flex items-center gap-2" data-testid="button-upload-avatar">
                  <Upload size={16} />
                  تغيير الصورة الشخصية
                </Button>
                <p className="text-sm text-muted-foreground">يفضل استخدام صور بحجم 400x400 بكسل أو أكبر</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">الاسم الأول</Label>
                <Input
                  id="firstName"
                  className="text-subtle"
                  value={userProfile.firstName}
                  onChange={(e) => onUserProfileChange({ ...userProfile, firstName: e.target.value })}
                  data-testid="input-first-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">اسم العائلة</Label>
                <Input
                  id="lastName"
                  className="text-subtle"
                  value={userProfile.lastName}
                  onChange={(e) => onUserProfileChange({ ...userProfile, lastName: e.target.value })}
                  data-testid="input-last-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userEmail" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">البريد الإلكتروني</Label>
                <Input
                  id="userEmail"
                  type="email"
                  className="text-subtle"
                  value={userProfile.email}
                  onChange={(e) => onUserProfileChange({ ...userProfile, email: e.target.value })}
                  data-testid="input-user-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userPhone" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">رقم الهاتف</Label>
                <Input
                  id="userPhone"
                  type="tel"
                  className="text-subtle"
                  value={userProfile.phone}
                  onChange={(e) => onUserProfileChange({ ...userProfile, phone: e.target.value })}
                  data-testid="input-user-phone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">المسمى الوظيفي</Label>
                <Input
                  id="title"
                  className="text-subtle"
                  value={userProfile.title}
                  onChange={(e) => onUserProfileChange({ ...userProfile, title: e.target.value })}
                  data-testid="input-user-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">القسم</Label>
                <Select value={userProfile.department} onValueChange={(value) => onUserProfileChange({ ...userProfile, department: value })}>
                  <SelectTrigger className="text-subtle" data-testid="select-department">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4}>
                    <SelectItem value="المبيعات">المبيعات</SelectItem>
                    <SelectItem value="التسويق">التسويق</SelectItem>
                    <SelectItem value="خدمة العملاء">خدمة العملاء</SelectItem>
                    <SelectItem value="التطوير">التطوير</SelectItem>
                    <SelectItem value="الإدارة">الإدارة</SelectItem>
                    <SelectItem value="المالية">المالية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-start">
              <Button onClick={onSave} className="flex items-center gap-2" data-testid="button-save-profile">
                <Save size={16} />
                حفظ الملف الشخصي
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
