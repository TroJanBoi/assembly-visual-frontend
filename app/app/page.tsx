"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { motion, useScroll, useSpring } from "framer-motion";
import LandingNav from "@/components/layout/TopNav";
import { Loader2, Cpu, Grid, PlayCircle, Code2, ArrowRight, Zap, Users, Brain, Layers } from "lucide-react";

// React Bits Components
import DecryptedText from "@/components/ui/DecryptedText";
import RotatingText from "@/components/ui/RotatingText";
import SpotlightCard from "@/components/ui/SpotlightCard";
import PixelBackground from "@/components/ui/PixelBackground";
import PixelBlast from "@/components/ui/LandingPage/PixelBlast";
import DarkVeil from "@/components/ui/LandingPage/DarkVeil";
import LogoWall from "@/components/ui/LandingPage/LogoWall";
import Footer from "@/components/layout/Footer";
import InteractiveDemo from "@/components/ui/LandingPage/InteractiveDemo";
import ProfileCard from "@/components/ui/LandingPage/ProfileCard";

// --- Logic ---
function checkKey() {
    if (typeof window !== "undefined") {
        if (localStorage.getItem("authToken") == null) {
            window.location.href = "/signin";
        } else {
            window.location.href = "/class";
        }
    }
}

// --- Components ---

