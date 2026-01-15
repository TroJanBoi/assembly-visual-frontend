import { motion } from "framer-motion";
import { SiNextdotjs, SiTailwindcss, SiReact, SiGo, SiPostgresql } from "react-icons/si";
import { FaDiagramProject, FaCode } from "react-icons/fa6"; // Using FaDiagramProject for React Flow and Code for React Bits

const logos = [
    { icon: SiNextdotjs, name: "Next.js", color: "text-slate-900" },
    { icon: SiTailwindcss, name: "Tailwind CSS", color: "text-cyan-600" },
    { icon: FaDiagramProject, name: "React Flow", color: "text-pink-600" }, // Proxy for React Flow
    { icon: FaCode, name: "React Bits", color: "text-amber-500" }, // Proxy for React Bits
    { icon: SiGo, name: "Go", color: "text-cyan-700" },
    { icon: SiPostgresql, name: "PostgreSQL", color: "text-blue-700" },
];

export default function LogoWall() {
    return (
        <div className="relative flex w-full flex-col items-center justify-center overflow-hidden bg-transparent py-2">
            <div className="flex w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]">
                <motion.div
                    animate={{ x: "-50%" }}
                    transition={{
                        duration: 40,
                        ease: "linear",
                        repeat: Infinity,
                    }}
                    className="flex flex-none gap-16 pr-16"
                >
                    {/* Render 4 sets of logos to ensure seamless loop on wide screens */}
                    {[...new Array(4)].fill(logos).flat().map((logo, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-2 transition-all hover:opacity-80"
                        >
                            <logo.icon className={`h-8 w-8 ${logo.color}`} />
                            <span className="text-lg font-semibold text-slate-600">
                                {logo.name}
                            </span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
