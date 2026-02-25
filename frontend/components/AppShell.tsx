"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
    Upload, Radio, BarChart2, Lightbulb,
    Network, FileText, Home, Shield, Activity, ChevronLeft,
} from "lucide-react";

const NAV = [
    { href: "/demo", icon: Upload, label: "Upload & Predict", accent: "#00F0FF" },
    { href: "/live", icon: Radio, label: "Live Monitor", accent: "#7A5FFF" },
    { href: "/models", icon: BarChart2, label: "Model Comparison", accent: "#00F0FF" },
    { href: "/explain", icon: Lightbulb, label: "Explainability", accent: "#7A5FFF" },
    { href: "/network", icon: Network, label: "Network Map", accent: "#00F0FF" },
    { href: "/docs", icon: FileText, label: "Documentation", accent: "#7A5FFF" },
];

interface Props {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
    badge?: string;
}

/* ─── shared card style helper ──────────────────────────────────────────── */
export const cardStyle: React.CSSProperties = {
    background: "rgba(7, 10, 28, 0.92)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 14,
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
};

export const cardHeaderStyle: React.CSSProperties = {
    borderBottom: "1px solid rgba(255,255,255,0.06)",
};

export function AppShell({ children, title, subtitle, badge }: Props) {
    const pathname = usePathname();

    return (
        <div style={{ display: "flex", minHeight: "100vh" }}>

            {/* ── Right Sidebar ─────────────────────────────────────────── */}
            <aside style={{
                position: "fixed", right: 0, top: 0, bottom: 0,
                width: 68,
                display: "flex", flexDirection: "column", alignItems: "center",
                background: "rgba(5, 7, 20, 0.95)",
                borderLeft: "1px solid rgba(255,255,255,0.07)",
                backdropFilter: "blur(20px)",
                zIndex: 50,
            }}>
                {/* Logo */}
                <Link href="/" style={{ marginTop: 20, marginBottom: 12, display: "block" }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        border: "1px solid rgba(0,240,255,0.3)",
                        background: "rgba(0,240,255,0.08)",
                        display: "grid", placeItems: "center",
                    }}>
                        <Shield size={18} color="#00F0FF" />
                    </div>
                </Link>

                <div style={{ width: 32, height: 1, background: "rgba(255,255,255,0.08)", marginBottom: 12 }} />

                {/* Nav icons */}
                <nav style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                    {NAV.map(({ href, icon: Icon, label, accent }) => {
                        const active = pathname === href;
                        return (
                            <Link key={href} href={href} title={label} style={{ textDecoration: "none" }}>
                                <div style={{
                                    position: "relative",
                                    width: 40, height: 40, borderRadius: 12,
                                    display: "grid", placeItems: "center",
                                    background: active ? accent + "25" : "transparent",
                                    border: `1px solid ${active ? accent + "50" : "transparent"}`,
                                    color: active ? accent : "rgba(255,255,255,0.35)",
                                    boxShadow: active ? `0 0 18px ${accent}30` : "none",
                                    transition: "all 0.18s ease",
                                    cursor: "pointer",
                                }}>
                                    <Icon size={17} />
                                    {active && (
                                        <div style={{
                                            position: "absolute", right: -1, top: "50%",
                                            transform: "translateY(-50%)",
                                            width: 3, height: 20, borderRadius: "2px 0 0 2px",
                                            background: accent,
                                        }} />
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                {/* Back to hub */}
                <div style={{ marginBottom: 20 }}>
                    <Link href="/" title="Control Hub" style={{ textDecoration: "none" }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 12,
                            border: "1px solid rgba(255,255,255,0.08)",
                            display: "grid", placeItems: "center",
                            color: "rgba(255,255,255,0.3)",
                            transition: "all 0.18s ease",
                            cursor: "pointer",
                        }}>
                            <Home size={17} />
                        </div>
                    </Link>
                </div>
            </aside>

            {/* ── Top Header ─────────────────────────────────────────────── */}
            <header style={{
                position: "fixed", top: 0, left: 0, right: 68,
                height: 60, zIndex: 40,
                background: "rgba(5, 7, 20, 0.92)",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                backdropFilter: "blur(20px)",
                display: "flex", alignItems: "center",
                padding: "0 20px", gap: 12,
            }}>
                <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
                    <Shield size={15} color="#00F0FF" />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: "0.08em" }}>DEEP LEARNING</span>
                </Link>

                <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.08)" }} />

                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
                    <Home size={12} />
                    <ChevronLeft size={12} />
                    <span style={{ color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>{title}</span>
                </div>

                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
                    {badge && (
                        <div style={{
                            padding: "3px 10px", borderRadius: 20,
                            border: "1px solid rgba(0,240,255,0.3)",
                            background: "rgba(0,240,255,0.08)",
                            fontSize: 10, fontWeight: 600, color: "#00F0FF", letterSpacing: "0.06em",
                        }}>{badge}</div>
                    )}
                    <div style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "3px 10px", borderRadius: 20,
                        border: "1px solid rgba(0,255,156,0.2)",
                        background: "rgba(0,255,156,0.06)"
                    }}>
                        <Activity size={11} color="#00FF9C" />
                        <span style={{ fontSize: 10, fontWeight: 600, color: "#00FF9C", fontFamily: "monospace" }}>Live</span>
                    </div>
                    <div style={{
                        width: 8, height: 8, borderRadius: "50%", background: "#00FF9C",
                        boxShadow: "0 0 8px #00FF9C", animation: "pulse 2s infinite"
                    }} />
                </div>
            </header>

            {/* ── Main Content ───────────────────────────────────────────── */}
            <main style={{
                flex: 1,
                paddingTop: 60,
                marginRight: 68,
                minHeight: "100vh",
                background: "rgba(3, 5, 15, 0.35)",
            }}>
                {/* Page header strip */}
                <div style={{
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    background: "rgba(5, 8, 20, 0.7)",
                    padding: "14px 32px",
                }}>
                    <div style={{ maxWidth: 1152, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.2 }}>{title}</h1>
                            {subtitle && (
                                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: "3px 0 0 0" }}>{subtitle}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content body */}
                <div style={{ maxWidth: 1152, margin: "0 auto", padding: "28px 32px" }}>
                    {children}
                </div>
            </main>
        </div>
    );
}
