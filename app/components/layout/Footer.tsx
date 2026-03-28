"use client";

import Link from "next/link";
import { useScroll, useTransform, motion } from "framer-motion";
import { useRef } from "react";
import { Github, Twitter, Disc, ArrowRight, Heart } from "lucide-react";
import { FaDiscord, FaGithub, FaTwitter, FaXTwitter } from "react-icons/fa6";

export default function Footer() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end end"]
    });

    const y = useTransform(scrollYProgress, [0, 1], [-100, 0]);

    return (
        <footer className="bg-slate-950 text-slate-300 py-20 relative overflow-hidden" ref={containerRef}>
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent opacity-50" />
            <div className="absolute -top-[100px] left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
                    {/* Brand Column */}
                    <div className="md:col-span-5 space-y-6">
                        <Link href="/" className="inline-block">
                            <h2 className="text-3xl font-black text-white tracking-tight">
                                BLYLAB<span className="text-indigo-500">.</span>
                            </h2>
                        </Link>
                        <p className="text-slate-400 leading-relaxed max-w-sm">
                            Empowering the next generation of systems programmers with visual learning tools.
                            See the invisible, understand the machine.
                        </p>
                        <div className="flex items-center gap-4 pt-2">
                            <SocialLink href="https://github.com" icon={<FaGithub size={20} />} label="GitHub" />
                            <SocialLink href="https://twitter.com" icon={<FaXTwitter size={20} />} label="Twitter" />
                            <SocialLink href="https://discord.com" icon={<FaDiscord size={20} />} label="Discord" />
                        </div>
                    </div>

                    {/* Links Columns */}
                    <div className="md:col-span-2 space-y-6">
                        <h4 className="text-white font-bold text-lg">Product</h4>
                        <ul className="space-y-3 text-sm">
                            <FooterLink href="#">Features</FooterLink>
                            <FooterLink href="#">Integrations</FooterLink>
                            <FooterLink href="#">Pricing</FooterLink>
                            <FooterLink href="#">Changelog</FooterLink>
                        </ul>
                    </div>

                    <div className="md:col-span-2 space-y-6">
                        <h4 className="text-white font-bold text-lg">Resources</h4>
                        <ul className="space-y-3 text-sm">
                            <FooterLink href="#">Documentation</FooterLink>
                            <FooterLink href="#">API Reference</FooterLink>
                            <FooterLink href="#">Community</FooterLink>
                            <FooterLink href="#">Blog</FooterLink>
                        </ul>
                    </div>

                    {/* Newsletter Column */}
                    <div className="md:col-span-3 space-y-6">
                        <h4 className="text-white font-bold text-lg">Stay Updated</h4>
                        <p className="text-sm text-slate-400">
                            Get the latest updates on new instructions and features.
                        </p>
                        <form className="flex flex-col gap-3">
                            <div className="relative">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-white placeholder:text-slate-600"
                                />
                            </div>
                            <button className="w-full bg-white text-slate-950 font-bold py-2.5 rounded-lg hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 text-sm">
                                Subscribe <ArrowRight size={16} />
                            </button>
                        </form>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
                    <p>© {new Date().getFullYear()} Assembly Visual. All rights reserved.</p>
                    <div className="flex items-center gap-6">
                        <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}

function SocialLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <a
            href={href}
            aria-label={label}
            className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-indigo-500/50 hover:bg-slate-800 transition-all hover:-translate-y-1"
        >
            {icon}
        </a>
    );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <li>
            <Link href={href} className="text-slate-400 hover:text-white hover:pl-1 transition-all">
                {children}
            </Link>
        </li>
    );
}
