import { motion } from "framer-motion";
import { LandingPageContent } from "@/lib/cms";
import { ComponentType } from "react";
import { CheckCircle2, Sparkles, Target } from "lucide-react";

interface SolutionsSectionProps {
    content: LandingPageContent;
    iconMap: Record<string, ComponentType<{ className?: string }>>;
}

export const SolutionsSection = ({ content, iconMap }: SolutionsSectionProps) => {
    const solutions = content.solutions || [];

    // Always show solutions section, even if empty (will show default content)

    return (
        <section id="solutions" className="py-32 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 relative overflow-hidden" dir="rtl">
            {/* Background Decor */}
            <div className="absolute end-0 top-0 w-1/2 h-full bg-white/50 skew-x-12 opacity-30 pointer-events-none" />
            <div className="absolute start-0 bottom-0 w-96 h-96 bg-emerald-400/5 blur-[120px] rounded-full" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
                    {content.solutionsBadge && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50/80 backdrop-blur-sm border border-blue-100/50 text-blue-700 text-sm font-bold shadow-sm"
                        >
                            <Target className="w-4 h-4" />
                            <span>{content.solutionsBadge}</span>
                        </motion.div>
                    )}

                    {content.solutionsTitle && (
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl lg:text-5xl font-black text-slate-900 leading-tight"
                            style={{ lineHeight: '1.4' }}
                        >
                            {content.solutionsTitle}
                        </motion.h2>
                    )}
                    {content.solutionsDescription && (
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-xl text-slate-600 leading-relaxed"
                            style={{ lineHeight: '1.8' }}
                        >
                            {content.solutionsDescription}
                        </motion.p>
                    )}
                </div>

                {/* Solutions Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {solutions.map((solution, index) => {
                        const Icon = solution.icon ? iconMap[solution.icon.toLowerCase()] || Sparkles : Sparkles;

                        return (
                            <motion.div
                                key={solution.id}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.15, duration: 0.6 }}
                                viewport={{ once: true }}
                                className="group relative bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border-2 border-slate-100 hover:border-emerald-200 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
                            >
                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/0 via-transparent to-blue-50/0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                <div className="relative z-10">
                                    {/* Icon */}
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-blue-100 flex items-center justify-center mb-6 text-emerald-600 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-sm">
                                        <Icon className="w-8 h-8" />
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-2xl font-black text-slate-900 mb-4 group-hover:text-emerald-600 transition-colors duration-300">
                                        {solution.title}
                                    </h3>
                                    
                                    {/* Description */}
                                    <p className="text-slate-600 mb-8 leading-relaxed" style={{ lineHeight: '1.8' }}>
                                        {solution.description}
                                    </p>

                                    {/* Features List */}
                                    {solution.features && solution.features.length > 0 && (
                                        <ul className="space-y-4">
                                            {solution.features.map((feature: any, i: number) => {
                                                const text = typeof feature === 'string' ? feature : feature.text;
                                                return (
                                                    <motion.li
                                                        key={i}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        whileInView={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.15 + i * 0.05 }}
                                                        viewport={{ once: true }}
                                                        className="flex items-start gap-3 text-slate-700"
                                                    >
                                                        <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                                                        <span className="leading-relaxed" style={{ lineHeight: '1.8' }}>{text}</span>
                                                    </motion.li>
                                                )
                                            })}
                                        </ul>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
