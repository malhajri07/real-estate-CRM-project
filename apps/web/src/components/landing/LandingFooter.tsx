import { motion } from "framer-motion";
import { LandingPageContent } from "@/lib/cms";
import agarkomFooterLogo from "@assets/6_1756507125793.png";

type FooterLinkGroup = { category: string; links: { text: string; url: string }[] };

interface LandingFooterProps {
    content: LandingPageContent;
    footerGroups: FooterLinkGroup[];
}

export const LandingFooter = ({ content, footerGroups }: LandingFooterProps) => {
    return (
        <footer className="glass-dark text-slate-300 py-20 border-t border-white/10 relative overflow-hidden" dir="rtl">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="lg:col-span-1 space-y-6"
                    >
                        <img
                            src={content?.footerLogoUrl || agarkomFooterLogo}
                            alt="Real Estate CRM Logo"
                            className="h-28 w-auto object-contain brightness-0 invert opacity-90 hover:opacity-100 transition-opacity duration-300"
                        />
                        {content?.footerDescription && (
                            <p className="text-muted-foreground/70 leading-relaxed max-w-sm" style={{ lineHeight: '1.8' }}>
                                {content.footerDescription}
                            </p>
                        )}
                    </motion.div>

                    {/* Links Sections */}
                    <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-8">
                        {footerGroups.map((group, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                viewport={{ once: true }}
                            >
                                <h3 className="text-white font-black mb-6 text-lg">{group.category}</h3>
                                <ul className="space-y-4">
                                    {group.links.map((link, linkIdx) => (
                                        <li key={linkIdx}>
                                            <a
                                                href={link.url}
                                                className="text-muted-foreground/70 hover:text-white transition-colors duration-300 font-medium hover:translate-x-[-4px] inline-block"
                                            >
                                                {link.text}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Bottom Bar */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="pt-8 border-t border-slate-700/50 text-center"
                >
                    <p className="text-muted-foreground text-sm font-medium">
                        {content.footerCopyright || "© جميع الحقوق محفوظة"}
                    </p>
                </motion.div>
            </div>
        </footer>
    );
};
