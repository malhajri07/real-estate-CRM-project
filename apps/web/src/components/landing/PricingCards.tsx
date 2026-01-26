import { motion } from "framer-motion";
import { LandingPageContent, PricingPlan } from "@/lib/cms";
import { Check, CheckCircle2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PricingCardsProps {
    content: LandingPageContent;
    pricingPlans: PricingPlan[];
    onSelectPlan: (plan: PricingPlan) => void;
}

export const PricingCards = ({ content, pricingPlans, onSelectPlan }: PricingCardsProps) => {
    return (
        <section id="pricing" className="py-24 relative">
            {/* Background Decor */}
            <div className="absolute inset-0 bg-slate-50/50 -z-10" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                    <h2 className="text-4xl font-bold text-slate-900">{content.pricingTitle}</h2>
                    <p className="text-lg text-slate-600">{content.pricingSubtitle}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                    {pricingPlans.map((plan, index) => {
                        const isPopular = plan.isPopular;

                        return (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className={cn(
                                    "relative p-8 rounded-3xl border transition-all duration-300",
                                    isPopular
                                        ? "bg-white shadow-2xl border-emerald-200 scale-105 z-10"
                                        : "bg-white/60 hover:bg-white shadow-xl border-slate-100 hover:scale-105"
                                )}
                            >
                                {isPopular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full text-white text-sm font-bold shadow-lg flex items-center gap-1">
                                        <Star className="w-3.5 h-3.5 fill-current" />
                                        <span>الأكثر طلباً</span>
                                    </div>
                                )}

                                <div className="text-center mb-8">
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                                    <div className="flex items-baseline justify-center gap-1">
                                        <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                                        <span className="text-sm text-slate-500">{plan.period}</span>
                                    </div>
                                    <p className="mt-4 text-sm text-slate-500">{plan.description}</p>
                                </div>

                                <ul className="space-y-4 mb-8">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                            <span className="leading-tight">{feature.text}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    onClick={() => onSelectPlan(plan)}
                                    className={cn(
                                        "w-full rounded-xl py-6 font-semibold shadow-lg transition-all duration-300",
                                        isPopular
                                            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200"
                                            : "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-slate-100"
                                    )}
                                >
                                    {plan.buttonText || "اختر الباقة"}
                                </Button>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
