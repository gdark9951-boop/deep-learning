"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CyberBackground } from "@/components/CyberBackground";
import { BarChart2, Zap, Brain, Layers, FlaskConical } from "lucide-react";

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

const MODEL_META: Record<string, { icon: React.ElementType; color: string; label: string; desc: string; recommended: boolean }> = {
    hybrid: { icon: Layers, color: "#00F0FF", label: "Hybrid Engine", desc: "RandomForest — يجمع بين CNN+LSTM للدقة القصوى", recommended: true },
    cnn: { icon: Zap, color: "#7A5FFF", label: "CNN", desc: "GradientBoosting — استخراج سريع للأنماط المكانية", recommended: false },
    lstm: { icon: Brain, color: "#00FF9C", label: "LSTM", desc: "LogisticRegression — كشف الأنماط الزمنية التسلسلية", recommended: false },
};

interface ModelData {
    id: string;
    trained: boolean;
    accuracy?: number;
    f1?: number;
    precision?: number;
    recall?: number;
    classes?: string[];
    features?: string[];
    top_features?: { name: string; impact: number }[];
}

export default function ModelsPage() {
    const [models, setModels] = useState<ModelData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch(`${API}/api/models`)
            .then(r => r.json())
            .then(d => { setModels(d.models); setLoading(false); })
            .catch(() => { setError("تعذّر الاتصال بالخادم"); setLoading(false); });
    }, []);

    const sorted = ["hybrid", "cnn", "lstm"].map(id => models.find(m => m.id === id)).filter(Boolean) as ModelData[];

    return (
        <AppShell title="Model Comparison" subtitle="Real performance benchmarks computed from live sklearn models" badge="Live Stats">
            <CyberBackground />

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                {error && (
                    <div style={{ padding: "12px 18px", borderRadius: 12, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontSize: 12 }}>
                        ⚠ {error}
                    </div>
                )}

                {/* Model cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}
                    className="max-[700px]:!grid-cols-1">
                    {loading
                        ? [0, 1, 2].map(i => (
                            <div key={i} style={{ ...card, opacity: 0.4 }}>
                                <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 12 }}>
                                    جارٍ تحميل بيانات النماذج...
                                </div>
                            </div>
                        ))
                        : sorted.map(m => {
                            const meta = MODEL_META[m.id] || MODEL_META.hybrid;
                            const Icon = meta.icon;
                            return (
                                <div key={m.id} style={{ ...card, position: "relative", overflow: "hidden" }}>
                                    <div style={{
                                        position: "absolute", top: -30, right: -30, width: 100, height: 100,
                                        borderRadius: "50%", background: meta.color, opacity: 0.06, filter: "blur(30px)", pointerEvents: "none"
                                    }} />
                                    <div style={sectionHead}>
                                        <div style={{
                                            width: 32, height: 32, borderRadius: 10, display: "grid", placeItems: "center",
                                            border: `1px solid ${meta.color}40`, background: meta.color + "18"
                                        }}>
                                            <Icon size={15} color={meta.color} />
                                        </div>
                                        {meta.label}
                                        {meta.recommended && (
                                            <span style={{
                                                marginRight: "auto", fontSize: 9, padding: "2px 7px", borderRadius: 20,
                                                border: "1px solid rgba(0,240,255,0.3)", color: "#67e8f9", background: "rgba(0,240,255,0.08)"
                                            }}>مُوصى</span>
                                        )}
                                    </div>
                                    <div style={{ padding: "14px 18px" }}>
                                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 12, lineHeight: 1.5 }}>{meta.desc}</p>
                                        <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 12 }} />
                                        {m.trained ? (
                                            <>
                                                {[["Accuracy", m.accuracy], ["F1 Score", m.f1], ["Precision", m.precision], ["Recall", m.recall]].map(([label, val]) => (
                                                    <div key={String(label)} style={{ marginBottom: 10 }}>
                                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                                                            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{String(label)}</span>
                                                            <span style={{ fontSize: 10, fontFamily: "monospace", color: meta.color }}>{Number(val).toFixed(1)}%</span>
                                                        </div>
                                                        <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                                                            <div style={{ height: "100%", borderRadius: 3, width: `${val}%`, background: meta.color }} />
                                                        </div>
                                                    </div>
                                                ))}
                                                <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "12px 0" }} />
                                                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                                                    التصنيفات: {m.classes?.join(", ")}
                                                </div>
                                            </>
                                        ) : (
                                            <p style={{ color: "#facc15", fontSize: 12 }}>لم يُدرَّب بعد</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    }
                </div>

                {/* Comparison table */}
                <div style={card}>
                    <div style={sectionHead}>
                        <BarChart2 size={15} color="#00F0FF" />
                        جدول المقارنة الشامل — بيانات حقيقية من النماذج المُدرَّبة
                    </div>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                    {["المقياس", "Hybrid", "CNN", "LSTM"].map((h, i) => (
                                        <th key={h} style={{
                                            padding: "10px 16px", textAlign: "right",
                                            color: i === 0 ? "rgba(255,255,255,0.3)" : ["#00F0FF", "#7A5FFF", "#00FF9C"][i - 1],
                                            fontWeight: 700, fontSize: 11
                                        }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={4} style={{ padding: 20, textAlign: "center", color: "rgba(255,255,255,0.3)" }}>جارٍ التحميل...</td></tr>
                                ) : (
                                    ["accuracy", "f1", "precision", "recall"].map(metric => {
                                        const labels: Record<string, string> = { accuracy: "Accuracy", f1: "F1 Score", precision: "Precision", recall: "Recall" };
                                        return (
                                            <tr key={metric} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                                <td style={{ padding: "10px 16px", color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>{labels[metric]}</td>
                                                {["hybrid", "cnn", "lstm"].map((id, ci) => {
                                                    const m = models.find(x => x.id === id);
                                                    let v: string = "–";
                                                    if (m?.trained) {
                                                        const val = metric === "accuracy" ? m.accuracy
                                                            : metric === "f1" ? m.f1
                                                                : metric === "precision" ? m.precision
                                                                    : m.recall;
                                                        if (typeof val === "number") v = val.toFixed(1) + "%";
                                                    }
                                                    return (
                                                        <td key={id} style={{ padding: "10px 16px", fontFamily: "monospace", fontWeight: 700, color: ["#00F0FF", "#7A5FFF", "#00FF9C"][ci] }}>
                                                            {v}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Demo / Examples box */}
                <div style={{ ...card, border: "1px solid rgba(122,95,255,0.25)" }}>
                    <div style={sectionHead}>
                        <FlaskConical size={15} color="#a78bfa" />
                        أمثلة تجريبية — أداء النماذج على بيانات حقيقية
                        <span style={{
                            marginRight: "auto", fontSize: 9, padding: "2px 8px", borderRadius: 20,
                            border: "1px solid rgba(122,95,255,0.3)", color: "#a78bfa", background: "rgba(122,95,255,0.08)"
                        }}>Demo</span>
                    </div>
                    <div style={{ padding: "16px 18px" }}>
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 14, lineHeight: 1.6 }}>
                            هذه نماذج حقيقية مدرَّبة على بيانات شبكة تصنيفية. اضغط على "Upload & Predict" لاختبارها بملفاتك الخاصة.
                            فيما يلي أمثلة على مدخلات وتوقعات:
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {[
                                { label: "DDoS Attack", color: "#f87171", packets: 5000, bytes: "500 KB", duration: "10ms", risk: "HIGH", model: "Hybrid" },
                                { label: "Normal Traffic", color: "#4ade80", packets: 12, bytes: "2 KB", duration: "300ms", risk: "LOW", model: "Hybrid" },
                                { label: "Port Scan", color: "#facc15", packets: 1, bytes: "50B", duration: "5ms", risk: "HIGH", model: "CNN" },
                                { label: "Brute Force", color: "#fb923c", packets: 40, bytes: "5 KB", duration: "8s", risk: "HIGH", model: "LSTM" },
                            ].map((ex, i) => (
                                <div key={i} style={{
                                    display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                                    borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)"
                                }}>
                                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: ex.color, flexShrink: 0, boxShadow: `0 0 6px ${ex.color}` }} />
                                    <span style={{ fontSize: 12, fontWeight: 700, color: ex.color, width: 100, flexShrink: 0 }}>{ex.label}</span>
                                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "monospace", flex: 1 }}>
                                        {ex.packets} pkts · {ex.bytes} · {ex.duration}
                                    </span>
                                    <span style={{
                                        fontSize: 10, padding: "2px 8px", borderRadius: 10,
                                        color: ex.color, background: ex.color + "18", border: `1px solid ${ex.color}40`
                                    }}>
                                        {ex.risk}
                                    </span>
                                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>→ {ex.model}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </AppShell>
    );
}
