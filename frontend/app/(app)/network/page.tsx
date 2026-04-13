"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { AppShell } from "@/components/AppShell";
import { CyberBackground } from "@/components/CyberBackground";
import { Button } from "@/components/ui/button";
import { Network, ZoomIn, ZoomOut, Filter, Maximize2, RotateCcw, FlaskConical, Wifi } from "lucide-react";

// Disable SSR for react-force-graph-2d because it uses canvas/window APIs
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

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

const GRAPH_DATA = {
    nodes: [
        { id: "GW", color: "#00F0FF", val: 8, label: "GW" },
        { id: "SV1", color: "#00FF9C", val: 5, label: "SV1" },
        { id: "SV2", color: "#00FF9C", val: 5, label: "SV2" },
        { id: "PC1", color: "#FF4D4D", val: 6, label: "PC1", infected: true },
        { id: "PC2", color: "#00FF9C", val: 5, label: "PC2" },
        { id: "IOT", color: "#7A5FFF", val: 4, label: "IOT" },
        { id: "SV3", color: "#00FF9C", val: 5, label: "SV3" },
    ],
    links: [
        { source: "GW", target: "SV1" },
        { source: "GW", target: "SV2" },
        { source: "GW", target: "PC1" },
        { source: "GW", target: "PC2" },
        { source: "GW", target: "IOT" },
        { source: "GW", target: "SV3" },
    ]
};

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
    const graphRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dims, setDims] = useState({ width: 0, height: 350 });
    const [summary, setSummary] = useState<NetSummary | null>(null);

    // Track container width for responsive Graph
    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            setDims({ width: entries[0].contentRect.width, height: 350 });
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // Polling API for network stats
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

    // Graph interactions
    const handleZoomIn = useCallback(() => {
        if (graphRef.current) {
            const currentZoom = graphRef.current.zoom();
            graphRef.current.zoom(currentZoom * 1.5, 400);
        }
    }, []);

    const handleZoomOut = useCallback(() => {
        if (graphRef.current) {
            const currentZoom = graphRef.current.zoom();
            graphRef.current.zoom(currentZoom / 1.5, 400);
        }
    }, []);

    const handleReset = useCallback(() => {
        if (graphRef.current) {
            graphRef.current.zoomToFit(400, 40);
        }
    }, []);

    const handleFullscreen = useCallback(() => {
        const el = containerRef.current;
        if (!el) return;
        if (!document.fullscreenElement) {
            el.requestFullscreen?.();
        } else {
            document.exitFullscreen?.();
        }
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
                            خريطة الشبكة التفاعلية (فيزياء حية)
                        </div>
                        <div style={{ padding: "16px 18px" }}>
                            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                                {[
                                    { icon: ZoomIn, label: "تكبير", action: handleZoomIn },
                                    { icon: ZoomOut, label: "تصغير", action: handleZoomOut },
                                    { icon: RotateCcw, label: "توسيط", action: handleReset },
                                    { icon: Maximize2, label: "شاشة كاملة", action: handleFullscreen },
                                ].map(({ icon: Icon, label, action }) => (
                                    <Button key={label} variant="outline" size="sm" onClick={action}
                                        style={{ borderColor: "rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)", fontSize: 11, height: 32, gap: 5 }}>
                                        <Icon size={13} /> {label}
                                    </Button>
                                ))}
                            </div>

                            {/* Container for ForceGraph */}
                            <div
                                ref={containerRef}
                                style={{
                                    height: dims.height,
                                    borderRadius: 12,
                                    border: "1px solid rgba(255,255,255,0.06)",
                                    background: "rgba(3,5,15,0.7)",
                                    overflow: "hidden",
                                    position: "relative"
                                }}
                            >
                                {dims.width > 0 && (
                                    <ForceGraph2D
                                        ref={graphRef}
                                        width={dims.width}
                                        height={dims.height}
                                        graphData={GRAPH_DATA}
                                        backgroundColor="transparent"
                                        nodeColor={(n: any) => n.color}
                                        linkColor={(l: any) => l.target.color === "#FF4D4D" ? "#FF4D4D" : "rgba(255,255,255,0.15)"}
                                        linkWidth={(l: any) => l.target.color === "#FF4D4D" ? 1.5 : 0.5}
                                        linkLineDash={(l: any) => l.target.color === "#FF4D4D" ? [4, 2] : []}
                                        linkDirectionalParticles={(l: any) => l.target.color === "#FF4D4D" ? 3 : 1}
                                        linkDirectionalParticleSpeed={0.01}
                                        linkDirectionalParticleWidth={(l: any) => l.target.color === "#FF4D4D" ? 3 : 1.5}
                                        linkDirectionalParticleColor={(l: any) => l.target.color === "#FF4D4D" ? "#FF4D4D" : "#00F0FF"}
                                        d3AlphaDecay={0.02} // Keeps the physics floating a bit longer
                                        d3VelocityDecay={0.4}
                                        nodeCanvasObject={(node: any, ctx: any, globalScale: number) => {
                                            const label = node.label;
                                            const fontSize = Math.max(4, 12 / globalScale);
                                            ctx.font = `bold ${fontSize}px Inter, sans-serif`;

                                            // Draw outer glow/ring
                                            ctx.beginPath();
                                            ctx.arc(node.x, node.y, node.val + 2, 0, 2 * Math.PI);
                                            ctx.fillStyle = `${node.color}30`;
                                            ctx.fill();

                                            // Draw inner solid circle
                                            ctx.beginPath();
                                            ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI);
                                            ctx.fillStyle = `${node.color}85`;
                                            ctx.fill();
                                            ctx.strokeStyle = node.color;
                                            ctx.lineWidth = 1.5 / globalScale;
                                            ctx.stroke();

                                            // Draw label text
                                            ctx.textAlign = 'center';
                                            ctx.textBaseline = 'middle';
                                            ctx.fillStyle = node.color;
                                            ctx.fillText(label, node.x, node.y + node.val + 6 + fontSize / 2);
                                        }}
                                        onEngineStop={() => {
                                            // Automatically fit graph to view once simulation settles
                                            graphRef.current?.zoomToFit(400, 40);
                                        }}
                                    />
                                )}
                                <div style={{
                                    position: "absolute", bottom: 8, left: 12,
                                    fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "monospace", pointerEvents: "none"
                                }}>
                                    استخدم الماوس للسحب والتكبير بمرونة (Smooth Pan/Zoom)
                                </div>
                            </div>
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
