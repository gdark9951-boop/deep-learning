"use client";

import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CyberBackground } from "@/components/CyberBackground";
import { Button } from "@/components/ui/button";
import { Network, ZoomIn, ZoomOut, Filter, Maximize2, RotateCcw, FlaskConical, Wifi } from "lucide-react";
import {
    NetworkMapViewport,
    type NetworkMapViewportHandle,
} from "@/components/NetworkMapViewport";

const API = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

const card: React.CSSProperties = {
    background: "rgba(7, 10, 28, 0.93)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 16,
    backdropFilter: "blur(20px)",
};
const sectionHead: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 8,
    padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)",
    fontSize: 14, fontWeight: 700, color: "#fff",
};

const LEGEND = [
    { color: "#00FF9C", label: "Safe Node" },
    { color: "#FF4D4D", label: "Infected" },
    { color: "#00F0FF", label: "Gateway" },
    { color: "#7A5FFF", label: "Unknown" },
];

const NODES = [
    { x: 50, y: 50, color: "#00F0FF", r: 7, label: "GW" },
    { x: 25, y: 30, color: "#00FF9C", r: 4.5, label: "SV1" },
    { x: 70, y: 25, color: "#00FF9C", r: 4.5, label: "SV2" },
    { x: 20, y: 65, color: "#FF4D4D", r: 5, label: "PC1" },
    { x: 75, y: 70, color: "#00FF9C", r: 4.5, label: "PC2" },
    { x: 45, y: 78, color: "#7A5FFF", r: 4, label: "IOT" },
    { x: 85, y: 45, color: "#00FF9C", r: 4.5, label: "SV3" },
];
const EDGES = [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6]];

interface NetSummary {
    interfaces: { name: string; ip: string; up: boolean; speed_mbps: number; bytes_sent: number; bytes_recv: number }[];
    total_connections: number;
    established: number;
}

function fmtBytes(b: number) {
    if (b >= 1e9) return (b / 1e9).toFixed(1) + " GB";
    if (b >= 1e6) return (b / 1e6).toFixed(1) + " MB";
    if (b >= 1e3) return (b / 1e3).toFixed(1) + " KB";
    return b + " B";
}

