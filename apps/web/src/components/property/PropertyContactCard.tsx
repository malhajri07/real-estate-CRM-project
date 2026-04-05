/**
 * PropertyContactCard.tsx — Agent contact card for property detail pages
 *
 * Shows the listing agent's info with quick contact buttons.
 * Used in property detail sidebar.
 */

import { Phone, Mail, MessageCircle, Calendar, Star, MapPin, Award, Building2, Clock, ExternalLink, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface AgentContactInfo {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  title?: string;
  organization?: {
    tradeName?: string;
    legalName?: string;
  };
  licenseNo?: string;
  experience?: string;
  specialties?: string;
  territories?: string;
  rating?: number;
  totalDeals?: number;
  activeListings?: number;
}

interface PropertyContactCardProps {
  agent?: AgentContactInfo | null;
  className?: string;
  onScheduleViewing?: () => void;
  onCall?: (phone: string) => void;
  onWhatsApp?: (phone: string) => void;
  onEmail?: (email: string) => void;
}

/**
 * PropertyContactCard — Shows agent info with contact actions
 */
export function PropertyContactCard({
  agent,
  className,
  onScheduleViewing,
  onCall,
  onWhatsApp,
  onEmail,
}: PropertyContactCardProps) {
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  if (!agent) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-bold">لا توجد معلومات الوسيط</p>
        </CardContent>
      </Card>
    );
  }

  const fullName = `${agent.firstName} ${agent.lastName}`.trim();
  const initials = `${agent.firstName?.[0] || ""}${agent.lastName?.[0] || ""}`.toUpperCase();
  const orgName = agent.organization?.tradeName || agent.organization?.legalName;

  const copyToClipboard = async (text: string, type: "phone" | "email") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "phone") { setCopiedPhone(true); setTimeout(() => setCopiedPhone(false), 2000); }
      if (type === "email") { setCopiedEmail(true); setTimeout(() => setCopiedEmail(false), 2000); }
    } catch { /* clipboard not available */ }
  };

  const handleCall = () => {
    if (agent.phone) {
      if (onCall) onCall(agent.phone);
      else window.open(`tel:${agent.phone}`, "_self");
    }
  };

  const handleWhatsApp = () => {
    if (agent.phone) {
      if (onWhatsApp) onWhatsApp(agent.phone);
      else window.open(`https://wa.me/${agent.phone.replace(/[^0-9]/g, "")}`, "_blank");
    }
  };

  const handleEmail = () => {
    if (agent.email) {
      if (onEmail) onEmail(agent.email);
      else window.open(`mailto:${agent.email}`, "_self");
    }
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-sm">الوسيط العقاري</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Agent Info */}
        <div className="flex items-center gap-3">
          <Avatar className="h-14 w-14">
            <AvatarImage src={agent.avatarUrl || undefined} alt={fullName} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground truncate">{fullName}</h3>
            {agent.title && (
              <p className="text-xs text-muted-foreground">{agent.title}</p>
            )}
            {orgName && (
              <div className="flex items-center gap-1 mt-0.5">
                <Building2 className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground truncate">{orgName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Rating & Stats */}
        <div className="flex items-center gap-4">
          {agent.rating != null && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-[hsl(var(--warning))] fill-[hsl(var(--warning))]" />
              <span className="text-sm font-bold">{agent.rating.toFixed(1)}</span>
            </div>
          )}
          {agent.totalDeals != null && (
            <div className="flex items-center gap-1">
              <Award className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{agent.totalDeals} صفقة</span>
            </div>
          )}
          {agent.activeListings != null && (
            <div className="flex items-center gap-1">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{agent.activeListings} إعلان</span>
            </div>
          )}
        </div>

        {/* License */}
        {agent.licenseNo && (
          <Badge variant="outline" className="text-xs">
            رخصة: {agent.licenseNo}
          </Badge>
        )}

        {/* Specialties & Territories */}
        {(agent.specialties || agent.territories) && (
          <>
            <Separator />
            <div className="space-y-2">
              {agent.specialties && (
                <div className="flex items-start gap-2">
                  <Award className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-muted-foreground">التخصص</p>
                    <p className="text-xs text-foreground">{agent.specialties}</p>
                  </div>
                </div>
              )}
              {agent.territories && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-muted-foreground">المناطق</p>
                    <p className="text-xs text-foreground">{agent.territories}</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <Separator />

        {/* Contact Info */}
        <div className="space-y-2">
          {agent.phone && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-xs">{agent.phone}</span>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => copyToClipboard(agent.phone!, "phone")}>
                    {copiedPhone ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{copiedPhone ? "تم النسخ" : "نسخ الرقم"}</TooltipContent>
              </Tooltip>
            </div>
          )}
          {agent.email && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs truncate max-w-[180px]">{agent.email}</span>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => copyToClipboard(agent.email!, "email")}>
                    {copiedEmail ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{copiedEmail ? "تم النسخ" : "نسخ البريد"}</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {agent.phone && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCall}>
              <Phone className="h-3.5 w-3.5" />
              اتصال
            </Button>
          )}
          {agent.phone && (
            <Button variant="outline" size="sm" className="gap-1.5 text-primary hover:text-primary" onClick={handleWhatsApp}>
              <MessageCircle className="h-3.5 w-3.5" />
              واتساب
            </Button>
          )}
          {agent.email && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleEmail}>
              <Mail className="h-3.5 w-3.5" />
              بريد
            </Button>
          )}
          <Button variant="default" size="sm" className="gap-1.5" onClick={onScheduleViewing}>
            <Calendar className="h-3.5 w-3.5" />
            حجز معاينة
          </Button>
        </div>

        {/* Experience */}
        {agent.experience && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
            <Clock className="h-3 w-3" />
            <span>خبرة {agent.experience}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * PropertyContactCardSkeleton — Loading state
 */
export function PropertyContactCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6 space-y-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-full bg-muted" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-3 w-16 rounded bg-muted" />
          </div>
        </div>
        <div className="h-px bg-muted" />
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-muted" />
          <div className="h-3 w-3/4 rounded bg-muted" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="h-9 rounded bg-muted" />
          <div className="h-9 rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}
