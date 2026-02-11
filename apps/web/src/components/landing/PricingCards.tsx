import { motion } from "framer-motion";
import { LandingPageContent, PricingPlan } from "@/lib/cms";
import { CheckCircle2, Star, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PricingCardsProps {
    content: LandingPageContent;
    pricingPlans: PricingPlan[];
    onSelectPlan: (plan: PricingPlan) => void;
}

export const PricingCards = ({ content, pricingPlans, onSelectPlan }: PricingCardsProps) => {
    // Always show pricing section, even if empty (will show default content or empty state)

    return (
        <section id="pricing" className="py-32 relative bg-white" dir="rtl">
            {/* Background Decor */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-white to-emerald-50/30 -z-10" />
            <div className="absolute top-0 start-0 w-96 h-96 bg-emerald-400/5 blur-[120px] rounded-full" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
                    {content.pricingBadge && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50/80 backdrop-blur-sm border border-purple-100/50 text-purple-700 text-sm font-bold shadow-sm"
                        >
                            <Sparkles className="w-4 h-4" />
                            <span>{content.pricingBadge}</span>
                        </motion.div>
                    )}

                    {content.pricingTitle && (
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl lg:text-5xl font-black text-slate-900 leading-tight"
                            style={{ lineHeight: '1.4' }}
                        >
                            {content.pricingTitle}
                        </motion.h2>
                    )}
                    {content.pricingSubtitle && (
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-xl text-slate-600 leading-relaxed"
                            style={{ lineHeight: '1.8' }}
                        >
                            {content.pricingSubtitle}
                        </motion.p>
                    )}
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                    {pricingPlans.map((plan, index) => {
                        const isPopular = plan.isPopular;

                        return (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.15, duration: 0.6 }}
                                viewport={{ once: true }}
                                className={cn(
                                    "relative p-8 rounded-3xl border-2 transition-all duration-500 group",
                                    isPopular
                                        ? "bg-gradient-to-br from-white to-emerald-50/50 shadow-2xl border-emerald-300 scale-105 z-10"
                                        : "bg-white shadow-xl border-slate-200 hover:border-emerald-200 hover:scale-105 hover:shadow-2xl"
                                )}
                            >
                                {/* Popular Badge */}
                                {isPopular && (
                                    <div className="absolute -top-5 start-1/2 -translate-x-1/2 px-5 py-2 bg-gradient-to-l from-emerald-600 to-teal-600 rounded-full text-white text-sm font-black shadow-xl flex items-center gap-2">
                                        <Star className="w-4 h-4 fill-current" />
                                        <span>الأكثر طلباً</span>
                                    </div>
                                )}

                                {/* Gradient Overlay for Popular */}
                                {isPopular && (
                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                )}

                                <div className="relative z-10">
                                    {/* Plan Name */}
                                    <div className="text-center mb-8">
                                        <h3 className="text-2xl font-black text-slate-900 mb-4">{plan.name}</h3>
                                        <div className="flex items-baseline justify-center gap-2 mb-4">
                                            <span className="text-5xl font-black text-slate-900">{plan.price}</span>
                                            <span className="text-lg text-slate-500 font-bold">
                                                {plan.period === "monthly" ? "ريال/شهر" : "ريال/سنة"}
                                            </span>
                                        </div>
                                        {plan.description && (
                                            <p className="text-sm text-slate-600 leading-relaxed" style={{ lineHeight: '1.8' }}>
                                                {plan.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Features List */}
                                    <ul className="space-y-4 mb-8 min-h-[200px]">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                                                <CheckCircle2 className={cn(
                                                    "w-5 h-5 shrink-0 mt-0.5",
                                                    feature.included !== false ? "text-emerald-500" : "text-slate-300"
                                                )} />
                                                <span className={cn(
                                                    "leading-relaxed",
                                                    feature.included === false && "line-through text-slate-400"
                                                )} style={{ lineHeight: '1.8' }}>
                                                    {feature.text}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* CTA Button */}
                                    <Button
                                        onClick={() => onSelectPlan(plan)}
                                        size="lg"
                                        className={cn(
                                            "w-full rounded-2xl py-7 font-black text-lg shadow-xl transition-all duration-300",
                                            isPopular
                                                ? "bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-600/30 hover:shadow-emerald-600/40"
                                                : "bg-white text-slate-900 border-2 border-slate-200 hover:bg-slate-50 hover:border-emerald-300 shadow-slate-200"
                                        )}
                                    >
                                        {plan.buttonText || "اختر الباقة"}
                                    </Button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
