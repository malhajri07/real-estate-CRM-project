import { motion } from "framer-motion";
import { LandingPageContent } from "@/lib/cms";
import { ComponentType } from "react";
import { CheckCircle2, Sparkles } from "lucide-react";

interface SolutionsSectionProps {
    content: LandingPageContent;
    iconMap: Record<string, ComponentType<{ className?: string }>>;
}

export const SolutionsSection = ({ content, iconMap }: SolutionsSectionProps) => {
    const solutions = content.solutions || [];

    return (
        <section id="solutions" className="py-24 bg-slate-50 relative overflow-hidden">
            {/* Decor */}
            <div className="absolute right-0 top-0 w-1/2 h-full bg-white skew-x-12 opacity-50 pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                    {content.solutionsTitle && (
                        <h2 className="text-4xl font-bold text-slate-900">{content.solutionsTitle}</h2>
                    )}
                    {content.solutionsDescription && (
                        <p className="text-lg text-slate-600">{content.solutionsDescription}</p>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {solutions.map((solution, index) => {
                        const Icon = solution.icon ? iconMap[solution.icon.toLowerCase()] || Sparkles : Sparkles;

                        return (
                            <motion.div
                                key={solution.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 hover:border-emerald-200 transition-colors duration-300"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-emerald-100/50 flex items-center justify-center mb-6 text-emerald-600">
                                    <Icon className="w-8 h-8" />
                                </div>

                                <h3 className="text-2xl font-bold text-slate-900 mb-4">{solution.title}</h3>
                                <p className="text-slate-600 mb-8 leading-relaxed">{solution.description}</p>

                                {solution.features && solution.features.length > 0 && (
                                    <ul className="space-y-3">
                                        {solution.features.map((feature: any, i: number) => {
                                            const text = typeof feature === 'string' ? feature : feature.text;
                                            return (
                                                <li key={i} className="flex items-start gap-3 text-slate-700">
                                                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                                    <span>{text}</span>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
