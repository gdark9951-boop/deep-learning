"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  pulse: number; pulseSpeed: number;
}

interface Packet {
  from: number; to: number;
  t: number; speed: number;
}

export function CyberBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef<number>(0);
  const reduced = typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0, H = 0;
    const NODES: Particle[] = [];
    const PACKETS: Packet[] = [];
    const N = 60;
    const MAX_D = 170;

    const init = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      NODES.length = 0;
      for (let i = 0; i < N; i++) {
        NODES.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          r: 1.2 + Math.random() * 2,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: 0.018 + Math.random() * 0.018,
        });
      }
    };
    init();

    const onResize = () => init();
    window.addEventListener("resize", onResize);

    const onMove = (e: MouseEvent) => { mouse.current.x = e.clientX; mouse.current.y = e.clientY; };
    window.addEventListener("mousemove", onMove);

    let frame = 0;
    const spawnPacket = () => {
      if (PACKETS.length >= 20) return;
      const from = Math.floor(Math.random() * N);
      let to = Math.floor(Math.random() * N);
      while (to === from) to = Math.floor(Math.random() * N);
      PACKETS.push({ from, to, t: 0, speed: 0.007 + Math.random() * 0.006 });
    };

    const draw = (ts: number) => {
      frame++;
      ctx.clearRect(0, 0, W, H);

      // ── Base ──
      ctx.fillStyle = "#070A18";
      ctx.fillRect(0, 0, W, H);

      // ── Grid ──
      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 52) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 52) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // ── Ambient glows ──
      const t = ts * 0.00025;
      const ox = Math.sin(t) * 80, oy = Math.cos(t * 0.7) * 50;
      const cg = ctx.createRadialGradient(W / 2 + ox, H / 2 + oy, 0, W / 2 + ox, H / 2 + oy, Math.max(W, H) * 0.5);
      cg.addColorStop(0, "rgba(0,240,255,0.08)");
      cg.addColorStop(0.5, "rgba(122,95,255,0.05)");
      cg.addColorStop(1, "transparent");
      ctx.fillStyle = cg; ctx.fillRect(0, 0, W, H);

      // Top-right violet
      const vg = ctx.createRadialGradient(W * 0.85, H * 0.1, 0, W * 0.85, H * 0.1, W * 0.45);
      vg.addColorStop(0, "rgba(122,95,255,0.10)"); vg.addColorStop(1, "transparent");
      ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);

      // Bottom-left cyan
      const bg2 = ctx.createRadialGradient(W * 0.1, H * 0.9, 0, W * 0.1, H * 0.9, W * 0.4);
      bg2.addColorStop(0, "rgba(0,240,255,0.07)"); bg2.addColorStop(1, "transparent");
      ctx.fillStyle = bg2; ctx.fillRect(0, 0, W, H);

      // ── Mouse glow ──
      const mx = mouse.current.x, my = mouse.current.y;
      if (mx > 0) {
        const mg = ctx.createRadialGradient(mx, my, 0, mx, my, 260);
        mg.addColorStop(0, "rgba(0,240,255,0.13)"); mg.addColorStop(1, "transparent");
        ctx.fillStyle = mg; ctx.fillRect(0, 0, W, H);
      }

      if (!reduced) {
        // ── Move nodes ──
        for (const n of NODES) {
          const dx = mx - n.x, dy = my - n.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 200 && d > 0) {
            const f = (200 - d) / 200 * 0.01;
            n.vx += dx / d * f; n.vy += dy / d * f;
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

      // ── Edges ──
      for (let i = 0; i < NODES.length; i++) {
        for (let j = i + 1; j < NODES.length; j++) {
          const a = NODES[i], b = NODES[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d > MAX_D) continue;
          const alpha = (1 - d / MAX_D) * 0.5;
          const mdx = mx - (a.x + b.x) / 2, mdy = my - (a.y + b.y) / 2;
          const mBoost = Math.max(0, 1 - Math.sqrt(mdx * mdx + mdy * mdy) / 240) * 0.45;
          const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
          g.addColorStop(0, `rgba(0,240,255,${alpha + mBoost})`);
          g.addColorStop(0.5, `rgba(122,95,255,${(alpha + mBoost) * 0.7})`);
          g.addColorStop(1, `rgba(0,240,255,${alpha + mBoost})`);
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = g; ctx.lineWidth = 0.7 + mBoost * 1.5; ctx.stroke();
        }
      }

      // ── Packets ──
      if (frame % 38 === 0) spawnPacket();
      for (let i = PACKETS.length - 1; i >= 0; i--) {
        const p = PACKETS[i]; p.t += p.speed;
        if (p.t >= 1) { PACKETS.splice(i, 1); continue; }
        const a = NODES[p.from], b = NODES[p.to];
        const dx = b.x - a.x, dy = b.y - a.y;
        if (Math.sqrt(dx * dx + dy * dy) > MAX_D * 1.5) { PACKETS.splice(i, 1); continue; }
        const px = a.x + dx * p.t, py = a.y + dy * p.t;
        const pg = ctx.createRadialGradient(px, py, 0, px, py, 9);
        pg.addColorStop(0, "rgba(0,240,255,0.95)"); pg.addColorStop(1, "transparent");
        ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(px, py, 9, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(px, py, 2.2, 0, Math.PI * 2); ctx.fillStyle = "#00F0FF"; ctx.fill();
      }

      // ── Nodes ──
      for (const n of NODES) {
        const pulse = Math.sin(n.pulse) * 0.5 + 0.5;
        const dx = mx - n.x, dy = my - n.y;
        const mB = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / 180);
        const ng = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 6 + mB * 8);
        ng.addColorStop(0, `rgba(0,240,255,${0.2 + pulse * 0.2 + mB * 0.3})`); ng.addColorStop(1, "transparent");
        ctx.fillStyle = ng; ctx.beginPath(); ctx.arc(n.x, n.y, n.r * 6 + mB * 8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r + mB * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,240,255,${0.65 + pulse * 0.35})`; ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
    };
  }, [reduced]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, zIndex: -10, display: "block", width: "100%", height: "100%" }}
      aria-hidden="true"
    />
  );
}
