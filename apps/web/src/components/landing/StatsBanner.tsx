import { motion } from "framer-motion";
import { LandingPageContent } from "@/lib/cms";

interface StatsBannerProps {
    content: LandingPageContent;
}

export const StatsBanner = ({ content }: StatsBannerProps) => {
    const stats = content.stats || [];

    // Always show stats section, even if empty (will show default content)

    return (
        <section className="py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden" dir="rtl">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-transparent to-blue-900/20" />
            
            {/* Animated Gradient Orbs */}
            <motion.div
                animate={{
                    x: [0, 50, 0],
                    y: [0, 30, 0],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute top-0 end-0 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full"
            />
            <motion.div
                animate={{
                    x: [0, -40, 0],
                    y: [0, -20, 0],
                }}
                transition={{
                    duration: 18,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                }}
                className="absolute bottom-0 start-0 w-80 h-80 bg-blue-500/10 blur-[100px] rounded-full"
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {content.statsTitle && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl lg:text-4xl font-black text-white mb-4">
                            {content.statsTitle}
                        </h2>
                    </motion.div>
                )}
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={stat.id || index}
                            initial={{ opacity: 0, y: 30, scale: 0.9 }}
                            whileInView={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            viewport={{ once: true }}
                            className="group relative p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                        >
                            <div className="text-5xl lg:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/70 mb-3">
                                {stat.number}
                                {stat.suffix && <span className="text-3xl">{stat.suffix}</span>}
                            </div>
                            <div className="text-emerald-300 font-bold text-sm uppercase tracking-wider">
                                {stat.label}
                            </div>
                            
                            {/* Hover Glow Effect */}
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/0 to-blue-500/0 group-hover:from-emerald-500/10 group-hover:to-blue-500/10 transition-all duration-300 pointer-events-none" />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