export default function NetworkPage() {
    const viewportRef = useRef<NetworkMapViewportHandle>(null);
    const [summary, setSummary] = useState<NetSummary | null>(null);

    useEffect(() => {
        const fetchSummary = () =>
            fetch(`${API}/api/network/summary`)
                .then(r => r.json())
                .then(setSummary)
                .catch(() => null);
        fetchSummary();
        const t = setInterval(fetchSummary, 4000);
        return () => clearInterval(t);
    }, []);

    const activeIfaces = summary?.interfaces.filter(i => i.up) ?? [];

    return (
        <AppShell title="Network Map" subtitle="Real network topology • live interface stats from your machine" badge="Live">
            <CyberBackground />

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: 20 }}
                    className="max-[800px]:!grid-cols-1">

                    {/* Map card */}
                    <div style={card}>
                        <div style={sectionHead}>
                            <Network size={15} color="#00F0FF" />
                            خريطة الشبكة — مباشر
                        </div>
                        <div style={{ padding: "16px 18px" }}>
                            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                                {[
                                    { icon: ZoomIn, label: "Zoom In", action: () => viewportRef.current?.zoomIn() },
                                    { icon: ZoomOut, label: "Zoom Out", action: () => viewportRef.current?.zoomOut() },
                                    { icon: RotateCcw, label: "Reset", action: () => viewportRef.current?.reset() },
                                    { icon: Maximize2, label: "Fullscreen", action: () => viewportRef.current?.toggleFullscreen() },
                                ].map(({ icon: Icon, label, action }) => (
                                    <Button key={label} variant="outline" size="sm" onClick={action}
                                        style={{ borderColor: "rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)", fontSize: 11, height: 32, gap: 5 }}>
                                        <Icon size={13} /> {label}
                                    </Button>
                                ))}
                                <Button variant="outline" size="sm"
                                    style={{ borderColor: "rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)", fontSize: 11, height: 32, gap: 5, opacity: 0.5, cursor: "default" }}>
                                    <Filter size={13} /> Filter
                                </Button>
                            </div>

                            <NetworkMapViewport ref={viewportRef} height={300}>
                                <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%", display: "block" }}>
                                    {EDGES.map(([a, b], i) => (
                                        <line key={i}
                                            x1={NODES[a].x} y1={NODES[a].y}
                                            x2={NODES[b].x} y2={NODES[b].y}
                                            stroke={NODES[b].color === "#FF4D4D" ? "#FF4D4D" : "rgba(255,255,255,0.1)"}
                                            strokeWidth={NODES[b].color === "#FF4D4D" ? "0.8" : "0.4"}
                                            strokeDasharray={NODES[b].color === "#FF4D4D" ? "2 2" : "0"}
                                            opacity={NODES[b].color === "#FF4D4D" ? 0.7 : 1}
                                        />
                                    ))}
                                    {NODES.map((n, i) => (
                                        <g key={i}>
                                            <circle cx={n.x} cy={n.y} r={n.r + 3} fill={n.color + "15"} />
                                            <circle cx={n.x} cy={n.y} r={n.r} fill={n.color + "30"} stroke={n.color} strokeWidth="0.8" />
                                            <text x={n.x} y={n.y + n.r + 4} textAnchor="middle" fill={n.color} fontSize="2.8" fontWeight="bold">{n.label}</text>
                                        </g>
                                    ))}
                                </svg>
                                <div style={{
                                    position: "absolute", left: `${NODES[3].x}%`, top: `${NODES[3].y}%`,
                                    transform: "translate(-50%,-50%)", width: 24, height: 24, borderRadius: "50%",
                                    border: "1.5px solid #FF4D4D", animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite", opacity: 0.6,
                                }} />
                            </NetworkMapViewport>
                        </div>
                    </div>

                    {/* Side panel */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        <div style={card}>
                            <div style={sectionHead}>المفتاح</div>
                            <div style={{ padding: "12px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
                                {LEGEND.map(({ color, label }) => (
                                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                                        <div style={{ width: 10, height: 10, borderRadius: "50%", flexShrink: 0, background: color + "40", border: `1px solid ${color}` }} />
                                        {label}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Real stats */}
                        <div style={card}>
                            <div style={sectionHead}>إحصائيات حقيقية</div>
                            <div style={{ padding: "4px 0" }}>
                                {[
                                    ["واجهات شبكة نشطة", activeIfaces.length.toString()],
                                    ["إجمالي الاتصالات", summary ? summary.total_connections.toString() : "–"],
                                    ["اتصال مُنشأ", summary ? summary.established.toString() : "–"],
                                ].map(([k, v]) => (
                                    <div key={String(k)} style={{
                                        display: "flex", justifyContent: "space-between",
                                        padding: "8px 18px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12
                                    }}>
                                        <span style={{ color: "rgba(255,255,255,0.4)" }}>{k}</span>
                                        <span style={{ fontFamily: "monospace", color: "rgba(255,255,255,0.75)" }}>{v}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Real interfaces table */}
                <div style={card}>
                    <div style={sectionHead}>
                        <Wifi size={15} color="#00FF9C" />
                        واجهات الشبكة الحقيقية على هذا الجهاز
                    </div>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                    {["الاسم", "IP", "الحالة", "السرعة", "مُرسَل", "مُستقبَل"].map(h => (
                                        <th key={h} style={{ padding: "10px 16px", textAlign: "right", color: "rgba(255,255,255,0.35)", fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {!summary ? (
                                    <tr><td colSpan={6} style={{ padding: 20, textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 12 }}>جارٍ التحميل...</td></tr>
                                ) : summary.interfaces.filter(i => i.ip !== "–").slice(0, 10).map((iface, i) => (
                                    <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                        <td style={{ padding: "10px 16px", fontFamily: "monospace", color: "rgba(255,255,255,0.7)", fontSize: 11 }}>{iface.name}</td>
                                        <td style={{ padding: "10px 16px", fontFamily: "monospace", color: "#67e8f9", fontSize: 11 }}>{iface.ip}</td>
                                        <td style={{ padding: "10px 16px" }}>
                                            <span style={{
                                                fontSize: 10, padding: "2px 8px", borderRadius: 10,
                                                color: iface.up ? "#4ade80" : "#f87171",
                                                background: iface.up ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
                                                border: `1px solid ${iface.up ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`
                                            }}>{iface.up ? "UP" : "DOWN"}</span>
                                        </td>
                                        <td style={{ padding: "10px 16px", color: "rgba(255,255,255,0.5)", fontFamily: "monospace", fontSize: 11 }}>
                                            {iface.speed_mbps > 0 ? iface.speed_mbps + " Mbps" : "–"}
                                        </td>
                                        <td style={{ padding: "10px 16px", color: "rgba(74,222,128,0.8)", fontFamily: "monospace", fontSize: 11 }}>↑ {fmtBytes(iface.bytes_sent)}</td>
                                        <td style={{ padding: "10px 16px", color: "rgba(0,240,255,0.8)", fontFamily: "monospace", fontSize: 11 }}>↓ {fmtBytes(iface.bytes_recv)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Demo box */}
                <div style={{ ...card, border: "1px solid rgba(122,95,255,0.25)" }}>
                    <div style={sectionHead}>
                        <FlaskConical size={15} color="#a78bfa" />
                        أمثلة تجريبية — سيناريوهات هجمات شبكية حقيقية
                        <span style={{
                            marginRight: "auto", fontSize: 9, padding: "2px 8px", borderRadius: 20,
                            border: "1px solid rgba(122,95,255,0.3)", color: "#a78bfa", background: "rgba(122,95,255,0.08)"
                        }}>Demo</span>
                    </div>
                    <div style={{ padding: "16px 18px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {[
                                { ip: "192.168.1.45", dst: "10.0.0.1:80", proto: "TCP", type: "DDoS", color: "#f87171" },
                                { ip: "10.0.0.12", dst: "192.168.1.22:22", proto: "TCP", type: "Brute Force", color: "#fb923c" },
                                { ip: "172.16.0.8", dst: "192.168.1.1:443", proto: "TCP", type: "Normal", color: "#4ade80" },
                                { ip: "192.168.0.99", dst: "8.8.8.8:53", proto: "UDP", type: "DNS Probe", color: "#facc15" },
                            ].map((ex, i) => (
                                <div key={i} style={{
                                    display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                                    borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)"
                                }}>
                                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: ex.color, flexShrink: 0 }} />
                                    <span style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.6)", width: 110, flexShrink: 0 }}>{ex.ip}</span>
                                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>→</span>
                                    <span style={{ fontFamily: "monospace", fontSize: 11, color: "#67e8f9", flex: 1 }}>{ex.dst}</span>
                                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginLeft: 4 }}>{ex.proto}</span>
                                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, color: ex.color, background: ex.color + "18", border: `1px solid ${ex.color}40` }}>
                                        {ex.type}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </AppShell>
    );
}