const Section = ({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) => {
    return (
        <section id={id} className={`relative h-screen h-[100dvh] w-full snap-start overflow-hidden flex flex-col items-center justify-center ${className}`}>
            {children}
        </section>
    );
};

// --- Main Page ---

export default function Overview() {
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    return (
        <div className="w-full h-screen h-[100dvh] overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-indigo-500/30 font-sans">
            {/* ProgressBar */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1 bg-indigo-600 origin-left z-[60]"
                style={{ scaleX }}
            />

            <div className="fixed top-0 left-0 w-full z-50">
                <LandingNav />
            </div>

            {/* SECTION 1: HERO (Pixel Blast Background) */}
            <Section className="bg-slate-50 dark:bg-slate-950">
                {/* Pixel Blast Effect */}
                <div className=" absolute inset-0 z-0">
                    <DarkVeil />
                </div>

                {/* Light Gradient Overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(99,102,241,0.1),rgba(255,255,255,0))] pointer-events-none z-0" />

                <div className="relative z-10 max-w-6xl mx-auto px-6 text-center flex flex-col items-center gap-8 pointer-events-none">
                    {/* Allow pointer events for buttons */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm text-indigo-700 dark:text-indigo-400 text-xs font-medium uppercase tracking-wider mb-4 shadow-sm pointer-events-auto"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                        </span>
                        BLYLAB. v1.0
                    </motion.div>

                    <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 dark:text-white mb-[-0.2em] flex flex-col items-center gap-2">
                        {/* React Bits: Decrypted Text */}
                        <div className="pointer-events-auto">
                            <DecryptedText
                                text="Assembly Visual"
                                animateOn="view"
                                speed={70}
                                className="bg-clip-text text-transparent bg-gradient-to-br from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-slate-400 pb-2"
                            />
                        </div>

                        {/* React Bits: Rotating Text */}
                        <div className="pt-3 text-4xl md:text-6xl text-indigo-600 dark:text-indigo-400 flex items-center gap-3 pointer-events-auto">
                            <span className="text-slate-400 dark:text-slate-500 font-bold opacity-80">with</span>
                            <RotatingText
                                texts={["Visual Nodes", "Real-time CPU", "Memory Maps", "Interactive Graphs"]}
                                rotationInterval={2500}
                                className="p-2"
                            />
                        </div>
                    </h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1, duration: 0.8 }}
                        className="mt-8 text-lg text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed font-medium pointer-events-auto"
                    >
                        Visualize registers, memory, and valid architecture instruction flow.
                        The modern way to learn low-level programming.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2, duration: 0.8 }}
                        className="mt-10 flex flex-wrap gap-4 justify-center pointer-events-auto"
                    >
                        <button
                            onClick={checkKey}
                            className="group relative px-8 py-4 rounded-xl bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white font-bold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 transform skew-y-12" />
                            <span className="relative flex items-center gap-2">
                                Start Coding <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                            </span>
                        </button>
                        <button
                            onClick={checkKey}
                            className="px-8 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-lg transition-all shadow-sm hover:shadow"
                        >
                            View Examples
                        </button>
                    </motion.div>
                </div>

                {/* Tech Stack Logo Wall */}
                <div className="absolute bottom-0 w-full z-20 pointer-events-auto py-12">
                    <LogoWall />
                </div>
            </Section>

            {/* SECTION 2: FEATURES (Spotlight Cards) */}
            <Section className="bg-white dark:bg-slate-950 relative" id="features">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px]"></div>

                <div className="relative z-10 max-w-7xl mx-auto px-6 w-full pointer-events-none">
                    {/* Spotlight cards need pointer events */}
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Why Visual Assembly?</h2>
                        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">Because staring at hex dumps isn't fun. We turned the CPU into a playground.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 pointer-events-auto">
                        {/* Card 1 */}
                        <SpotlightCard className="p-8 h-full" spotlightColor="rgba(99, 102, 241, 0.1)">
                            <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6">
                                <Cpu size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">CPU Simulation</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                Watch AX, BX, and PC registers update instantly as you step through code.
                            </p>
                        </SpotlightCard>

                        {/* Card 2 */}
                        <SpotlightCard className="p-8 h-full" spotlightColor="rgba(236, 72, 153, 0.1)">
                            <div className="h-12 w-12 rounded-xl bg-pink-50 dark:bg-pink-900/20 flex items-center justify-center text-pink-600 dark:text-pink-400 mb-6">
                                <Brain size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Memory Visualized</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                See stack frames grow and variables change value in real-time memory maps.
                            </p>
                        </SpotlightCard>

                        {/* Card 3 */}
                        <SpotlightCard className="p-8 h-full" spotlightColor="rgba(16, 185, 129, 0.1)">
                            <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6">
                                <Layers size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Node Graph</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                Connect instructions logically. No more syntax errors from typos.
                            </p>
                        </SpotlightCard>

                        {/* Card 4 */}
                        <SpotlightCard className="p-8 h-full" spotlightColor="rgba(245, 158, 11, 0.1)">
                            <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-6">
                                <Zap size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Instant Feedback</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                Errors are highlighted immediately on the graph. Debugging made simple.
                            </p>
                        </SpotlightCard>
                    </div>
                </div>
            </Section>

            {/* SECTION 3: INTERACTIVE DEMO (Screenshot/Animation) */}
            <Section className="bg-slate-50 dark:bg-slate-950" id="demo">
                <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/30" />

                <div className="relative z-10 container mx-auto px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-4xl md:text-5xl font-black mb-6 text-slate-900 dark:text-white">Experience the Flow</h2>
                        <p className="text-slate-600 dark:text-slate-400 text-xl max-w-2xl mx-auto mb-12">
                            Connect instructions together. Set your inputs. Watch the logic unfold.
                        </p>
                    </motion.div>

                    <div className="relative max-w-5xl mx-auto h-[50vh] min-h-[400px]">
                        {/* Mock Interface Container - Light Mode */}
                        <div className="absolute inset-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl flex flex-col ring-1 ring-slate-900/5 dark:ring-white/10">
                            {/* Toolbar Mock */}
                            <div className="h-12 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur flex items-center px-4 gap-3 justify-between">
                                <div className="flex gap-2">
                                    <div className="h-3 w-3 rounded-full bg-red-400/80" />
                                    <div className="h-3 w-3 rounded-full bg-amber-400/80" />
                                    <div className="h-3 w-3 rounded-full bg-green-400/80" />
                                </div>
                                <div className="h-6 w-32 bg-slate-200/50 dark:bg-slate-700/50 rounded-full" />
                            </div>
                            {/* Content - Real Component */}
                            <div className="flex-1 relative bg-white dark:bg-slate-950">
                                <InteractiveDemo />
                            </div>
                        </div>
                    </div>
                </div>
            </Section>

            {/* SECTION 4: FOOTER & PROFILE */}
            <Section className="h-auto bg-slate-950 flex flex-col " id="team">
                <div className="w-full flex flex-col items-center py-20 relative z-20 px-6">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 text-center">Meet the Team</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto w-full">
                        {/* Profile 1 */}
                        <div className="flex justify-center">
                            <ProfileCard
                                name="Prakan Suma"
                                title="Fontend Developer"
                                handle="prakan"
                                status="Building"
                                contactText="Facebook"
                                contactUrl="https://web.facebook.com/porddavitz/"
                                avatarUrl="/images/team3.png"
                                showUserInfo={true}
                                enableTilt={true}
                                enableMobileTilt={false}
                            />
                        </div>

                        {/* Profile 2 */}
                        <div className="flex justify-center">
                            <ProfileCard
                                name="Peerapol Srisawat"
                                title="Backend Developer"
                                handle="Peerapol"
                                status="Building"
                                contactText="Facebook"
                                contactUrl="https://web.facebook.com/love.za.50"
                                avatarUrl="/images/team1.jpg"
                                showUserInfo={true}
                                enableTilt={true}
                                enableMobileTilt={false}
                            />
                        </div>

                        {/* Profile 3 */}
                        <div className="flex justify-center">
                            <ProfileCard
                                name="Patipan Duangdao"
                                title="CEO & Product Manager"
                                handle="Patipan"
                                status="Online"
                                contactText="Facebook"
                                contactUrl="https://web.facebook.com/ptiphan.dwngdaw"
                                avatarUrl="/images/team2.jpg"
                                showUserInfo={true}
                                enableTilt={true}
                                enableMobileTilt={false}
                            />
                        </div>
                    </div>
                </div>
                <div className="w-full">
                    <Footer />
                </div>
            </Section>
        </div>
    );
}
