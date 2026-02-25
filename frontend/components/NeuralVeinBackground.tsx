"use client";

import { useEffect, useRef } from "react";

interface Node {
    x: number; y: number;
    vx: number; vy: number;
    r: number;
    pulse: number;
    pulseSpeed: number;
}

interface Packet {
    from: number; to: number;
    t: number; speed: number;
}

export function NeuralVeinBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouse = useRef({ x: -9999, y: -9999 });
    const rafRef = useRef<number>(0);

    useEffect(() => {
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let W = 0, H = 0;
        const nodes: Node[] = [];
        const packets: Packet[] = [];
        const MAX_DIST = 180;
        const NODE_COUNT = 55;

        const resize = () => {
            W = canvas.width = window.innerWidth;
            H = canvas.height = window.innerHeight;
            nodes.length = 0;
            for (let i = 0; i < NODE_COUNT; i++) {
                nodes.push({
                    x: Math.random() * W,
                    y: Math.random() * H,
                    vx: (Math.random() - 0.5) * 0.35,
                    vy: (Math.random() - 0.5) * 0.35,
                    r: Math.random() * 2.5 + 1.2,
                    pulse: Math.random() * Math.PI * 2,
                    pulseSpeed: 0.02 + Math.random() * 0.02,
                });
            }
        };
        resize();
        window.addEventListener("resize", resize);

        const onMove = (e: MouseEvent) => {
            mouse.current.x = e.clientX;
            mouse.current.y = e.clientY;
        };
        window.addEventListener("mousemove", onMove);

        // Spawn data packets periodically
        let packetTimer = 0;
        const spawnPacket = () => {
            if (nodes.length < 2) return;
            const from = Math.floor(Math.random() * nodes.length);
            let to = Math.floor(Math.random() * nodes.length);
            while (to === from) to = Math.floor(Math.random() * nodes.length);
            packets.push({ from, to, t: 0, speed: 0.008 + Math.random() * 0.006 });
        };

        const draw = (ts: number) => {
            ctx.clearRect(0, 0, W, H);

            // ── Base ──
            ctx.fillStyle = "#070A18";
            ctx.fillRect(0, 0, W, H);

            // ── Subtle grid ──
            ctx.strokeStyle = "rgba(255,255,255,0.028)";
            ctx.lineWidth = 1;
            const GRID = 52;
            for (let x = 0; x < W; x += GRID) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
            for (let y = 0; y < H; y += GRID) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

            // ── Moving gradient behind center ──
            const cx = W / 2, cy = H / 2;
            const t = ts * 0.0003;
            const ox = Math.sin(t) * 60, oy = Math.cos(t * 0.7) * 40;
            const gCenter = ctx.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, Math.max(W, H) * 0.45);
            gCenter.addColorStop(0, "rgba(0,240,255,0.09)");
            gCenter.addColorStop(0.5, "rgba(122,95,255,0.05)");
            gCenter.addColorStop(1, "transparent");
            ctx.fillStyle = gCenter;
            ctx.fillRect(0, 0, W, H);

            // ── Mouse glow ──
            const mx = mouse.current.x, my = mouse.current.y;
            if (mx > 0) {
                const gMouse = ctx.createRadialGradient(mx, my, 0, mx, my, 280);
                gMouse.addColorStop(0, "rgba(0,240,255,0.12)");
                gMouse.addColorStop(1, "transparent");
                ctx.fillStyle = gMouse;
                ctx.fillRect(0, 0, W, H);
            }

            if (!reduced) {
                // ── Move nodes ──
                for (const n of nodes) {
                    // Magnetic attraction to mouse
                    const dx = mx - n.x, dy = my - n.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 200 && dist > 0) {
                        const force = (200 - dist) / 200 * 0.012;
                        n.vx += dx / dist * force;
                        n.vy += dy / dist * force;
                    }
                    n.vx *= 0.98; n.vy *= 0.98;
                    n.x += n.vx; n.y += n.vy;
                    n.pulse += n.pulseSpeed;
                    if (n.x < 0) { n.x = 0; n.vx *= -1; }
                    if (n.x > W) { n.x = W; n.vx *= -1; }
                    if (n.y < 0) { n.y = 0; n.vy *= -1; }
                    if (n.y > H) { n.y = H; n.vy *= -1; }
                }
            }

            // ── Draw veins (edges) ──
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const a = nodes[i], b = nodes[j];
                    const dx = b.x - a.x, dy = b.y - a.y;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    if (d > MAX_DIST) continue;

                    const alpha = (1 - d / MAX_DIST) * 0.55;

                    // Mouse proximity boost
                    const mdx = mx - (a.x + b.x) / 2, mdy = my - (a.y + b.y) / 2;
                    const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
                    const boost = Math.max(0, 1 - mDist / 250) * 0.5;

                    // Gradient vein line
                    const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
                    const c1 = `rgba(0,240,255,${alpha + boost})`;
                    const c2 = `rgba(122,95,255,${(alpha + boost) * 0.7})`;
                    grad.addColorStop(0, c1);
                    grad.addColorStop(0.5, c2);
                    grad.addColorStop(1, c1);

                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.strokeStyle = grad;
                    ctx.lineWidth = 0.8 + boost * 1.5;
                    ctx.stroke();
                }
            }

            // ── Draw data packets ──
            packetTimer++;
            if (packetTimer % 40 === 0 && packets.length < 18) spawnPacket();

            for (let i = packets.length - 1; i >= 0; i--) {
                const p = packets[i];
                p.t += p.speed;
                if (p.t >= 1) { packets.splice(i, 1); continue; }

                const a = nodes[p.from], b = nodes[p.to];
                const dx = b.x - a.x, dy = b.y - a.y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d > MAX_DIST * 1.5) { packets.splice(i, 1); continue; }

                const px = a.x + dx * p.t;
                const py = a.y + dy * p.t;

                // Packet glow
                const pg = ctx.createRadialGradient(px, py, 0, px, py, 10);
                pg.addColorStop(0, "rgba(0,240,255,0.95)");
                pg.addColorStop(0.4, "rgba(0,240,255,0.4)");
                pg.addColorStop(1, "transparent");
                ctx.fillStyle = pg;
                ctx.beginPath();
                ctx.arc(px, py, 10, 0, Math.PI * 2);
                ctx.fill();

                // Packet core
                ctx.beginPath();
                ctx.arc(px, py, 2.5, 0, Math.PI * 2);
                ctx.fillStyle = "#00F0FF";
                ctx.fill();
            }

            // ── Draw nodes ──
            for (const n of nodes) {
                const pulse = Math.sin(n.pulse) * 0.5 + 0.5;

                // Mouse proximity
                const dx = mx - n.x, dy = my - n.y;
                const mDist = Math.sqrt(dx * dx + dy * dy);
                const mBoost = Math.max(0, 1 - mDist / 180);

                // Outer glow
                const ng = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 6 + mBoost * 8);
                ng.addColorStop(0, `rgba(0,240,255,${0.25 + pulse * 0.2 + mBoost * 0.3})`);
                ng.addColorStop(1, "transparent");
                ctx.fillStyle = ng;
                ctx.beginPath();
                ctx.arc(n.x, n.y, n.r * 6 + mBoost * 8, 0, Math.PI * 2);
                ctx.fill();

                // Core
                ctx.beginPath();
                ctx.arc(n.x, n.y, n.r + mBoost * 1.5, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0,240,255,${0.7 + pulse * 0.3})`;
                ctx.fill();
            }

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
