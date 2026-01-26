import { motion } from "framer-motion";
import { LandingPageContent } from "@/lib/cms";

interface StatsBannerProps {
    content: LandingPageContent;
}

export const StatsBanner = ({ content }: StatsBannerProps) => {
    const stats = content.stats || [];

    if (stats.length === 0) return null;

    return (
        <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/50 to-purple-900/50" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-white/10 divide-x-reverse md:divide-x-reverse">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="p-4"
                        >
                            <div className="text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 mb-2">
                                {stat.value}
                            </div>
                            <div className="text-blue-200 font-medium">
                                {stat.label}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
