"use client";

import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CyberBackground } from "@/components/CyberBackground";
import { Activity, Wifi, AlertTriangle, ShieldCheck, Clock, ArrowUp } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";
const POLL_MS = 1000; // poll every 1 second
const HISTORY_LEN = 30; // keep 30 data points for sparkline

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const card: React.CSSProperties = {
    background: "rgba(7, 10, 28, 0.93)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 16,
    backdropFilter: "blur(20px)",
};

const sectionHead = (borderColor = "rgba(255,255,255,0.06)"): React.CSSProperties => ({
    display: "flex", alignItems: "center", gap: 8,
    padding: "14px 18px", borderBottom: `1px solid ${borderColor}`,
    fontSize: 14, fontWeight: 700, color: "#fff",
});

const threatColor = (t: string) =>
    t === "HIGH" ? "#f87171" : t === "MED" ? "#facc15" : "#4ade80";

const threatBg = (t: string) =>
    t === "HIGH" ? "rgba(239,68,68,0.12)" : t === "MED" ? "rgba(250,204,21,0.12)" : "rgba(74,222,128,0.12)";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Metrics {
    packets_per_sec: number;
    active_connections: number;
    alerts_today: number;
    uptime_pct: number;
    bytes_sent: number;
    bytes_recv: number;
}

interface Alert {
    time: string;
    type: string;
    threat: string;
}

interface Connection {
    src_ip: string;
    dst_ip: string;
    protocol: string;
    status: string;
    threat: string;
}

