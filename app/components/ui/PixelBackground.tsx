"use client";

import React, { useEffect, useRef } from "react";

interface PixelBackgroundProps {
    pixelSize?: number;
    fadeSpeed?: number;
    color?: string;
    className?: string;
}

export default function PixelBackground({
    pixelSize = 40,
    fadeSpeed = 0.05,
    color = "#3b82f6", // Blue-500
    className = "",
}: PixelBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gridRef = useRef<number[]>([]);
    const mouseRef = useRef({ x: -1000, y: -1000 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let cols = 0;
        let rows = 0;

        const init = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            cols = Math.ceil(canvas.width / pixelSize);
            rows = Math.ceil(canvas.height / pixelSize);
            gridRef.current = new Array(cols * rows).fill(0);
        };

        const draw = () => {
            // Clear with slight fade for trail effect if desired, but here we perform grid logic
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Mouse interaction
            const mx = mouseRef.current.x;
            const my = mouseRef.current.y;

            // Calculate cursor grid position
            if (mx >= 0 && my >= 0) {
                const col = Math.floor(mx / pixelSize);
                const row = Math.floor(my / pixelSize);

                // Blast radius indices
                const radius = 2;
                for (let r = -radius; r <= radius; r++) {
                    for (let c = -radius; c <= radius; c++) {
                        const targetCol = col + c;
                        const targetRow = row + r;

                        if (targetCol >= 0 && targetCol < cols && targetRow >= 0 && targetRow < rows) {
                            const distance = Math.sqrt(c * c + r * r);
                            if (distance <= radius) {
                                const index = targetRow * cols + targetCol;
                                // Set opacity based on distance (closer = higher)
                                const intensity = 1 - (distance / (radius + 1));
                                if (gridRef.current[index] < intensity) {
                                    gridRef.current[index] = intensity;
                                }
                            }
                        }
                    }
                }
            }

            // Render Grid
            for (let i = 0; i < gridRef.current.length; i++) {
                let opacity = gridRef.current[i];
                if (opacity > 0) {
                    const c = i % cols;
                    const r = Math.floor(i / cols);

                    ctx.fillStyle = color;
                    ctx.globalAlpha = opacity;
                    ctx.fillRect(c * pixelSize, r * pixelSize, pixelSize - 1, pixelSize - 1); // -1 for gap

                    // Decay
                    gridRef.current[i] = Math.max(0, opacity - fadeSpeed);
                }
            }

            ctx.globalAlpha = 1.0;
            animationFrameId = requestAnimationFrame(draw);
        };

        const handleResize = () => {
            init();
        };

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        };

        const handleMouseLeave = () => {
            mouseRef.current = { x: -1000, y: -1000 };
        }

        init();
        draw();

        window.addEventListener("resize", handleResize);
        // Attach mouse events to window or parent if you want it to work even if covered by text
        // But attaching to canvas is fine if it is z-index 0 and text is pointer-events-none or carefully placed
        // Better: attach to parent or window if canvas is background
        window.addEventListener("mousemove", handleMouseMove);

        return () => {
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("mousemove", handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, [pixelSize, fadeSpeed, color]);

    return (
        <canvas
            ref={canvasRef}
            className={`pointer-events-none ${className}`}
            style={{ width: '100%', height: '100%' }}
        />
    );
}
