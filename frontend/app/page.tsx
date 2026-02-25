"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useMotionValue, useSpring, useTransform, motion } from "framer-motion";
import {
  Upload, Radio, BarChart2, Lightbulb,
  Network, FileText, Shield, Cpu, Activity, Settings2,
} from "lucide-react";
import { CyberBackground } from "@/components/CyberBackground";
import { CyberNeonButton } from "@/components/CyberNeonButton";
import { HubSettingsPanel, loadSettings, HubSettings } from "@/components/HubSettingsPanel";
import { LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  sub: string;
  accent: string;
}

const NAV: NavItem[] = [
  { href: "/demo", icon: Upload, label: "Upload & Predict", sub: "CSV · Threat Detection", accent: "#00F0FF" },
  { href: "/live", icon: Radio, label: "Live Monitor", sub: "Real-time Traffic", accent: "#7A5FFF" },
  { href: "/models", icon: BarChart2, label: "Model Comparison", sub: "CNN vs LSTM", accent: "#00F0FF" },
  { href: "/explain", icon: Lightbulb, label: "Explainability", sub: "SHAP · Feature Importance", accent: "#7A5FFF" },
  { href: "/network", icon: Network, label: "Network Map", sub: "Attack Visualization", accent: "#00F0FF" },
  { href: "/docs", icon: FileText, label: "Docs", sub: "API · System Guide", accent: "#7A5FFF" },
];

const PANEL_WIDTHS = { xs: 320, sm: 384, md: 448 };

export default function Home() {
  // settings — start with defaults, then hydrate from localStorage
  const [settings, setSettings] = useState<HubSettings>(() => loadSettings());
  const [showSettings, setShowSettings] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
    setMounted(true);
  }, []);

  // Subtle tilt — max ±1.5°, no position movement
  const panelRef = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springCfg = { stiffness: 80, damping: 30, mass: 1.2 };
  const rotateX = useSpring(useTransform(rawY, [-1, 1], [1.5, -1.5]), springCfg);
  const rotateY = useSpring(useTransform(rawX, [-1, 1], [-1.5, 1.5]), springCfg);
  const [glow, setGlow] = useState({ x: 50, y: 50 });

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = panelRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    rawX.set(((e.clientX - r.left) / r.width) * 2 - 1);
    rawY.set(((e.clientY - r.top) / r.height) * 2 - 1);
    setGlow({
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    });
  }, [rawX, rawY]);

  const onMouseLeave = useCallback(() => {
    rawX.set(0); rawY.set(0);
    setGlow({ x: 50, y: 50 });
  }, [rawX, rawY]);

  const panelMaxW = mounted ? PANEL_WIDTHS[settings.panelWidth] : PANEL_WIDTHS.sm;

  return (
    <>
      {/* Background — fixed, pointer-events-none, z=-10 */}
      <CyberBackground />

      {/* Full-screen centering wrapper */}
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          // No width manipulation here — just centering
        }}
      >
        {/* Width constraint — the ONLY thing controlling panel width */}
        <div style={{ width: "100%", maxWidth: panelMaxW, margin: "0 auto" }}>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ textAlign: "center", marginBottom: 16 }}
          >
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              borderRadius: 9999, border: "1px solid rgba(34,211,238,0.2)",
              background: "rgba(34,211,238,0.08)", padding: "2px 12px",
              marginBottom: 8,
            }}>
              <span style={{ height: 6, width: 6, borderRadius: "50%", background: "#22d3ee", animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", color: "#22d3ee", textTransform: "uppercase" }}>
                System Online
              </span>
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", margin: 0 }}>
              DEEP{" "}
              <span style={{ backgroundImage: "linear-gradient(to right, #22d3ee, #7A5FFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                LEARNING
              </span>
            </h1>
          </motion.div>

          {/* Glass panel */}
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            style={{
              rotateX, rotateY,
              transformPerspective: 800,
              borderRadius: 16,
              border: "1px solid rgba(34,211,238,0.22)",
              background: "rgba(255,255,255,0.04)",
              backdropFilter: "blur(20px)",
              padding: 16,
              boxShadow: "0 0 30px rgba(0,240,255,0.09)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Cursor glow — purely visual, no layout effect */}
            <div
              aria-hidden
              style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                borderRadius: 16, zIndex: 0,
                background: `radial-gradient(circle at ${glow.x}% ${glow.y}%, rgba(0,240,255,0.16) 0%, transparent 58%)`,
              }}
            />

            {/* Panel header */}
            <div style={{
              position: "relative", zIndex: 1,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 12, paddingBottom: 12,
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Shield size={16} style={{ color: "#22d3ee" }} />
                <span style={{ color: "#fff", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em" }}>CONTROL HUB</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>v2.0 Beta</span>
                <button
                  onClick={() => setShowSettings((v) => !v)}
                  title="Settings"
                  style={{
                    display: "grid", placeItems: "center",
                    width: 24, height: 24, borderRadius: 6,
                    background: showSettings ? "rgba(34,211,238,0.12)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${showSettings ? "rgba(34,211,238,0.3)" : "rgba(255,255,255,0.1)"}`,
                    cursor: "pointer", color: showSettings ? "#22d3ee" : "rgba(255,255,255,0.4)",
                    transition: "all 0.2s",
                  }}
                >
                  <Settings2 size={13} />
                </button>
              </div>
            </div>

            {/* Button list */}
            <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: settings.gap }}>
              {NAV.map((item, index) => (
                <CyberNeonButton
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  sub={item.sub}
                  accent={item.accent}
                  settings={settings}
                  isActive={hoveredIndex === index}
                  isDimmed={hoveredIndex !== null && hoveredIndex !== index}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              ))}
            </div>

            {/* Settings panel (collapsible) */}
            {showSettings && (
              <div style={{ position: "relative", zIndex: 1 }}>
                <HubSettingsPanel settings={settings} onChange={setSettings} />
              </div>
            )}

            {/* Footer */}
            <div style={{
              position: "relative", zIndex: 1,
              marginTop: 12, paddingTop: 10,
              borderTop: "1px solid rgba(255,255,255,0.05)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              opacity: 0.35, fontSize: 9, color: "#fff", fontFamily: "monospace",
            }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Cpu size={10} /> Hybrid Engine
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Activity size={10} /> Real-time
              </span>
            </div>
          </motion.div>

        </div>
      </div>
    </>
  );
}
