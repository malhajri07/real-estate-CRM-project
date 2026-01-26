import { LandingPageContent } from "@/lib/cms";
import agarkomFooterLogo from "@assets/6_1756507125793.png";

type FooterLinkGroup = { category: string; links: { text: string; url: string }[] };

interface LandingFooterProps {
    content: LandingPageContent;
    footerGroups: FooterLinkGroup[];
}

export const LandingFooter = ({ content, footerGroups }: LandingFooterProps) => {
    return (
        <footer className="bg-slate-900 text-slate-300 py-16 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-12">
                    {/* Brand */}
                    <div className="space-y-6">
                        <img
                            src={content?.footerLogoUrl || agarkomFooterLogo}
                            alt="عقاركم"
                            className="h-24 w-auto object-contain brightness-0 invert opacity-80"
                        />
                        {content?.footerDescription && (
                            <p className="text-slate-400 leading-relaxed max-w-sm">
                                {content.footerDescription}
                            </p>
                        )}
                    </div>

                    {/* Links */}
                    <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-8">
                        {footerGroups.map((group, idx) => (
                            <div key={idx}>
                                <h3 className="text-white font-bold mb-4">{group.category}</h3>
                                <ul className="space-y-3">
                                    {group.links.map((link, linkIdx) => (
                                        <li key={linkIdx}>
                                            <a href={link.url} className="hover:text-white transition-colors duration-200">
                                                {link.text}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom */}
                <div className="pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
                    <p>{content.footerCopyright}</p>
                </div>
            </div>
        </footer>
    );
};