/* ─── Helper ─────────────────────────────────────────────────────────────── */
function fmtBytes(b: number): string {
    if (b >= 1e9) return (b / 1e9).toFixed(1) + " GB";
    if (b >= 1e6) return (b / 1e6).toFixed(1) + " MB";
    if (b >= 1e3) return (b / 1e3).toFixed(1) + " KB";
    return b + " B";
}

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function LivePage() {
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [history, setHistory] = useState<number[]>(Array(HISTORY_LEN).fill(0));
    const [error, setError] = useState<string | null>(null);
    const [connected, setConnected] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchAll = async () => {
        try {
            const [mRes, aRes, cRes] = await Promise.all([
                fetch(`${API}/api/live/metrics`),
                fetch(`${API}/api/live/alerts`),
                fetch(`${API}/api/live/connections`),
            ]);

            if (!mRes.ok || !aRes.ok || !cRes.ok) throw new Error("API error");

            const m: Metrics = await mRes.json();
            const a: { alerts: Alert[] } = await aRes.json();
            const c: { connections: Connection[] } = await cRes.json();

            setMetrics(m);
            setAlerts(a.alerts);
            setConnections(c.connections);
            setConnected(true);
            setError(null);

            // Update rolling history for sparkline
            setHistory(prev => {
                const next = [...prev.slice(1), m.packets_per_sec];
                return next;
            });
        } catch (e) {
            setConnected(false);
            setError("تعذّر الاتصال بالخادم — تأكد من تشغيل Backend على المنفذ 8000");
        }
    };

    useEffect(() => {
        fetchAll();
        timerRef.current = setInterval(fetchAll, POLL_MS);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    const METRIC_CARDS = metrics ? [
        {
            label: "حزم/ثانية",
            value: metrics.packets_per_sec.toLocaleString(),
            icon: ArrowUp,
            color: "#00F0FF",
            trend: fmtBytes(metrics.bytes_sent) + " ↑"
        },
        {
            label: "اتصالات نشطة",
            value: metrics.active_connections.toLocaleString(),
            icon: Wifi,
            color: "#7A5FFF",
            trend: fmtBytes(metrics.bytes_recv) + " ↓"
        },
        {
            label: "تنبيهات اليوم",
            value: metrics.alerts_today.toString(),
            icon: AlertTriangle,
            color: metrics.alerts_today > 0 ? "#FF4D4D" : "#4ade80",
            trend: metrics.alerts_today > 0 ? "HIGH" : "NONE"
        },
        {
            label: "مدة التشغيل",
            value: metrics.uptime_pct.toFixed(1) + "%",
            icon: Clock,
            color: "#00FF9C",
            trend: "Stable"
        },
    ] : [];

    // Normalize sparkline heights
    const maxH = Math.max(...history, 1);
    const normalizedHistory = history.map(v => Math.max(4, Math.round((v / maxH) * 100)));

    return (
        <AppShell title="Live Monitor" subtitle="Real-time network traffic — data from your machine" badge="LIVE">
            <CyberBackground />

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Error banner */}
                {error && (
                    <div style={{
                        padding: "12px 18px", borderRadius: 12,
                        background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                        color: "#f87171", fontSize: 12
                    }}>
                        ⚠ {error}
                    </div>
                )}

                {/* Connection status dot */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: connected ? "#4ade80" : "#f87171",
                        display: "inline-block",
                        boxShadow: connected ? "0 0 6px #4ade80" : "0 0 6px #f87171"
                    }} />
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                        {connected ? `متصل • يتحدث كل ${POLL_MS / 1000}ث` : "غير متصل"}
                    </span>
                </div>

                {/* Metric cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}
                    className="max-[700px]:!grid-cols-2">
                    {metrics
                        ? METRIC_CARDS.map(({ label, value, icon: Icon, color, trend }) => (
                            <div key={label} style={card}>
                                <div style={{ padding: "16px 18px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                                        <div style={{
                                            width: 38, height: 38, borderRadius: 10, display: "grid", placeItems: "center",
                                            border: `1px solid ${color}40`, background: color + "18"
                                        }}>
                                            <Icon size={17} color={color} />
                                        </div>
                                        <span style={{
                                            fontSize: 10, padding: "3px 8px", borderRadius: 20,
                                            border: `1px solid ${color}40`, color, background: color + "15"
                                        }}>
                                            {trend}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: 26, fontWeight: 900, color: "#fff", margin: "0 0 3px" }}>{value}</p>
                                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0 }}>{label}</p>
                                </div>
                            </div>
                        ))
                        : Array(4).fill(null).map((_, i) => (
                            <div key={i} style={{ ...card, opacity: 0.4 }}>
                                <div style={{
                                    padding: "16px 18px", height: 100,
                                    display: "grid", placeItems: "center",
                                    color: "rgba(255,255,255,0.2)", fontSize: 12
                                }}>
                                    جارٍ التحميل...
                                </div>
                            </div>
                        ))
                    }
                </div>

                {/* Traffic chart + Alerts */}
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}
                    className="max-[800px]:!grid-cols-1">

                    {/* Traffic chart */}
                    <div style={card}>
                        <div style={sectionHead()}>
                            <Activity size={15} color="#00F0FF" />
                            حركة الشبكة — مباشر (حزمة/ثانية)
                        </div>
                        <div style={{ padding: "16px 18px" }}>
                            {/* Current rate number */}
                            <div style={{
                                marginBottom: 12, padding: "12px 16px", borderRadius: 10,
                                background: "rgba(0,240,255,0.06)", border: "1px solid rgba(0,240,255,0.15)"
                            }}>
                                <span style={{ fontSize: 28, fontWeight: 900, color: "#00F0FF" }}>
                                    {metrics ? metrics.packets_per_sec.toLocaleString() : "—"}
                                </span>
                                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginRight: 8 }}>
                                    حزمة/ثانية
                                </span>
                            </div>
                            {/* Live sparkline from real data */}
                            <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 60 }}>
                                {normalizedHistory.map((h, i) => (
                                    <div key={i} style={{
                                        flex: 1, borderRadius: 2, height: `${h}%`,
                                        background: `rgba(0,240,255,${0.15 + (h / 100) * 0.7})`,
                                        transition: "height 0.3s ease"
                                    }} />
                                ))}
                            </div>
                            <div style={{
                                display: "flex", justifyContent: "space-between",
                                marginTop: 6, fontSize: 10, color: "rgba(255,255,255,0.25)"
                            }}>
                                <span>{HISTORY_LEN * POLL_MS / 1000}ث مضت</span>
                                <span>الآن</span>
                            </div>
                        </div>
                    </div>

                    {/* Real Alerts */}
                    <div style={card}>
                        <div style={sectionHead()}>
                            <AlertTriangle size={15} color="#f87171" />
                            تنبيهات حديثة
                        </div>
                        <div style={{ padding: "8px 0" }}>
                            {alerts.length === 0 ? (
                                <div style={{
                                    padding: "24px 18px", textAlign: "center",
                                    color: "#4ade80", fontSize: 12
                                }}>
                                    ✓ لا توجد تهديدات مكتشفة
                                </div>
                            ) : alerts.slice(0, 8).map((a, i) => (
                                <div key={i} style={{
                                    display: "flex", alignItems: "center", gap: 8,
                                    padding: "9px 18px",
                                    borderBottom: i < Math.min(alerts.length, 8) - 1
                                        ? "1px solid rgba(255,255,255,0.04)" : "none"
                                }}>
                                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
                                        {a.time}
                                    </span>
                                    <span style={{ flex: 1, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                                        {a.type}
                                    </span>
                                    <span style={{
                                        fontSize: 9, padding: "2px 7px", borderRadius: 10,
                                        color: threatColor(a.threat), background: threatBg(a.threat),
                                        border: `1px solid ${threatColor(a.threat)}40`
                                    }}>
                                        {a.threat}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Real Connections table */}
                <div style={card}>
                    <div style={sectionHead()}>
                        <ShieldCheck size={15} color="#4ade80" />
                        الاتصالات النشطة ({connections.length})
                    </div>
                    <div style={{ overflowX: "auto" }}>
                        {connections.length === 0 ? (
                            <div style={{
                                padding: "24px", textAlign: "center",
                                color: "rgba(255,255,255,0.3)", fontSize: 12
                            }}>
                                {connected ? "لا توجد اتصالات نشطة" : "جارٍ الاتصال..."}
                            </div>
                        ) : (
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                        {["Source", "Destination", "Protocol", "Status", "Threat"].map(h => (
                                            <th key={h} style={{
                                                padding: "10px 16px", textAlign: "right",
                                                color: "rgba(255,255,255,0.35)",
                                                fontWeight: 600, fontSize: 10,
                                                textTransform: "uppercase", letterSpacing: "0.08em"
                                            }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {connections.slice(0, 20).map((c, i) => (
                                        <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                            <td style={{ padding: "10px 16px", fontFamily: "monospace", color: "rgba(255,255,255,0.7)", fontSize: 11 }}>
                                                {c.src_ip}
                                            </td>
                                            <td style={{ padding: "10px 16px", fontFamily: "monospace", color: "rgba(255,255,255,0.5)", fontSize: 11 }}>
                                                {c.dst_ip}
                                            </td>
                                            <td style={{ padding: "10px 16px" }}>
                                                <span style={{
                                                    fontSize: 10, padding: "3px 8px", borderRadius: 10,
                                                    color: "#67e8f9", background: "rgba(0,240,255,0.1)",
                                                    border: "1px solid rgba(0,240,255,0.25)"
                                                }}>
                                                    {c.protocol}
                                                </span>
                                            </td>
                                            <td style={{ padding: "10px 16px", color: "rgba(255,255,255,0.5)", fontSize: 11 }}>
                                                {c.status}
                                            </td>
                                            <td style={{ padding: "10px 16px" }}>
                                                <span style={{
                                                    fontSize: 10, padding: "3px 8px", borderRadius: 10,
                                                    color: threatColor(c.threat), background: threatBg(c.threat),
                                                    border: `1px solid ${threatColor(c.threat)}30`
                                                }}>
                                                    {c.threat}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

            </div>
        </AppShell>
    );
}
