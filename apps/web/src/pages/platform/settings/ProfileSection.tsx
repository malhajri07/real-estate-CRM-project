/**
 * ProfileSection.tsx — Personal profile: name, contact, avatar, bio
 */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Save, Upload, User, Phone, MessageSquare } from "lucide-react";

const profileSchema = z.object({
  firstName: z.string().min(1, "الاسم الأول مطلوب"),
  lastName: z.string().min(1, "اسم العائلة مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  jobTitle: z.string().optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

// Keep this export for backward compat
export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  department: string;
  avatar: string;
}

interface Props {
  userData: any;
  onSave: (values: any) => void;
  isSaving: boolean;
}

export default function ProfileSection({ userData, onSave, isSaving }: Props) {
  const whatsapp = (userData?.metadata as any)?.whatsapp || "";

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: userData?.firstName || "",
      lastName: userData?.lastName || "",
      email: userData?.email || "",
      phone: userData?.phone || "",
      whatsapp: whatsapp,
      jobTitle: userData?.jobTitle || "",
    },
  });

  useEffect(() => {
    if (userData) {
      form.reset({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        email: userData.email || "",
        phone: userData.phone || "",
        whatsapp: (userData.metadata as any)?.whatsapp || "",
        jobTitle: userData.jobTitle || "",
      });
    }
  }, [userData, form]);

  const handleSubmit = (values: ProfileFormValues) => {
    onSave({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phone: values.phone,
      whatsapp: values.whatsapp,
      jobTitle: values.jobTitle,
    });
  };

  const initials = `${(userData?.firstName || "")[0] || ""}${(userData?.lastName || "")[0] || ""}`;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-primary/10 p-2 text-primary"><User size={18} /></span>
            <div>
              <CardTitle>الملف الشخصي</CardTitle>
              <CardDescription>بياناتك الشخصية وطرق التواصل</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={userData?.avatarUrl} />
              <AvatarFallback className="text-lg font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Upload size={14} />
                تغيير الصورة
              </Button>
              <p className="text-xs text-muted-foreground">يفضل 400×400 بكسل أو أكبر</p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="firstName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم الأول *</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="lastName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم العائلة *</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني *</FormLabel>
                    <FormControl><Input type="email" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="jobTitle" render={({ field }) => (
                  <FormItem>
                    <FormLabel>المسمى الوظيفي</FormLabel>
                    <FormControl><Input {...field} placeholder="وسيط عقاري" /></FormControl>
                  </FormItem>
                )} />
              </div>

              {/* Phone numbers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <Phone size={14} />
                      رقم الجوال
                    </FormLabel>
                    <FormControl><Input type="tel" dir="ltr" className="text-start" placeholder="+966 5x xxx xxxx" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="whatsapp" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <MessageSquare size={14} className="text-[#25D366]" />
                      رقم واتساب
                    </FormLabel>
                    <FormControl><Input type="tel" dir="ltr" className="text-start" placeholder="+966 5x xxx xxxx" {...field} /></FormControl>
                    <p className="text-xs text-muted-foreground">يظهر للعملاء كوسيلة تواصل مباشرة</p>
                  </FormItem>
                )} />
              </div>

              <Button type="submit" disabled={isSaving} className="gap-2">
                <Save size={16} />
                {isSaving ? "جاري الحفظ..." : "حفظ الملف الشخصي"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
