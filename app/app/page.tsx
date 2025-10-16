/* app/page.tsx */
import Image from "next/image";
import LandingNav from "@/components/layout/TopNav";

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-lg border border-gray-200 dark:border-slate-700 px-2.5 py-1 text-xs font-medium
                     bg-white/70 dark:bg-slate-800/70 backdrop-blur">
      {children}
    </span>
  );
}

function NodeChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-7 items-center rounded-md border border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/60 px-2 text-xs font-semibold">
      {children}
    </span>
  );
}

function NodeCard({
  className = "",
  tone = "blue", // "blue" | "amber" | "violet"
  label,
  reg,
  value,
  prefix,
}: {
  className?: string;
  tone?: "blue" | "amber" | "violet";
  label: string;
  reg: string;
  value: string;
  prefix?: string;
}) {
  const tones: Record<string, { ring: string; fill: string; text: string }> = {
    blue:   { ring: "ring-blue-200",   fill: "bg-blue-50",   text: "text-blue-700" },
    amber:  { ring: "ring-amber-200",  fill: "bg-amber-50",  text: "text-amber-700" },
    violet: { ring: "ring-violet-200", fill: "bg-violet-50", text: "text-violet-700" },
  };

  const t = tones[tone];

  return (
    <div
      className={`rounded-xl border border-gray-200 dark:border-slate-700 bg-white shadow-sm ring-1 ${t.ring} ${className}`}
    >
      <div className={`flex items-center gap-2 px-3 py-2 ${t.fill}`}>
        <NodeChip>{prefix || ""}</NodeChip>
        <span className={`text-sm font-extrabold ${t.text}`}>{label}</span>
        <div className="flex-1" />
        <NodeChip>{reg}</NodeChip>
        <NodeChip>{value}</NodeChip>
      </div>
      {/* “pins” */}
      <div className="flex items-center justify-between px-3 pb-2 pt-1">
        <span className="h-2 w-2 rounded-full bg-gray-300" />
        <span className="h-2 w-2 rounded-full bg-gray-300" />
      </div>
    </div>
  );
}


