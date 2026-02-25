"use client";

import { useEffect, useRef } from "react";

export function CyberMouseBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouse = useRef({ x: 0.5, y: 0.5 });
    const target = useRef({ x: 0.5, y: 0.5 });
    const rafRef = useRef<number>(0);

    useEffect(() => {
        // Respect prefers-reduced-motion
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        const onMove = (e: MouseEvent) => {
            target.current.x = e.clientX / window.innerWidth;
            target.current.y = e.clientY / window.innerHeight;
        };
        window.addEventListener("mousemove", onMove);

        // Grid dots
        const GRID = 48;

        const draw = () => {
            const W = canvas.width;
            const H = canvas.height;

            // Smooth lerp
            if (!reduced) {
                mouse.current.x += (target.current.x - mouse.current.x) * 0.06;
                mouse.current.y += (target.current.y - mouse.current.y) * 0.06;
            }

            ctx.clearRect(0, 0, W, H);

            // ── Base background ──
            ctx.fillStyle = "#070A18";
            ctx.fillRect(0, 0, W, H);

            // ── Grid lines ──
            ctx.strokeStyle = "rgba(255,255,255,0.04)";
            ctx.lineWidth = 1;
            for (let x = 0; x < W; x += GRID) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
            }
            for (let y = 0; y < H; y += GRID) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
            }

            // ── Grid intersection dots ──
            for (let x = 0; x < W; x += GRID) {
                for (let y = 0; y < H; y += GRID) {
                    const dx = x / W - mouse.current.x;
                    const dy = y / H - mouse.current.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const alpha = Math.max(0, 0.35 - dist * 1.2);
                    ctx.beginPath();
                    ctx.arc(x, y, 1.2, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(0,240,255,${alpha})`;
                    ctx.fill();
                }
            }

            // ── Cursor radial glow (cyan) ──
            const cx = mouse.current.x * W;
            const cy = mouse.current.y * H;
            const r1 = Math.max(W, H) * 0.45;
            const g1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, r1);
            g1.addColorStop(0, "rgba(0,240,255,0.13)");
            g1.addColorStop(0.4, "rgba(0,240,255,0.04)");
            g1.addColorStop(1, "transparent");
            ctx.fillStyle = g1;
            ctx.fillRect(0, 0, W, H);

            // ── Static violet glow (top-right) ──
            const g2 = ctx.createRadialGradient(W * 0.85, H * 0.1, 0, W * 0.85, H * 0.1, W * 0.5);
            g2.addColorStop(0, "rgba(122,95,255,0.12)");
            g2.addColorStop(1, "transparent");
            ctx.fillStyle = g2;
            ctx.fillRect(0, 0, W, H);

            // ── Static cyan glow (bottom-left) ──
            const g3 = ctx.createRadialGradient(W * 0.1, H * 0.9, 0, W * 0.1, H * 0.9, W * 0.4);
            g3.addColorStop(0, "rgba(0,240,255,0.08)");
            g3.addColorStop(1, "transparent");
            ctx.fillStyle = g3;
            ctx.fillRect(0, 0, W, H);

            rafRef.current = requestAnimationFrame(draw);
        };

        rafRef.current = requestAnimationFrame(draw);

        return () => {
            cancelAnimationFrame(rafRef.current);
            window.removeEventListener("resize", resize);
            window.removeEventListener("mousemove", onMove);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="pointer-events-none fixed inset-0 -z-10"
            aria-hidden="true"
        />
    );
}
