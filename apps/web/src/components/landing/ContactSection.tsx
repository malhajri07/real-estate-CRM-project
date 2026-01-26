import { LandingPageContent } from "@/lib/cms";
import { ComponentType } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface ContactSectionProps {
    content: LandingPageContent;
    iconMap: Record<string, ComponentType<{ className?: string }>>;
}

export const ContactSection = ({ content, iconMap }: ContactSectionProps) => {
    const contactInfo = content.contactInfo || [];

    return (
        <section id="contact" className="py-24 bg-white relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                    {content.contactTitle && <h2 className="text-4xl font-bold text-slate-900">{content.contactTitle}</h2>}
                    {content.contactDescription && <p className="text-lg text-slate-600">{content.contactDescription}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {contactInfo.map((info, index) => {
                        const iconKey = info.icon || info.type || "phone";
                        const Icon = iconMap[iconKey.toLowerCase()] || Sparkles;

                        return (
                            <Card key={index} className="text-center border-none shadow-lg shadow-slate-200/50 hover:shadow-xl transition-shadow duration-300">
                                <CardContent className="p-8">
                                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
                                        <Icon className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">{info.label}</h3>
                                    <p className="text-slate-600 dir-ltr font-medium text-lg">{info.value}</p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
