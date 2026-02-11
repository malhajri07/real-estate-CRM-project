import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LandingPageContent } from "@/lib/cms";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
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

    // Ensure we always render something
    if (!content) {
        console.error('[HeroSection] No content provided');
        return (
            <section id="home" className="relative min-h-screen flex items-center justify-center pt-24 pb-20" dir="rtl">
                <div className="text-center">
                    <h1 className="text-4xl font-black text-slate-900 mb-4">منصة إدارة العقارات الذكية</h1>
                    <p className="text-xl text-slate-600 mb-8">أداة متكاملة لإدارة عملياتك العقارية بكفاءة واحترافية</p>
                    <div className="flex gap-4 justify-center">
                        <button onClick={onLogin} className="px-8 py-3 rounded-2xl border-2 border-slate-200 font-bold">تسجيل الدخول</button>
                        <button onClick={onSignUp} className="px-8 py-3 rounded-2xl bg-emerald-600 text-white font-bold">ابدأ الآن</button>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section id="home" className="relative min-h-screen flex items-center pt-24 pb-20 overflow-hidden" dir="rtl" style={{ minHeight: '100vh' }}>
            {/* Modern Background with Gradient Mesh */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.1),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.1),transparent_50%)]" />
            
            {/* Animated Orbs */}
            <motion.div
                animate={{
                    x: [0, 100, 0],
                    y: [0, 50, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute top-20 end-20 w-96 h-96 bg-emerald-400/20 blur-[120px] rounded-full"
            />
            <motion.div
                animate={{
                    x: [0, -80, 0],
                    y: [0, -40, 0],
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                }}
                className="absolute bottom-20 start-20 w-80 h-80 bg-blue-400/20 blur-[100px] rounded-full"
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    {/* Text Content - RTL Optimized */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="space-y-8 text-end"
                    >
                        {(content.heroWelcomeText || content.heroTitle) && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50/80 backdrop-blur-sm border border-emerald-100/50 text-emerald-700 text-sm font-bold shadow-sm"
                            >
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                {content.heroWelcomeText}
                            </motion.div>
                        )}

                        <div className="space-y-6">
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-5xl lg:text-7xl xl:text-8xl font-black tracking-tight text-slate-900 leading-[1.1]"
                                style={{ lineHeight: '1.6' }}
                            >
                                <span className="block bg-gradient-to-l from-slate-900 via-slate-800 to-emerald-600 bg-clip-text text-transparent">
                                    {content.heroTitle || "منصة إدارة العقارات الذكية"}
                                </span>
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-xl lg:text-2xl text-slate-600 leading-relaxed max-w-2xl ms-auto"
                                style={{ lineHeight: '1.8' }}
                            >
                                {content.heroSubtitle || "أداة متكاملة لإدارة عملياتك العقارية بكفاءة واحترافية"}
                            </motion.p>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="flex flex-col sm:flex-row gap-4 justify-end"
                        >
                            <Button
                                onClick={onLogin}
                                variant="outline"
                                size="lg"
                                className="h-14 px-8 text-lg rounded-2xl border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 font-bold shadow-sm"
                            >
                                {content.heroLoginButton || "تسجيل الدخول"}
                            </Button>
                            <Button
                                onClick={onSignUp}
                                size="lg"
                                className="h-14 px-8 text-lg rounded-2xl bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xl shadow-emerald-600/30 hover:shadow-emerald-600/40 transition-all duration-300 group font-bold"
                            >
                                {content.heroButton || "ابدأ الآن"}
                                <ArrowRight className="ms-2 h-5 w-5 transition-transform group-hover:translate-x-[-4px]" />
                            </Button>
                        </motion.div>

                        {/* Dashboard Metrics Preview */}
                        {heroMetrics.length > 0 && content.heroDashboardTitle && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="pt-8 border-t border-slate-200/50"
                            >
                                <p className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">
                                    {content.heroDashboardTitle}
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    {heroMetrics.slice(0, 4).map((metric, idx) => (
                                        <motion.div
                                            key={metric.id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.7 + idx * 0.1 }}
                                            className="p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-slate-100 shadow-sm hover:shadow-md transition-all"
                                        >
                                            <div className={cn(
                                                "text-2xl font-black mb-1",
                                                HERO_METRIC_THEME[metric.color as keyof typeof HERO_METRIC_THEME]?.text || "text-slate-900"
                                            )}>
                                                {metric.value}
                                            </div>
                                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                {metric.label}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Dashboard Visual - Enhanced */}
                    <motion.div
                        style={{ y: y1 }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="relative lg:h-[650px] flex items-center justify-center"
                    >
                        {/* Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-blue-400/20 blur-3xl rounded-full scale-75 animate-pulse" />

                        {/* Main Dashboard Card - Modern Glass Design */}
                        <div className="relative w-full max-w-lg glass rounded-3xl p-6 border border-white/60 shadow-2xl backdrop-blur-xl bg-white/80">
                            {/* Browser Chrome */}
                            <div className="flex items-center gap-2 mb-6 px-3">
                                <div className="w-3 h-3 rounded-full bg-red-400" />
                                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                <div className="w-3 h-3 rounded-full bg-green-400" />
                                <div className="flex-1 ms-4 h-7 bg-slate-100/80 rounded-lg" />
                            </div>

                            {/* Dashboard Content */}
                            <div className="space-y-6">
                                {/* Header */}
                                <div className="flex justify-between items-center">
                                    <div className="h-10 w-40 bg-gradient-to-l from-slate-200 to-slate-100 rounded-lg" />
                                    <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-emerald-600" />
                                    </div>
                                </div>

                                {/* Metrics Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    {heroMetrics.length > 0 ? (
                                        heroMetrics.slice(0, 4).map((metric, i) => (
                                            <div key={i} className="bg-white/80 p-4 rounded-xl border border-slate-100 shadow-sm">
                                                <div className="h-3 w-20 bg-slate-200 rounded mb-3" />
                                                <div className={cn(
                                                    "h-8 w-24 rounded",
                                                    HERO_METRIC_THEME[metric.color as keyof typeof HERO_METRIC_THEME]?.bg || "bg-slate-300"
                                                )} />
                                            </div>
                                        ))
                                    ) : (
                                        [1, 2, 3, 4].map(i => (
                                            <div key={i} className="bg-white/80 p-4 rounded-xl border border-slate-100 shadow-sm">
                                                <div className="h-3 w-20 bg-slate-200 rounded mb-3" />
                                                <div className="h-8 w-24 bg-slate-300 rounded" />
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Chart Area */}
                                <div className="h-40 bg-gradient-to-t from-emerald-50/80 to-transparent rounded-xl border border-emerald-100/50 flex items-end p-3 gap-2">
                                    {[40, 60, 45, 70, 50, 80, 65].map((h, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ height: 0 }}
                                            animate={{ height: `${h}%` }}
                                            transition={{ delay: 0.8 + i * 0.1, duration: 0.5 }}
                                            className="flex-1 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-lg opacity-80"
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Floating Metric Cards */}
                            {heroMetrics.length > 0 && heroMetrics.slice(0, 2).map((metric, idx) => (
                                <motion.div
                                    key={metric.id}
                                    animate={{ y: [0, idx === 0 ? -10 : 10, 0] }}
                                    transition={{ repeat: Infinity, duration: 4 + idx, ease: "easeInOut", delay: idx * 0.5 }}
                                    className={cn(
                                        "absolute glass p-4 rounded-xl shadow-xl border border-white/60 backdrop-blur-sm",
                                        idx === 0 ? "-end-8 top-24" : "-start-6 bottom-24"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center",
                                            HERO_METRIC_THEME[metric.color as keyof typeof HERO_METRIC_THEME]?.bg || "bg-emerald-100"
                                        )}>
                                            <Sparkles className={cn(
                                                "w-6 h-6",
                                                HERO_METRIC_THEME[metric.color as keyof typeof HERO_METRIC_THEME]?.text || "text-emerald-600"
                                            )} />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{metric.label}</div>
                                            <div className={cn(
                                                "text-lg font-black",
                                                HERO_METRIC_THEME[metric.color as keyof typeof HERO_METRIC_THEME]?.text || "text-slate-900"
                                            )}>
                                                {metric.value}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