export default function Overview() {
  return (
    <div className="w-full">
        <LandingNav />
        {/* HERO */}
        <section className="relative">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:py-24">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
                {/* LEFT */}
                    <div>
                        <h1 className="text-4xl lg:text-5xl font-black leading-tight tracking-tight">
                            Learn Assembly easier
                            <br className="hidden sm:block" />
                            <span className="block mt-1 bg-gradient-to-r from-[#8CA1FF] to-[#6E86F1] bg-clip-text text-transparent">
                                with Nodes building games
                            </span>
                        </h1>

                        <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-xl">
                            Have fun learning assembly language with us, learning in a virtual programming style
                            that simulates writing the language in a node format.
                        </p>

                        <div className="mt-6 flex flex-wrap gap-2">
                            <Chip>MOV</Chip>
                            <Chip>ADD</Chip>
                            <Chip>SUB</Chip>
                            <Chip>JMP</Chip>
                            <Chip>CMP</Chip>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <a
                                href="/class"
                                className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-white shadow hover:opacity-90"
                            >
                                Start learning
                            </a>
                            <a
                                href="/bookmark"
                                className="rounded-lg border px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-800"
                            >
                                Browse examples
                            </a>
                        </div>
                    </div>
                {/* RIGHT */}
                <div className="relative h-[420px]">
                    <Image
                        src="/images/hero_0.png"
                        alt="Hero Image"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>
            </div>
        </div>
        </section>


        {/* ABOUT ASSEMBLY */}
        <section className="relative h-[500px]">

            <div className="absolute inset-0 flex items-end justify-center pb-[20px] z-0">
                <Image
                    src="/images/bg_0.png"
                    alt="Background Illustration"
                    fill
                    className="object-contain opacity-80 pointer-events-none"
                    priority
                />
            </div>


        <div className="relative z-10 mx-auto max-w-6xl px-6 py-20">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
                {/* LEFT */}
                <div className="relative h-[420px]">
                    <Image
                        src="/images/about-assembly.png"
                        className="object-contain"
                        fill
                        priority
                        alt="About Assembly Illustration"
                    />
                </div>

                {/* RIGHT */}
                <div>
                    <h2 className="text-2xl sm:text-3xl font-semibold">
                        Title About the Assembly Language
                    </h2>
                    <p className="mt-3 text-gray-600 dark:text-gray-400">
                        Learn registers, flags, flow control and memory addressing from the ground up.
                        Our bite-sized lessons map 1:1 to the opcodes you’ll use in real code.
                    </p>
                </div>
            </div>
        </div>
        </section>


      {/* ABOUT PLATFORM */}
        <section className="relative bg-grid">
            <div className="mx-auto max-w-6xl px-6 py-20 text-center">
                <div className="max-w-3xl mx-auto">
                    {/* Title */}
                    <h2 className="text-2xl sm:text-3xl font-semibold">
                        Title about platform
                    </h2>

                    {/* Subtext */}
                    
                </div>

                {/* Node Graphic */}
                <div className="relative mt-10 flex justify-center">
                <Image
                    src="/images/MOVnode.png"  // ← ใส่ชื่อไฟล์ของคุณที่นี่ เช่น about-platform.png
                    alt="Platform Node Example"
                    width={700}
                    height={300}
                    priority
                    className="object-contain w-full max-w-xl drop-shadow-sm"
                />

                </div>
                <p className="mt-3 text-gray-600 dark:text-gray-400">
                    Drag nodes, wire data, and watch instructions execute step-by-step with
                    register visualizers. Save, share, and remix puzzles with your class.
                </p>

                {/* Chip examples */}
                {/* <div className="mt-6 flex justify-center gap-2">
                <Chip>MOV</Chip>
                <Chip>ADD</Chip>
                <Chip>JNZ</Chip>
                </div> */}
            </div>
        </section>


        <section className="relative">
            <div className="mx-auto max-w-7xl px-6 py-24">
                <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
                    {/* LEFT – Image cluster */}
                    <div className="relative w-full max-w-[560px] mx-auto lg:mx-0">
                        <div className="grid grid-cols-2 gap-6">
                        {/* TL: small square */}
                        <Image
                            src="/images/p1.png"
                            alt="Student learning"
                            width={560}
                            height={560}
                            className="h-49 w-full object-cover"
                            priority
                        />

                        {/* TR: tall portrait */}
                        <Image
                            src="/images/p2.png"
                            alt="Teacher explaining"
                            width={560}
                            height={840}
                            className="h-65 w-full object-cover rounded-[20px] "
                        />

                        {/* BL: medium landscape */}
                        <Image
                            src="/images/p3.png"
                            alt="Parent teaching child"
                            width={840}
                            height={560}
                            className="h-56 w-full object-cover"
                        />

                        {/* BR: wide landscape */}
                        <Image
                            src="/images/p4.png"
                            alt="Developers coding"
                            width={980}
                            height={560}
                            className="h-56 w-full object-cover"
                        />
                        </div>

                        {/* optional soft shadow under cluster */}
                        <div className="pointer-events-none absolute inset-x-4 -bottom-3 h-6 rounded-full bg-black/5 blur-md" />
                    </div>

                    {/* RIGHT – Text content */}
                    <div className="max-w-md mx-auto text-center lg:text-left lg:mx-0">
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                        Who is this for?
                        </h2>

                        <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">
                            Our platform is designed for anyone who wants to explore how computers really work — from
                            beginners to educators and tech enthusiasts. Learn the fundamentals of Assembly in a
                            visual, interactive way.
                        </p>

                        <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">
                            Whether you're learning for school, teaching a class, or just curious about low-level
                            programming, this platform makes it fun and engaging.
                        </p>

                        <ul className="mt-6 space-y-2 text-gray-700 dark:text-gray-300 text-sm">
                            <li>• <strong>Students</strong> — who want to build strong fundamentals in computer architecture.</li>
                            <li>• <strong>Teachers</strong> — who need visual tools for explaining low-level concepts.</li>
                            <li>• <strong>Parents & learners</strong> — who enjoy learning together through hands-on puzzles.</li>
                            <li>• <strong>Developers</strong> — who love experimenting with logic, memory, and optimization.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>



      {/* GAMEPLAY / TIMELINE */}
        {/* GAMEPLAY / TIMELINE */}
        <section className="relative bg-grid py-24">
        <div className="mx-auto max-w-6xl px-6">
            {/* Title */}
            <h2 className="text-3xl sm:text-4xl font-extrabold text-center mb-16">
            Title show the game play
            </h2>

            {/* Timeline container */}
            <div className="relative">
            {/* vertical line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-emerald-300/70 to-emerald-100/0 dark:from-emerald-400/50 dark:to-transparent transform -translate-x-1/2"></div>

            <ol className="relative space-y-24">
                {/* STEP 1 */}
                <li className="grid gap-8 lg:grid-cols-2 lg:items-center">
                <div className="hidden lg:block"></div>
                <div className="relative lg:pl-12 text-gray-700 dark:text-gray-300">
                    {/* glowing dot */}
                    <span className="absolute -left-[1.6rem] top-4 w-5 h-5 rounded-full bg-emerald-400/30 blur-md"></span>
                    <span className="absolute -left-[1.1rem] top-4 w-3 h-3 rounded-full bg-emerald-500"></span>

                    <h3 className="font-bold text-lg mb-3">01</h3>
                    <p className="mb-3 max-w-md">
                    Build your first graph by connecting instructions.
                    See live register values while the program steps.
                    </p>
                    {/* Image step 1 */}
                    <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 overflow-hidden shadow-sm">
                    <Image
                        src="/images/gameplay-1.png"
                        width={600}
                        height={400}
                        alt="Gameplay step 1"
                        className="object-contain w-full h-auto"
                        priority
                    />
                    </div>
                </div>
                </li>

                {/* STEP 2 */}
                <li className="grid gap-8 lg:grid-cols-2 lg:items-center">
                {/* Left side (image) */}
                <div className="relative lg:pr-12 text-gray-700 dark:text-gray-300">
                    <span className="absolute -right-[1.6rem] top-4 w-5 h-5 rounded-full bg-emerald-400/30 blur-md"></span>
                    <span className="absolute -right-[1.1rem] top-4 w-3 h-3 rounded-full bg-emerald-500"></span>

                    <h3 className="font-bold text-lg mb-3">02</h3>
                    <p className="mb-3 max-w-md">
                    Solve puzzle goals (output values, cycles, or memory states). Earn stars for efficient solutions.
                    </p>

                    {/* Image step 2 */}
                    <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 overflow-hidden shadow-sm">
                    <Image
                        src="/images/gameplay-2.png"
                        width={600}
                        height={400}
                        alt="Gameplay step 2"
                        className="object-contain w-full h-auto"
                    />
                    </div>
                </div>

                <div className="hidden lg:block"></div>
                </li>

                {/* STEP 3 */}
                <li className="grid gap-8 lg:grid-cols-2 lg:items-center">
                <div className="hidden lg:block"></div>
                <div className="relative lg:pl-12 text-gray-700 dark:text-gray-300">
                    <span className="absolute -left-[1.6rem] top-4 w-5 h-5 rounded-full bg-emerald-400/30 blur-md"></span>
                    <span className="absolute -left-[1.1rem] top-4 w-3 h-3 rounded-full bg-emerald-500"></span>

                    <h3 className="font-bold text-lg mb-3">03</h3>
                    <p className="mb-3 max-w-md">
                    Share your solution, compare approaches, and unlock tougher instruction sets.
                    </p>

                    {/* Image step 3 (terminal) */}
                    <div className="rounded-xl">
                    <Image
                        src="/images/terminal.png"
                        width={600}
                        height={400}
                        alt="Gameplay step 3"
                        className="object-contain w-full h-auto"
                    />
                    </div>
                </div>
                </li>
            </ol>
            </div>
        </div>
        </section>


        {/* FOOTER */}
        <footer className="bg-neutral-900 text-gray-300 py-12 mt-20">
            <div className="mx-auto max-w-7xl px-6 grid gap-10 md:grid-cols-4">
                {/* LEFT – Logo and description */}
                <div className="md:col-span-1">
                <h3 className="text-xl font-extrabold tracking-tight text-indigo-400">BLYLAB.</h3>
                <p className="mt-2 text-sm text-gray-400 max-w-xs">
                    BLYLAB – Assembly visual programming learning platform.
                </p>
                </div>

                {/* CENTER LEFT */}
                <div>
                <h4 className="text-sm font-semibold mb-3 text-gray-200">Product</h4>
                <ul className="space-y-2 text-sm">
                    <li><a href="#" className="hover:text-white">Overview</a></li>
                    <li><a href="#" className="hover:text-white">Features</a></li>
                    <li><a href="#" className="hover:text-white">Pricing</a></li>
                    <li><a href="#" className="hover:text-white">Download</a></li>
                </ul>
                </div>

                {/* CENTER RIGHT */}
                <div>
                <h4 className="text-sm font-semibold mb-3 text-gray-200">Resources</h4>
                <ul className="space-y-2 text-sm">
                    <li><a href="#" className="hover:text-white">Documentation</a></li>
                    <li><a href="#" className="hover:text-white">Community</a></li>
                    <li><a href="#" className="hover:text-white">Blog</a></li>
                    <li><a href="#" className="hover:text-white">FAQ</a></li>
                </ul>
                </div>

                {/* RIGHT – Socials */}
                <div className="flex flex-col items-start md:items-end justify-between">
                <div className="flex gap-4">
                    <a
                    href="https://github.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white"
                    >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-6 h-6"
                    >
                        <path d="M12 .297a12 12 0 00-3.8 23.4c.6.113.82-.262.82-.582v-2.234c-3.34.724-4.042-1.612-4.042-1.612a3.18 3.18 0 00-1.334-1.756c-1.09-.744.082-.729.082-.729a2.523 2.523 0 011.846 1.237 2.56 2.56 0 003.498 1 2.548 2.548 0 01.762-1.612c-2.665-.305-5.466-1.334-5.466-5.931A4.64 4.64 0 015.6 7.47a4.305 4.305 0 01.116-3.193s1.007-.322 3.3 1.23a11.41 11.41 0 016 0c2.293-1.552 3.3-1.23 3.3-1.23.458 1.125.477 2.43.116 3.193a4.64 4.64 0 011.234 3.218c0 4.61-2.8 5.622-5.47 5.922a2.853 2.853 0 01.812 2.214v3.287c0 .323.216.7.824.58A12 12 0 0012 .297z" />
                    </svg>
                    </a>
                </div>

                <p className="text-xs text-gray-500 mt-4 md:mt-8">
                    © {new Date().getFullYear()} BLYLAB. All rights reserved.
                </p>
                </div>
            </div>
        </footer>


    </div>
  );
}
