import { motion } from "framer-motion";
import { LandingPageContent } from "@/lib/cms";
import { MoveRight, Sparkles } from "lucide-react";
import { ComponentType } from "react";
import { cn } from "@/lib/utils";

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
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export const FeatureGrid = ({ content, iconMap }: FeatureGridProps) => {
    const features = content.features || [];

    return (
        <section id="features" className="py-24 relative overflow-hidden">
            {/* Decor */}
            <div className="absolute top-1/2 left-0 w-96 h-96 bg-blue-400/5 blur-[120px] rounded-full -translate-y-1/2" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-sm font-medium mx-auto"
                    >
                        <Sparkles className="w-4 h-4" />
                        <span>مميزات النظام</span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl font-bold text-slate-900"
                    >
                        {content.featuresTitle}
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-lg text-slate-600"
                    >
                        {content.featuresDescription}
                    </motion.p>
                </div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                    {features.map((feature) => {
                        const Icon = feature.icon ? iconMap[feature.icon] : null;

                        return (
                            <motion.div
                                key={feature.id}
                                variants={item}
                                className="group relative p-8 rounded-3xl bg-white border border-slate-100 hover:border-emerald-100 shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-300"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                <div className="relative z-10">
                                    <div className="w-14 h-14 rounded-2xl bg-emerald-600/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                        {Icon && <Icon className="w-7 h-7 text-emerald-600" />}
                                    </div>

                                    <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors">
                                        {feature.title}
                                    </h3>

                                    <p className="text-slate-600 leading-relaxed mb-6">
                                        {feature.description}
                                    </p>

                                    <div className="flex items-center text-emerald-600 font-medium text-sm gap-2 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                        <span>اقرأ المزيد</span>
                                        <MoveRight className="w-4 h-4 transform rotate-180" /> {/* RTL arrow fix: MoveRight points right. Rotate 180 to point left (next) */}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
};
