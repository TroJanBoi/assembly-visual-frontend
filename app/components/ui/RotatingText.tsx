"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RotatingText({
    texts,
    className = "",
    rotationInterval = 2000,
}: {
    texts: string[];
    className?: string;
    rotationInterval?: number;
}) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prevIndex) => (prevIndex + 1) % texts.length);
        }, rotationInterval);
        return () => clearInterval(interval);
    }, [texts, rotationInterval]);

    return (
        <motion.span
            layout
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`relative inline-flex h-[1.25em] overflow-hidden align-text-bottom ${className}`}
        >
            {/* Invisible text to drive the width */}
            <span className="opacity-0 pointer-events-none px-1 whitespace-nowrap select-none" aria-hidden="true">
                {texts[index]}
            </span>

            <AnimatePresence mode="wait">
                <motion.span
                    key={index}
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: "0%", opacity: 1 }}
                    exit={{ y: "-100%", opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="absolute inset-x-0 flex justify-center whitespace-nowrap"
                >
                    {texts[index]}
                </motion.span>
            </AnimatePresence>
        </motion.span>
    );
}
