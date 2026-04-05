import { motion } from "framer-motion";
import { LandingPageContent } from "@/lib/cms";
import { ComponentType } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Mail, Phone, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContactSectionProps {
    content: LandingPageContent;
    iconMap: Record<string, ComponentType<{ className?: string }>>;
}

export const ContactSection = ({ content, iconMap }: ContactSectionProps) => {
    const contactInfo = content.contactInfo || [];

    // Always show contact section, even if empty (will show default content)

    return (
        <section id="contact" className="py-32 bg-gradient-to-br from-slate-50 via-white to-primary/10 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute end-0 top-0 w-96 h-96 bg-primary/60/5 blur-[120px] rounded-full" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
                    {content.contactBadge && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--warning)/0.1)]/80 backdrop-blur-sm border border-[hsl(var(--warning)/0.15)]/50 text-[hsl(var(--warning))] text-sm font-bold shadow-sm"
                        >
                            <Mail className="w-4 h-4" />
                            <span>{content.contactBadge}</span>
                        </motion.div>
                    )}

                    {content.contactTitle && (
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl lg:text-5xl font-black text-foreground leading-tight"
                            style={{ lineHeight: '1.4' }}
                        >
                            {content.contactTitle}
                        </motion.h2>
                    )}
                    {content.contactDescription && (
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-xl text-muted-foreground leading-relaxed"
                            style={{ lineHeight: '1.8' }}
                        >
                            {content.contactDescription}
                        </motion.p>
                    )}
                </div>

                {/* Contact Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {contactInfo.map((info, index) => {
                        const iconKey = info.icon || info.type || "phone";
                        const Icon = iconMap[iconKey.toLowerCase()] || Sparkles;
                        const isEmail = iconKey.toLowerCase().includes('mail') || iconKey.toLowerCase().includes('email');
                        const isPhone = iconKey.toLowerCase().includes('phone') || iconKey.toLowerCase().includes('tel');

                        return (
                            <motion.div
                                key={info.id || index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.15, duration: 0.6 }}
                                viewport={{ once: true }}
                            >
                                <Card className="group text-center border-2 border-border shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:border-primary/20 transition-all duration-500 hover:-translate-y-2 bg-white">
                                    <CardContent className="p-8">
                                        {/* Icon */}
                                        <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-sm">
                                            <Icon className="w-10 h-10" />
                                        </div>

                                        {/* Label */}
                                        <h3 className="text-xl font-black text-foreground mb-4 group-hover:text-foreground/80 transition-colors duration-300">
                                            {info.label}
                                        </h3>

                                        <Separator className="mb-4" />

                                        {/* Value */}
                                        <p className={cn(
                                            "text-muted-foreground font-bold text-lg leading-relaxed",
                                            (isEmail || isPhone) && "dir-ltr"
                                        )} style={{ lineHeight: '1.8' }}>
                                            {info.value}
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
