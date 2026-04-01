import { motion } from "framer-motion";
import { LandingPageContent } from "@/lib/cms";
import { ArrowLeft, Sparkles } from "lucide-react";
import { ComponentType } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface FeatureGridProps {
    content: LandingPageContent;
    iconMap: Record<string, ComponentType<{ className?: string }>>;
}

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0 }
};

export const FeatureGrid = ({ content, iconMap }: FeatureGridProps) => {
    const features = content.features || [];

    // Always show features section, even if empty (will show default content)

    return (
        <section id="features" className="py-32 relative overflow-hidden bg-white" dir="rtl">
            {/* Background Decor */}
            <div className="absolute top-1/2 start-0 w-96 h-96 bg-primary/10 blur-[120px] rounded-full -translate-y-1/2" />
            <div className="absolute bottom-0 end-0 w-80 h-80 bg-blue-400/5 blur-[100px] rounded-full" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
                    {content.featuresBadge && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20 text-primary text-sm font-bold shadow-sm"
                        >
                            <Sparkles className="w-4 h-4" />
                            <span>{content.featuresBadge}</span>
                        </motion.div>
                    )}

                    {content.featuresTitle && (
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl lg:text-5xl font-black text-foreground leading-tight"
                            style={{ lineHeight: '1.4' }}
                        >
                            {content.featuresTitle}
                        </motion.h2>
                    )}
                    {content.featuresDescription && (
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-xl text-muted-foreground leading-relaxed"
                            style={{ lineHeight: '1.8' }}
                        >
                            {content.featuresDescription}
                        </motion.p>
                    )}
                </div>

                {/* Features Grid */}
                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                    {features.map((feature) => {
                        const Icon = feature.icon ? iconMap[feature.icon] : Sparkles;

                        return (
                            <motion.div
                                key={feature.id}
                                variants={item}
                                className="group relative"
                            >
                                <Card className="relative rounded-3xl border-2 border-border hover:border-primary/20 shadow-lg hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 hover:-translate-y-2 bg-white">
                                    {/* Gradient Background on Hover */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-blue-50/0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                    {/* Accent Border */}
                                    <div className="absolute inset-0 rounded-3xl border-2 border-primary/20 group-hover:border-primary/20 transition-all duration-500" />

                                    <CardContent className="relative z-10 p-8">
                                        {/* Icon */}
                                        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-sm">
                                            {Icon && <Icon className="w-8 h-8 text-muted-foreground" />}
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-2xl font-black text-foreground mb-4 group-hover:text-foreground/80 transition-colors duration-300">
                                            {feature.title}
                                        </h3>

                                        {/* Description */}
                                        <p className="text-muted-foreground leading-relaxed mb-6" style={{ lineHeight: '1.8' }}>
                                            {feature.description}
                                        </p>

                                        {/* Read More Link */}
                                        <div className="flex items-center text-primary font-bold text-sm gap-2 opacity-0 translate-x-[-10px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                            <span>اقرأ المزيد</span>
                                            <ArrowLeft className="w-4 h-4" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
};
