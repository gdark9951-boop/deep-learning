"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CyberBackground } from "@/components/CyberBackground";
import { Lightbulb, Info, TrendingUp, FlaskConical } from "lucide-react";

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

interface Feature { name: string; impact: number }
interface ModelData { id: string; trained: boolean; top_features?: Feature[]; accuracy?: number; f1?: number }

export default function ExplainPage() {
    const [hybridModel, setHybridModel] = useState<ModelData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API}/api/models`)
            .then(r => r.json())
            .then(d => {
                const hybrid = (d.models as ModelData[]).find(m => m.id === "hybrid");
                setHybridModel(hybrid ?? null);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const features = hybridModel?.top_features ?? [];
    const maxImpact = Math.max(...features.map(f => f.impact), 1);

    return (
        <AppShell title="Explainability" subtitle="Real feature importance from trained Hybrid model" badge="Live SHAP">
            <CyberBackground />

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}
                    className="max-[800px]:!grid-cols-1">

                    {/* Feature importance — REAL from model */}
                    <div style={card}>
                        <div style={sectionHead}>
                            <TrendingUp size={15} color="#00F0FF" />
                            Feature Importance — Hybrid Model (حقيقي)
                        </div>
                        <div style={{ padding: "16px 18px" }}>
                            {loading ? (
                                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, textAlign: "center", padding: 24 }}>
                                    جارٍ تحميل بيانات النماذج...
                                </div>
                            ) : features.length === 0 ? (
                                <div style={{ color: "#facc15", fontSize: 12 }}>تعذّر تحميل بيانات النموذج</div>
                            ) : (
                                features.map((f) => {
                                    const pct = (f.impact / maxImpact) * 100;
                                    const isHigh = pct > 60;
                                    return (
                                        <div key={f.name} style={{ marginBottom: 14 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                                <span style={{ fontSize: 11, fontFamily: "monospace", color: "rgba(255,255,255,0.65)" }}>{f.name}</span>
                                                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{f.impact.toFixed(1)}%</span>
                                            </div>
                                            <div style={{ height: 7, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                                                <div style={{
                                                    height: "100%", width: `${pct}%`, borderRadius: 4,
                                                    background: isHigh
                                                        ? "linear-gradient(90deg, #00F0FF, #7A5FFF)"
                                                        : "linear-gradient(90deg, #7A5FFF, #00FF9C)",
                                                }} />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "12px 0" }} />
                            <div style={{ display: "flex", gap: 16 }}>
                                {[
                                    { label: "High Impact", color1: "#00F0FF", color2: "#7A5FFF" },
                                    { label: "Low Impact", color1: "#7A5FFF", color2: "#00FF9C" },
                                ].map(({ label, color1, color2 }) => (
                                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                                        <div style={{ width: 18, height: 6, borderRadius: 3, background: `linear-gradient(90deg, ${color1}, ${color2})` }} />
                                        {label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Model info + top feature explanation */}
                    <div style={card}>
                        <div style={sectionHead}>
                            <Lightbulb size={15} color="#7A5FFF" />
                            نتيجة النموذج — Hybrid
                        </div>
                        <div style={{ padding: "16px 18px" }}>
                            {/* Model accuracy banner */}
                            <div style={{
                                padding: "12px 14px", borderRadius: 10, marginBottom: 14,
                                border: "1px solid rgba(0,240,255,0.2)", background: "rgba(0,240,255,0.06)",
                                display: "flex", gap: 10, alignItems: "flex-start"
                            }}>
                                <Info size={15} color="#00F0FF" style={{ marginTop: 1, flexShrink: 0 }} />
                                <div>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: "#67e8f9", margin: "0 0 2px" }}>
                                        {loading ? "جارٍ التحميل..." : hybridModel?.trained
                                            ? `Accuracy: ${hybridModel.accuracy?.toFixed(1)}% · F1: ${hybridModel.f1?.toFixed(1)}%`
                                            : "لم يُدرَّب"}
                                    </p>
                                    <p style={{ fontSize: 11, color: "rgba(103,232,249,0.6)", margin: 0 }}>
                                        Hybrid Engine · RandomForest · {features.length} ميزة
                                    </p>
                                </div>
                            </div>

                            {/* Top 5 features as SHAP-style rows */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                                {features.slice(0, 5).map((f, i) => {
                                    const isHigh = f.impact > 20;
                                    return (
                                        <div key={i} style={{
                                            display: "flex", alignItems: "center", gap: 10,
                                            padding: "10px 12px", borderRadius: 10,
                                            border: `1px solid ${isHigh ? "rgba(0,240,255,0.2)" : "rgba(122,95,255,0.2)"}`,
                                            background: isHigh ? "rgba(0,240,255,0.05)" : "rgba(122,95,255,0.05)",
                                        }}>
                                            <div style={{
                                                width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                                                background: isHigh ? "#00F0FF" : "#7A5FFF"
                                            }} />
                                            <span style={{ flex: 1, fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "monospace" }}>
                                                {f.name}
                                            </span>
                                            <span style={{
                                                fontFamily: "monospace", fontWeight: 700, fontSize: 12, flexShrink: 0,
                                                color: isHigh ? "#00F0FF" : "#a78bfa"
                                            }}>+{f.impact.toFixed(1)}%</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "14px 0" }} />

                            <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 20, display: "inline-block", marginBottom: 6, border: "1px solid rgba(122,95,255,0.3)", color: "#a78bfa", background: "rgba(122,95,255,0.1)" }}>
                                    AI Insight
                                </span>
                                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.6 }}>
                                    النموذج يعتمد بشكل رئيسي على{" "}
                                    <strong style={{ color: "#67e8f9" }}>{features[0]?.name ?? "..."}</strong>{" "}
                                    لتصنيف حركة المرور. البيانات حقيقية من النماذج المدرَّبة.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Demo box */}
                <div style={{ ...card, border: "1px solid rgba(122,95,255,0.25)" }}>
                    <div style={sectionHead}>
                        <FlaskConical size={15} color="#a78bfa" />
                        أمثلة تجريبية — تفسير قرارات النموذج
                        <span style={{
                            marginRight: "auto", fontSize: 9, padding: "2px 8px", borderRadius: 20,
                            border: "1px solid rgba(122,95,255,0.3)", color: "#a78bfa", background: "rgba(122,95,255,0.08)"
                        }}>Demo</span>
                    </div>
                    <div style={{ padding: "16px 18px" }}>
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 14, lineHeight: 1.6 }}>
                            كيف يقرر النموذج التصنيف — أمثلة على تأثير الميزات المختلفة:
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {[
                                { feature: "pkt_rate", value: "8000 pkts/s", effect: "↑ يرفع احتمال DDoS بشدة", color: "#f87171", impact: "+45%" },
                                { feature: "flag_syn = 1 + flag_ack = 0", value: "SYN flood", effect: "↑ مؤشر قوي على Port Scan", color: "#fb923c", impact: "+30%" },
                                { feature: "duration_ms", value: "5000ms+", effect: "↑ Brute Force (طويل الأمد)", color: "#facc15", impact: "+22%" },
                                { feature: "byte_rate", value: "< 100 B/s", effect: "↓ حركة طبيعية (Normal)", color: "#4ade80", impact: "+18%" },
                            ].map((ex, i) => (
                                <div key={i} style={{
                                    display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                                    borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)"
                                }}>
                                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: ex.color, flexShrink: 0 }} />
                                    <span style={{ fontFamily: "monospace", fontSize: 11, color: "#67e8f9", width: 180, flexShrink: 0 }}>{ex.feature}</span>
                                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", flex: 1 }}>{ex.effect}</span>
                                    <span style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 700, color: ex.color }}>{ex.impact}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </AppShell>
    );
}
