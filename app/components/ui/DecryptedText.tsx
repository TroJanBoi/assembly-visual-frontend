"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";

interface DecryptedTextProps {
    text: string;
    speed?: number;
    maxIterations?: number;
    sequential?: boolean;
    revealDirection?: "start" | "end" | "center";
    useOriginalCharsOnly?: boolean;
    characters?: string;
    className?: string;
    parentClassName?: string;
    animateOn?: "view" | "hover";
    [key: string]: any;
}

export default function DecryptedText({
    text,
    speed = 50,
    maxIterations = 10,
    sequential = false,
    revealDirection = "start",
    useOriginalCharsOnly = false,
    characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+",
    className = "",
    parentClassName = "",
    animateOn = "hover",
    ...props
}: DecryptedTextProps) {
    const [displayText, setDisplayText] = useState(text);
    const [isHovering, setIsHovering] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const ref = useRef<HTMLElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-10px" });

    useEffect(() => {
        let interval: NodeJS.Timeout;
        let currentIteration = 0;

        const getNextChar = (char: string) => {
            if (useOriginalCharsOnly) {
                return text[Math.floor(Math.random() * text.length)];
            }
            return characters[Math.floor(Math.random() * characters.length)];
        };

        const runAnimation = () => {
            if (currentIteration >= maxIterations) {
                setDisplayText(text);
                return;
            }

            setDisplayText((prev) =>
                prev
                    .split("")
                    .map((char, index) => {
                        if (char === " ") return " ";
                        if (sequential) {
                            // Logic for sequential reveal could be added here
                            // keeping simple for this implementation
                            return Math.random() < 0.1 ? text[index] : getNextChar(char);
                        }
                        return Math.random() < 0.1 ? text[index] : getNextChar(char);
                    })
                    .join("")
            );
            currentIteration++;
        };

        // Trigger logic
        if (animateOn === "view" && isInView && !isScrolled) {
            interval = setInterval(runAnimation, speed);
            // Stop after some time to ensure it settles
            setTimeout(() => { clearInterval(interval); setDisplayText(text); setIsScrolled(true); }, speed * maxIterations);
        } else if (animateOn === "hover" && isHovering) {
            interval = setInterval(runAnimation, speed);
            // Stop
            setTimeout(() => { clearInterval(interval); setDisplayText(text); }, speed * maxIterations);
        } else {
            setDisplayText(text); // Reset
        }

        return () => clearInterval(interval);
    }, [text, speed, maxIterations, sequential, revealDirection, useOriginalCharsOnly, characters, animateOn, isInView, isHovering, isScrolled]);

    return (
        <span
            ref={ref as any}
            className={`${parentClassName}`}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            {...props}
        >
            <span className={className}>{displayText}</span>
        </span>
    );
}
