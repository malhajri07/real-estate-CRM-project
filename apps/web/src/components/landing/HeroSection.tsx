import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LandingPageContent } from "@/lib/cms";
import { Building, ArrowLeft, MoveRight } from "lucide-react";
import { HERO_METRIC_THEME } from "@/lib/landing-theme";

interface HeroSectionProps {
    content: LandingPageContent;
    onLogin: () => void;
    onSignUp: () => void;
}

export const HeroSection = ({ content, onLogin, onSignUp }: HeroSectionProps) => {
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, 200]);
    const y2 = useTransform(scrollY, [0, 500], [0, -150]);

    const heroMetrics = content.heroDashboardMetrics || [];

    return (
        <section id="home" className="relative pt-32 pb-20 overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 aurora-bg opacity-40 pointer-events-none" />
            <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-emerald-500/10 blur-[100px] rounded-full" />
            <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-teal-500/10 blur-[100px] rounded-full" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Text Content */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="text-end space-y-8" // RTL support: text-end is good
                    >
                        {content.heroWelcomeText && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100/50 text-emerald-600 text-sm font-medium"
                            >
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                {content.heroWelcomeText}
                            </motion.div>
                        )}

                        <div className="space-y-4">
                            {content.heroTitle && (
                                <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-tight">
                                    <span className="inline-block bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                        {content.heroTitle.split(" ").map((word, i) => (
                                            <span key={i} className="inline-block mr-3">{word}</span>
                                        ))}
                                    </span>
                                </h1>
                            )}

                            {content.heroSubtitle && (
                                <p className="text-xl text-slate-600 leading-relaxed max-w-lg mr-auto">
                                    {content.heroSubtitle}
                                </p>
                            )}
                        </div>

                        {(content.heroButton || content.heroLoginButton) && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="flex flex-col sm:flex-row gap-4 justify-end lg:justify-start" // Adjusted alignment for RTL context if needed, strictly speaking RTL flex-row with gap works
                            >
                                {content.heroLoginButton && (
                                    <Button
                                        onClick={onLogin}
                                        variant="outline"
                                        className="h-14 px-8 text-lg rounded-full border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-300"
                                    >
                                        {content.heroLoginButton}
                                    </Button>
                                )}
                                {content.heroButton && (
                                    <Button
                                        onClick={onSignUp}
                                        className="h-14 px-8 text-lg rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all duration-300 group"
                                    >
                                        {content.heroButton}
                                        <ArrowLeft className="mr-2 h-5 w-5 transition-transform group-hover:-translate-x-1" /> {/* RTL arrow logic: ArrowLeft points left, which is forward in RTL? No, usually ArrowLeft points left. In RTL, "next" is usually left. */}
                                    </Button>
                                )}

                            </motion.div>
                        )}

                        {/* Trust/Social Proof placeholder */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="pt-6 border-t border-slate-100"
                        >
                            <p className="text-sm text-slate-500 font-medium mb-3">يثق بنا أكثر من 2000 شركة عقارية</p>
                            <div className="flex gap-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                                {/* Placeholders for logos */}
                                <div className="h-8 w-24 bg-slate-200 rounded" />
                                <div className="h-8 w-24 bg-slate-200 rounded" />
                                <div className="h-8 w-24 bg-slate-200 rounded" />
                            </div>
                        </motion.div>

                    </motion.div>

                    {/* Dashboard Visual */}
                    <motion.div
                        style={{ y: y1 }}
                        initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
                        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="relative lg:h-[600px] flex items-center justify-center perspective-1000"
                    >
                        {/* Blob behind */}
                        <div className="absolute inset-0 bg-emerald-500/10 blur-3xl rounded-full scale-75 animate-pulse" />

                        {/* Main Dashboard Card */}
                        <div className="relative w-full max-w-lg glass rounded-2xl p-4 border border-white/40 shadow-2xl transform rotate-y-12">
                            {/* Browser Decor */}
                            <div className="flex items-center gap-2 mb-4 px-2">
                                <div className="w-3 h-3 rounded-full bg-red-400/80" />
                                <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                                <div className="w-3 h-3 rounded-full bg-green-400/80" />
                                <div className="flex-1 ml-4 h-6 bg-slate-100/50 rounded-full" />
                            </div>

                            {/* Content Mockup */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <div className="h-8 w-32 bg-slate-100/80 rounded" />
                                    <div className="h-8 w-8 bg-emerald-100/80 rounded-full" />
                                </div>

                                {/* Metrics Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="bg-white/50 p-3 rounded-xl border border-white/40">
                                            <div className="h-4 w-12 bg-slate-100 rounded mb-2" />
                                            <div className="h-6 w-20 bg-slate-200 rounded" />
                                        </div>
                                    ))}
                                </div>

                                {/* Chart Area */}
                                <div className="h-32 bg-gradient-to-t from-emerald-50/50 to-transparent rounded-xl border border-white/30 flex items-end p-2 gap-2">
                                    {[40, 60, 45, 70, 50, 80, 65].map((h, i) => (
                                        <div key={i} className="flex-1 bg-emerald-500/20 rounded-t-sm" style={{ height: `${h}%` }} />
                                    ))}
                                </div>
                            </div>

                            {/* Floating Elements */}
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                className="absolute -right-8 top-20 glass p-3 rounded-xl shadow-lg border-white/40"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                        <Building className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500">مبيعات اليوم</div>
                                        <div className="text-sm font-bold text-slate-800">+ 12,500 <span className="text-xs font-normal text-slate-400">SAR</span></div>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                animate={{ y: [0, 10, 0] }}
                                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                                className="absolute -left-6 bottom-20 glass p-3 rounded-xl shadow-lg border-white/40"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                        <Building className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500">عملاء جدد</div>
                                        <div className="text-sm font-bold text-slate-800">+ 24</div>
                                    </div>
                                </div>
                            </motion.div>

                        </div>

                    </motion.div>
                </div>
            </div>
        </section>
    );
};
