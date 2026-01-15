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

const Section = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
    return (
        <section className={`relative h-screen w-full snap-start overflow-hidden flex flex-col items-center justify-center ${className}`}>
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
        <div className="w-full h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-slate-50 text-slate-900 selection:bg-indigo-500/30 font-sans">
            {/* ProgressBar */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1 bg-indigo-600 origin-left z-[60]"
                style={{ scaleX }}
            />

            <div className="fixed top-0 left-0 w-full z-50">
                <LandingNav />
            </div>

            {/* SECTION 1: HERO (Pixel Blast Background) */}
            <Section className="bg-slate-50">
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
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-200 bg-white/50 backdrop-blur-sm text-indigo-700 text-xs font-medium uppercase tracking-wider mb-4 shadow-sm pointer-events-auto"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                        </span>
                        Assembly Visual v1.0
                    </motion.div>

                    <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 mb-[-0.2em] flex flex-col items-center gap-2">
                        {/* React Bits: Decrypted Text */}
                        <div className="pointer-events-auto">
                            <DecryptedText
                                text="Assembly Visual"
                                animateOn="view"
                                speed={70}
                                className="bg-clip-text text-transparent bg-gradient-to-br from-slate-900 via-slate-700 to-slate-900 pb-2"
                            />
                        </div>

                        {/* React Bits: Rotating Text */}
                        <div className="pt-3 text-4xl md:text-6xl text-indigo-600 flex items-center gap-3 pointer-events-auto">
                            <span className="text-slate-400 font-bold opacity-80">with</span>
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
                        className="mt-8 text-lg text-slate-600 max-w-2xl leading-relaxed font-medium pointer-events-auto"
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
                            className="group relative px-8 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 transform skew-y-12" />
                            <span className="relative flex items-center gap-2">
                                Start Coding <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                            </span>
                        </button>
                        <button
                            onClick={checkKey}
                            className="px-8 py-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-lg transition-all shadow-sm hover:shadow"
                        >
                            View Examples
                        </button>
                    </motion.div>
                </div>

                {/* Tech Stack Logo Wall */}
                <div className="absolute bottom-0 w-full z-20 pointer-events-auto">
                    <LogoWall />
                </div>
            </Section>

            {/* SECTION 2: FEATURES (Spotlight Cards) */}
            <Section className="bg-white relative">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:40px_40px]"></div>

                <div className="relative z-10 max-w-7xl mx-auto px-6 w-full pointer-events-none">
                    {/* Spotlight cards need pointer events */}
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Why Visual Assembly?</h2>
                        <p className="text-slate-500 max-w-2xl mx-auto">Because staring at hex dumps isn't fun. We turned the CPU into a playground.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 pointer-events-auto">
                        {/* Card 1 */}
                        <SpotlightCard className="p-8 h-full" spotlightColor="rgba(99, 102, 241, 0.1)">
                            <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6">
                                <Cpu size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">CPU Simulation</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">
                                Watch AX, BX, and PC registers update instantly as you step through code.
                            </p>
                        </SpotlightCard>

                        {/* Card 2 */}
                        <SpotlightCard className="p-8 h-full" spotlightColor="rgba(236, 72, 153, 0.1)">
                            <div className="h-12 w-12 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600 mb-6">
                                <Brain size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Memory Visualized</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">
                                See stack frames grow and variables change value in real-time memory maps.
                            </p>
                        </SpotlightCard>

                        {/* Card 3 */}
                        <SpotlightCard className="p-8 h-full" spotlightColor="rgba(16, 185, 129, 0.1)">
                            <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-6">
                                <Layers size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Node Graph</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">
                                Connect instructions logically. No more syntax errors from typos.
                            </p>
                        </SpotlightCard>

                        {/* Card 4 */}
                        <SpotlightCard className="p-8 h-full" spotlightColor="rgba(245, 158, 11, 0.1)">
                            <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 mb-6">
                                <Zap size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Instant Feedback</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">
                                Errors are highlighted immediately on the graph. Debugging made simple.
                            </p>
                        </SpotlightCard>
                    </div>
                </div>
            </Section>

            {/* SECTION 3: INTERACTIVE DEMO (Screenshot/Animation) */}
            <Section className="bg-slate-50">
                <div className="absolute inset-0 bg-white/40" />

                <div className="relative z-10 container mx-auto px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-4xl md:text-5xl font-black mb-6 text-slate-900">Experience the Flow</h2>
                        <p className="text-slate-600 text-xl max-w-2xl mx-auto mb-12">
                            Connect instructions together. Set your inputs. Watch the logic unfold.
                        </p>
                    </motion.div>

                    <div className="relative max-w-5xl mx-auto h-[50vh] min-h-[400px]">
                        {/* Mock Interface Container - Light Mode */}
                        <div className="absolute inset-0 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xl flex flex-col ring-1 ring-slate-900/5">
                            {/* Toolbar Mock */}
                            <div className="h-12 border-b border-slate-100 bg-slate-50/50 backdrop-blur flex items-center px-4 gap-3 justify-between">
                                <div className="flex gap-2">
                                    <div className="h-3 w-3 rounded-full bg-red-400/80" />
                                    <div className="h-3 w-3 rounded-full bg-amber-400/80" />
                                    <div className="h-3 w-3 rounded-full bg-green-400/80" />
                                </div>
                                <div className="h-6 w-32 bg-slate-200/50 rounded-full" />
                            </div>
                            {/* Content Mock */}
                            <div className="flex-1 relative bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-slate-50 flex items-center justify-center p-8 overflow-hidden">
                                {/* Grid Background */}
                                <div className="absolute inset-0 opacity-[0.05] bg-[size:20px_20px] bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)]" />

                                {/* Floating Nodes Animation */}
                                <motion.div
                                    drag
                                    animate={{ x: [-50, 0, -50], y: [-20, 0, -20] }}
                                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute left-[20%] top-[30%] cursor-grab active:cursor-grabbing"
                                >
                                    <div className="px-5 py-3 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-indigo-100 text-indigo-700 font-mono font-bold flex items-center gap-3">
                                        <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                                        MOV AX, 5
                                    </div>
                                </motion.div>

                                <svg className="absolute inset-0 pointer-events-none w-full h-full filter drop-shadow-sm">
                                    <motion.path
                                        d="M 350 220 C 450 220 450 400 550 400"
                                        stroke="#cbd5e1"
                                        strokeWidth="3"
                                        fill="none"
                                    />
                                    <motion.path
                                        d="M 350 220 C 450 220 450 400 550 400"
                                        stroke="#6366f1"
                                        strokeWidth="3"
                                        fill="none"
                                        initial={{ pathLength: 0 }}
                                        whileInView={{ pathLength: 1 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    />
                                    <circle cx="550" cy="400" r="4" fill="#6366f1" />
                                    <circle cx="350" cy="220" r="4" fill="#cbd5e1" />
                                </svg>

                                <motion.div
                                    drag
                                    animate={{ x: [50, 0, 50], y: [20, 0, 20] }}
                                    transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                    className="absolute right-[20%] bottom-[30%] cursor-grab active:cursor-grabbing"
                                >
                                    <div className="px-5 py-3 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-purple-100 text-purple-700 font-mono font-bold flex items-center gap-3">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full" />
                                        ADD AX, BX
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </div>
            </Section>

            {/* SECTION 4: FOOTER */}
            <Section className="bg-slate-50 h-[50vh] min-h-[400px]">
                <div className="w-full max-w-7xl px-6 grid gap-10 md:grid-cols-4 items-start">
                    <div className="md:col-span-1">
                        <h3 className="text-2xl font-black text-slate-900">BLYLAB<span className="text-indigo-600">.</span></h3>
                        <p className="mt-4 text-sm text-slate-500 leading-relaxed">
                            Empowering the next generation of systems programmers with visual learning tools.
                        </p>
                    </div>
                </div>
                <div className="mt-20 text-slate-400 text-sm">
                    © {new Date().getFullYear()} Assembly Visual. All rights reserved.
                </div>
            </Section>
        </div>
    );
}
