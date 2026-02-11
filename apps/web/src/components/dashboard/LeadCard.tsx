/**
 * LeadCard.tsx - Enhanced Lead Card Component
 * 
 * Modern lead card with avatar, quick actions, and better visual hierarchy
 */

import { motion } from "framer-motion";
import { Link } from "wouter";
import { Phone, MapPin, MessageSquare, Eye, ArrowLeft } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Lead } from "@shared/types";

interface LeadCardProps {
  lead: Lead;
  statusBadge: { label: string; variant: NonNullable<BadgeProps["variant"]> };
  locale: string;
  index?: number;
  onCall?: (phone: string) => void;
  onMessage?: (leadId: string) => void;
}

export function LeadCard({ 
  lead, 
  statusBadge, 
  locale, 
  index = 0,
  onCall,
  onMessage 
}: LeadCardProps) {
  const initials = `${lead.firstName?.[0] || ''}${lead.lastName?.[0] || ''}`.toUpperCase();
  const createdDate = new Date(lead.createdAt);
  const daysSinceCreated = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <motion.li
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="group"
    >
      <Link to={`/home/platform/leads/${lead.id}`}>
        <div className="bg-gradient-to-br from-white/90 via-white/80 to-blue-50/30 rounded-2xl p-5 border-l-4 border-blue-500 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group">
          {/* Enhanced Gradient Overlay on Hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-emerald-50/0 to-blue-50/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="relative z-10 flex items-start gap-4">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-100 to-blue-100 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                <span className="text-lg font-black text-emerald-700">
                  {initials || "?"}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Name and Status */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-black text-slate-900 mb-1 group-hover:text-emerald-600 transition-colors" style={{ lineHeight: '1.4' }}>
                    {lead.firstName} {lead.lastName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    {lead.phone && (
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />
                        {lead.phone}
                      </span>
                    )}
                    {lead.city && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {lead.city}
                      </span>
                    )}
                  </div>
                </div>
                <Badge 
                  variant={statusBadge.variant} 
                  className="rounded-full px-3 py-1 text-xs font-bold shrink-0"
                >
                  {statusBadge.label}
                </Badge>
              </div>

              {/* Meta Info */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold">
                  {createdDate.toLocaleDateString(locale, { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                  {daysSinceCreated > 0 && (
                    <span className="ms-2 text-amber-600">
                      • {daysSinceCreated} {daysSinceCreated === 1 ? 'يوم' : 'أيام'}
                    </span>
                  )}
                </span>
                
                {/* Quick Actions (shown on hover) */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {lead.phone && onCall && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 rounded-lg"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onCall(lead.phone!);
                      }}
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                  )}
                  {onMessage && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 rounded-lg"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onMessage(lead.id);
                      }}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 rounded-lg"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Hover Arrow Indicator */}
          <div className="absolute end-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <ArrowLeft className="h-5 w-5 text-emerald-600" />
          </div>
        </div>
      </Link>
    </motion.li>
  );
}
