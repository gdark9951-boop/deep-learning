"use client";

import { useState, useRef } from "react";
import { AppShell } from "@/components/AppShell";
import { CyberBackground } from "@/components/CyberBackground";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Upload, Play, FileText, AlertTriangle, CheckCircle2,
    Cpu, Zap, Info, Download, ServerCrash,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────────────────── */
type ModelKey = "hybrid" | "cnn" | "lstm";

interface FeatureImpact { name: string; impact: number; }

interface PredictResult {
    model: string;
    label: string;
    confidence: number;   // 0–1
    risk: "HIGH" | "MEDIUM" | "LOW";
    top_features: FeatureImpact[];
    records: number;
}

/* ─── Constants ─────────────────────────────────────────────────────────── */
const API_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

const MODELS: { id: ModelKey; label: string; desc: string; color: string }[] = [
    { id: "hybrid", label: "Hybrid", desc: "أعلى دقة", color: "#00F0FF" },
    { id: "cnn", label: "CNN", desc: "مكاني", color: "#7A5FFF" },
    { id: "lstm", label: "LSTM", desc: "زمني", color: "#00FF9C" },
];

const FEATURES: [string, string, string][] = [
    ["Packet_Size", "1480", "bytes"],
    ["Duration", "0.34", "sec"],
    ["Flag_SYN", "1", "bool"],
    ["Rate_Limit", "9.2", "pkts/s"],
];

const RISK_COLOR: Record<string, string> = {
    HIGH: "#f87171",
    MEDIUM: "#facc15",
    LOW: "#4ade80",
};

const SAMPLE_CSV =
    `timestamp,src_ip,dst_ip,src_port,dst_port,protocol,packets,bytes,duration_ms,flag_syn,flag_ack,flag_fin,flag_rst,label\n` +
    `2026-02-19 10:00:01,192.168.1.10,192.168.1.20,51234,443,TCP,8,1024,210,1,1,0,0,benign\n` +
    `2026-02-19 10:00:05,192.168.1.45,192.168.1.1,53412,80,TCP,2100,210000,15,1,0,0,0,ddos\n` +
    `2026-02-19 10:00:08,10.0.0.42,192.168.1.1,54321,22,TCP,1,48,8,1,0,0,1,portscan\n` +
    `2026-02-19 10:00:11,192.168.2.99,192.168.1.5,44000,22,TCP,30,4200,5200,1,1,0,0,bruteforce`;

function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "sample_network.csv"; a.click();
    URL.revokeObjectURL(url);
}

/* ─── Shared inline styles ───────────────────────────────────────────────── */
const card: React.CSSProperties = {
    background: "rgba(7, 10, 28, 0.93)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 16,
    backdropFilter: "blur(20px)",
};

const sectionHead: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 8,
    padding: "14px 18px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    fontSize: 14, fontWeight: 700, color: "#fff",
};

/* ─── Component ──────────────────────────────────────────────────────────── */
const HEADER = `timestamp,src_ip,dst_ip,src_port,dst_port,protocol,packets,bytes,duration_ms,flag_syn,flag_ack,flag_fin,flag_rst,pkt_rate,byte_rate\n`;

const DEMO_CSVS: Record<string, string> = {
    DDoS: HEADER + `2026-02-19 10:00:01,192.168.1.1,10.0.0.1,12345,80,TCP,5000,5000000,20,1,0,0,0,250000,250000000\n`,
    "Port Scan": HEADER + `2026-02-19 10:00:01,10.0.0.9,192.168.1.1,54321,22,TCP,1,50,5,1,0,0,1,200,10000\n`,
    "Brute Force": HEADER + `2026-02-19 10:00:01,192.168.2.99,192.168.1.5,44000,22,TCP,40,5000,8000,1,1,0,0,5,0.625\n`,
    Normal: HEADER + `2026-02-19 10:00:01,192.168.1.10,192.168.1.20,51234,443,TCP,8,1024,210,1,1,0,0,38,4876\n`,
};

export default function DemoPage() {
    const [model, setModel] = useState<ModelKey>("hybrid");
    const [file, setFile] = useState<File | null>(null);
    const [drag, setDrag] = useState(false);
    const [running, setRunning] = useState(false);
    const [result, setResult] = useState<PredictResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [demoRunning, setDemoRunning] = useState<string | null>(null);
    const [demoResults, setDemoResults] = useState<Record<string, PredictResult | { error: string }>>({});
    const inputRef = useRef<HTMLInputElement>(null);
    const resultRef = useRef<HTMLDivElement>(null);

    const pickFile = (f: File | null) => {
        if (f && /\.(csv|pcap)$/i.test(f.name)) { setFile(f); setError(null); }
    };

    const analyseCSV = async (csvContent: string, demoKey?: string) => {
        const setR = demoKey ? null : setRunning;
        if (demoKey) setDemoRunning(demoKey);
        else { setRunning(true); setResult(null); setError(null); }
        try {
            const form = new FormData();
            form.append("model", model);
            form.append("file", new Blob([csvContent], { type: "text/csv" }), "demo.csv");
            const res = await fetch(`${API_URL}/predict`, { method: "POST", body: form });
            if (!res.ok) {
                const err = await res.json().catch(() => ({ detail: res.statusText }));
                throw new Error(err.detail ?? `HTTP ${res.status}`);
            }
            const data: PredictResult = await res.json();
            if (demoKey) {
                setDemoResults(prev => ({ ...prev, [demoKey]: data }));
            } else {
                setResult(data);
                setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
            }
        } catch (e) {
            const msg = (e as Error).message;
            const errMsg = msg.includes("fetch") || msg.includes("Failed")
                ? "تعذّر الاتصال بالخادم — تأكد من تشغيل backend على :8000"
                : msg;
            if (demoKey) setDemoResults(prev => ({ ...prev, [demoKey]: { error: errMsg } }));
            else setError(errMsg);
        } finally {
            if (demoKey) setDemoRunning(null);
            else { if (setR) setR(false); }
        }
    };

    const analyse = async () => {
        const csvContent = file ? await file.text() : SAMPLE_CSV;
        await analyseCSV(csvContent);
    };

    const selectedModel = MODELS.find((m) => m.id === model)!;

    return (
        <AppShell title="Upload & Predict" subtitle="Analyze network traffic and detect intrusion threats">
            <CyberBackground />

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}
                    className="max-[900px]:!grid-cols-1">

                    {/* ── LEFT column ──────────────────────────────────────────── */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                        {/* Upload card */}
                        <div style={card}>
                            <div style={sectionHead}>
                                <FileText size={16} color="#00F0FF" />
                                Upload &amp; Predict
                                <span style={{
                                    marginRight: "auto", fontSize: 10, padding: "2px 8px", borderRadius: 20,
                                    border: "1px solid rgba(0,240,255,0.3)", color: "#00F0FF", background: "rgba(0,240,255,0.08)"
                                }}>
                                    Live Engine
                                </span>
                            </div>

                            <div style={{ padding: "16px 18px" }}>
                                <Tabs defaultValue="csv">
                                    <TabsList style={{ width: "100%", background: "rgba(255,255,255,0.05)", marginBottom: 16 }} dir="rtl">
                                        <TabsTrigger value="csv"
                                            className="flex-1 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                                            رفع CSV
                                        </TabsTrigger>
                                        <TabsTrigger value="manual"
                                            className="flex-1 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                                            إدخال يدوي
                                        </TabsTrigger>
                                    </TabsList>

                                    {/* CSV Tab */}
                                    <TabsContent value="csv" style={{ margin: 0 }}>
                                        <input id="csvUpload" ref={inputRef} type="file" accept=".csv,.pcap"
                                            style={{ display: "none" }}
                                            onChange={(e) => pickFile(e.target.files?.[0] ?? null)} />

                                        <div
                                            onClick={() => inputRef.current?.click()}
                                            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                                            onDragLeave={() => setDrag(false)}
                                            onDrop={(e) => { e.preventDefault(); setDrag(false); pickFile(e.dataTransfer.files[0] ?? null); }}
                                            style={{
                                                borderRadius: 12, padding: "28px 16px", textAlign: "center", cursor: "pointer",
                                                border: `2px dashed ${drag ? "#00F0FF" : "rgba(0,240,255,0.3)"}`,
                                                background: drag ? "rgba(0,240,255,0.08)" : "rgba(0,240,255,0.03)",
                                                transition: "all 0.2s ease",
                                            }}>
                                            <div style={{
                                                width: 52, height: 52, borderRadius: 14, margin: "0 auto 12px",
                                                border: "1px solid rgba(0,240,255,0.3)", background: "rgba(0,240,255,0.1)",
                                                display: "grid", placeItems: "center"
                                            }}>
                                                <Upload size={24} color="#00F0FF" />
                                            </div>
                                            {file ? (
                                                <>
                                                    <p style={{ fontSize: 13, fontWeight: 600, color: "#67e8f9", margin: "0 0 4px" }}>{file.name}</p>
                                                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0 }}>{(file.size / 1024).toFixed(1)} KB</p>
                                                </>
                                            ) : (
                                                <>
                                                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", margin: "0 0 4px" }}>اسحب ملف CSV أو PCAP هنا</p>
                                                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 12px" }}>أو انقر للاختيار</p>
                                                </>
                                            )}
                                            <label htmlFor="csvUpload" onClick={(e) => e.stopPropagation()}>
                                                <Button variant="outline" size="sm"
                                                    className="border-cyan-400/40 text-cyan-400 hover:bg-cyan-400/10 pointer-events-none">
                                                    اختيار ملف
                                                </Button>
                                            </label>
                                        </div>

                                        {file && (
                                            <div style={{
                                                marginTop: 10, padding: "10px 14px", borderRadius: 10,
                                                border: "1px solid rgba(0,240,255,0.2)", background: "rgba(0,240,255,0.06)",
                                                display: "flex", alignItems: "center", gap: 8
                                            }}>
                                                <Info size={14} color="#00F0FF" />
                                                <span style={{ fontSize: 12, color: "#67e8f9" }}>الملف جاهز — {file.name}</span>
                                            </div>
                                        )}

                                        {!file && (
                                            <p style={{ marginTop: 10, fontSize: 11, color: "rgba(255,255,255,0.3)", textAlign: "center" }}>
                                                بدون ملف سيتم تحليل البيانات النموذجية تلقائياً
                                            </p>
                                        )}
                                    </TabsContent>

                                    {/* Manual Tab */}
                                    <TabsContent value="manual" style={{ margin: 0 }}>
                                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>أدخل قيم المتغيرات:</p>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                            {FEATURES.map(([name, def, unit]) => (
                                                <div key={name}>
                                                    <Label style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 4 }}>
                                                        {name} <span style={{ color: "rgba(255,255,255,0.25)" }}>({unit})</span>
                                                    </Label>
                                                    <Input defaultValue={def}
                                                        style={{
                                                            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                                                            color: "#fff", height: 36, fontSize: 13
                                                        }} />
                                                </div>
                                            ))}
                                        </div>
                                    </TabsContent>
                                </Tabs>

                                <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "16px 0" }} />

                                <Button onClick={analyse} disabled={running}
                                    style={{
                                        width: "100%", background: "#06b6d4", color: "#000", fontWeight: 700,
                                        height: 44, fontSize: 14, borderRadius: 10, border: "none",
                                        cursor: running ? "not-allowed" : "pointer", opacity: running ? 0.7 : 1
                                    }}>
                                    {running
                                        ? <><Zap size={15} style={{ marginLeft: 6 }} /> جارٍ التحليل...</>
                                        : <><Play size={15} style={{ marginLeft: 6 }} /> تشغيل التنبؤ</>}
                                </Button>
                            </div>
                        </div>

                        {/* Error state */}
                        {error && (
                            <div style={{ ...card, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(20,5,5,0.93)" }}>
                                <div style={{ padding: "14px 18px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                                    <ServerCrash size={18} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
                                    <div>
                                        <p style={{ fontSize: 13, fontWeight: 600, color: "#f87171", margin: "0 0 4px" }}>خطأ في التحليل</p>
                                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: 0 }}>{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Results */}
                        {result && (
                            <div style={{
                                ...card,
                                border: `1px solid ${result.risk === "HIGH" ? "rgba(239,68,68,0.3)" : result.risk === "MEDIUM" ? "rgba(250,204,21,0.3)" : "rgba(34,197,94,0.3)"}`,
                                background: result.risk === "HIGH" ? "rgba(20,5,5,0.93)" : result.risk === "MEDIUM" ? "rgba(20,15,5,0.93)" : "rgba(5,20,10,0.93)"
                            }}>

                                <div style={{ ...sectionHead }}>
                                    {result.risk === "HIGH"
                                        ? <AlertTriangle size={16} color="#f87171" />
                                        : <CheckCircle2 size={16} color="#4ade80" />}
                                    نتيجة التحليل
                                    <span style={{
                                        marginRight: "auto", fontSize: 10, padding: "2px 8px", borderRadius: 20,
                                        border: `1px solid ${RISK_COLOR[result.risk]}40`,
                                        color: RISK_COLOR[result.risk], background: RISK_COLOR[result.risk] + "15"
                                    }}>
                                        {result.model.toUpperCase()}
                                    </span>
                                </div>

                                {/* 4 stat boxes */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, padding: "16px 18px 10px" }}>
                                    {[
                                        { label: "التصنيف", value: result.label, color: RISK_COLOR[result.risk] },
                                        { label: "الثقة", value: `${(result.confidence * 100).toFixed(1)}%`, color: "#67e8f9" },
                                        { label: "مستوى الخطر", value: result.risk, color: RISK_COLOR[result.risk] },
                                        { label: "السجلات", value: result.records.toLocaleString(), color: "rgba(255,255,255,0.6)" },
                                    ].map(({ label, value, color }) => (
                                        <div key={label} style={{
                                            textAlign: "center", padding: "12px 6px", borderRadius: 12,
                                            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)"
                                        }}>
                                            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", margin: "0 0 5px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
                                            <p style={{ fontSize: 14, fontWeight: 900, color, margin: 0, wordBreak: "break-word" }}>{value}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Top features */}
                                {result.top_features.length > 0 && (
                                    <div style={{ padding: "4px 18px 16px" }}>
                                        <p style={{
                                            fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase",
                                            letterSpacing: "0.1em", margin: "6px 0 10px"
                                        }}>أبرز الميزات المؤثرة</p>
                                        {result.top_features.map((f) => (
                                            <div key={f.name} style={{ marginBottom: 8 }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                                    <span style={{ fontSize: 11, fontFamily: "monospace", color: "rgba(255,255,255,0.6)" }}>{f.name}</span>
                                                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                                                        {(f.impact * 100).toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                                                    <div style={{
                                                        height: "100%", borderRadius: 2,
                                                        width: `${f.impact * 100}%`,
                                                        background: `linear-gradient(90deg, ${selectedModel.color}, ${selectedModel.color}88)`
                                                    }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* File notes card */}
                        <div style={card}>
                            <div style={sectionHead}>
                                <Info size={15} color="#7A5FFF" />
                                ملاحظات حول ملف التجربة
                            </div>
                            <div style={{ padding: "16px 18px" }}>
                                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", margin: "0 0 10px", lineHeight: 1.7 }}>
                                    يجب أن يحتوي ملف CSV على أعمدة خصائص حركة الشبكة الرقمية.
                                </p>
                                <p style={{
                                    fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase",
                                    letterSpacing: "0.1em", marginBottom: 6
                                }}>الأعمدة المطلوبة</p>
                                <div style={{
                                    background: "rgba(0,0,0,0.4)", borderRadius: 10,
                                    border: "1px solid rgba(255,255,255,0.07)", padding: "10px 14px",
                                    fontFamily: "monospace", fontSize: 11, color: "#67e8f9",
                                    overflowX: "auto", marginBottom: 12, whiteSpace: "nowrap"
                                }}>
                                    timestamp, src_ip, dst_ip, src_port, dst_port, protocol, packets, bytes, label
                                </div>
                                <p style={{
                                    fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase",
                                    letterSpacing: "0.1em", marginBottom: 6
                                }}>بيانات نموذجية</p>
                                <div style={{
                                    background: "rgba(0,0,0,0.4)", borderRadius: 10,
                                    border: "1px solid rgba(255,255,255,0.07)", padding: "10px 14px",
                                    fontFamily: "monospace", fontSize: 10, overflowX: "auto", marginBottom: 14
                                }}>
                                    {[
                                        { row: "2026-02-19 10:00:01,192.168.1.10,...,8,1024,210,...,benign", pos: true },
                                        { row: "2026-02-19 10:00:05,192.168.1.45,...,2100,210000,15,...,ddos", pos: false },
                                    ].map(({ row, pos }, i) => (
                                        <div key={i} style={{
                                            color: pos ? "#4ade80" : "#f87171",
                                            marginBottom: i === 0 ? 4 : 0, whiteSpace: "nowrap"
                                        }}>
                                            {row}
                                        </div>
                                    ))}
                                </div>
                                <Button onClick={downloadSample} variant="outline" size="sm"
                                    style={{
                                        borderColor: "rgba(122,95,255,0.35)", color: "#a78bfa",
                                        background: "rgba(122,95,255,0.08)", fontSize: 12, height: 34, gap: 6
                                    }}>
                                    <Download size={13} /> تنزيل نموذج CSV
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT column ─────────────────────────────────────────── */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div style={card}>
                            <div style={sectionHead}>
                                <Cpu size={16} color="#7A5FFF" />
                                الإعدادات
                            </div>
                            <div style={{ padding: "16px 18px" }}>
                                <p style={{
                                    fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase",
                                    letterSpacing: "0.1em", marginBottom: 8
                                }}>نموذج التحليل</p>

                                {/* Segmented model selector */}
                                <div style={{
                                    display: "flex", borderRadius: 10, overflow: "hidden",
                                    border: "1px solid rgba(255,255,255,0.1)", marginBottom: 16
                                }}>
                                    {MODELS.map((m, i) => (
                                        <button key={m.id} onClick={() => setModel(m.id)}
                                            style={{
                                                flex: 1, padding: "8px 4px", border: "none", cursor: "pointer",
                                                borderRight: i < MODELS.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none",
                                                background: model === m.id ? m.color + "25" : "transparent",
                                                color: model === m.id ? m.color : "rgba(255,255,255,0.4)",
                                                transition: "all 0.15s ease", fontFamily: "inherit",
                                            }}>
                                            <div style={{ fontSize: 12, fontWeight: 700 }}>{m.label}</div>
                                            <div style={{ fontSize: 9, opacity: 0.7 }}>{m.desc}</div>
                                        </button>
                                    ))}
                                </div>

                                {/* Active model info */}
                                <div style={{
                                    padding: "10px 12px", borderRadius: 10, marginBottom: 14,
                                    border: `1px solid ${selectedModel.color}30`, background: selectedModel.color + "08"
                                }}>
                                    <p style={{
                                        fontSize: 10, color: selectedModel.color, fontWeight: 700, margin: "0 0 3px",
                                        textTransform: "uppercase", letterSpacing: "0.08em"
                                    }}>
                                        {selectedModel.label} Engine
                                    </p>
                                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0 }}>
                                        {selectedModel.id === "hybrid" && "RandomForest — أعلى دقة بالجمع بين CNN+LSTM"}
                                        {selectedModel.id === "cnn" && "GradientBoosting — استخراج سريع للأنماط المكانية"}
                                        {selectedModel.id === "lstm" && "LogisticRegression — كشف الأنماط الزمنية التسلسلية"}
                                    </p>
                                </div>

                                <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 14 }} />

                                <p style={{
                                    fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase",
                                    letterSpacing: "0.1em", marginBottom: 8
                                }}>قيود النظام</p>
                                {[["الصيغ", "CSV, PCAP"], ["الحد الأقصى", "50 MB"], ["السجلات", "100,000"], ["وقت المعالجة", "< 30s"]].map(([k, v]) => (
                                    <div key={k} style={{
                                        display: "flex", justifyContent: "space-between", padding: "7px 0",
                                        borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 12
                                    }}>
                                        <span style={{ color: "rgba(255,255,255,0.4)" }}>{k}</span>
                                        <span style={{ color: "rgba(255,255,255,0.75)", fontFamily: "monospace" }}>{v}</span>
                                    </div>
                                ))}

                                <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "14px 0" }} />

                                <Button onClick={analyse} disabled={running}
                                    style={{
                                        width: "100%", background: "#7A5FFF", color: "#fff", fontWeight: 700,
                                        height: 42, fontSize: 13, borderRadius: 10, border: "none", cursor: "pointer"
                                    }}>
                                    <Play size={14} style={{ marginLeft: 6 }} /> تشغيل التحليل
                                </Button>
                            </div>
                        </div>

                        {/* Backend status card */}
                        <div style={card}>
                            <div style={{ padding: "14px 18px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                    <span style={{
                                        width: 8, height: 8, borderRadius: "50%", background: "#4ade80",
                                        display: "inline-block", boxShadow: "0 0 6px #4ade80"
                                    }} />
                                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>محرك الاستدلال</span>
                                </div>
                                {[
                                    ["نموذج محمّل", true],
                                    ["sklearn pipeline", true],
                                    ["GPU / CPU", false],
                                ].map(([label, ok]) => (
                                    <div key={String(label)} style={{
                                        display: "flex", justifyContent: "space-between",
                                        padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 12
                                    }}>
                                        <span style={{ color: "rgba(255,255,255,0.4)" }}>{String(label)}</span>
                                        <span style={{ color: ok ? "#4ade80" : "#facc15" }}>{ok ? "✓" : "CPU"}</span>
                                    </div>
                                ))}
                                <p style={{
                                    fontSize: 10, color: "rgba(255,255,255,0.25)", margin: "10px 0 0",
                                    fontFamily: "monospace"
                                }}>{API_URL}/predict</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Demo examples box */}
            <div style={{ marginTop: 20, background: "rgba(7, 10, 28, 0.93)", border: "1px solid rgba(122,95,255,0.25)", borderRadius: 16, backdropFilter: "blur(20px)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 14, fontWeight: 700, color: "#fff" }}>
                    <Info size={15} color="#a78bfa" />
                    أمثلة تجريبية — جرّب هذه البيانات مع النموذج
                    <span style={{ marginRight: "auto", fontSize: 9, padding: "2px 8px", borderRadius: 20, border: "1px solid rgba(122,95,255,0.3)", color: "#a78bfa", background: "rgba(122,95,255,0.08)" }}>Demo CSV</span>
                </div>
                <div style={{ padding: "16px 18px" }}>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 14, lineHeight: 1.6 }}>
                        قم بتنزيل النموذج أعلاه وجرّب هذه السيناريوهات — كل سطر يمثل نوعاً مختلفاً من حركة الشبكة:
                    </p>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                    {["السيناريو", "packets", "bytes", "duration_ms", "dst_port", "زر التجربة", "النتيجة الحقيقية"].map(h => (
                                        <th key={h} style={{ padding: "8px 12px", textAlign: "right", color: "rgba(255,255,255,0.3)", fontWeight: 600, fontSize: 10 }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { scenario: "DDoS", packets: "5000", bytes: "5,000,000", dur: "20", port: "80", color: "#f87171" },
                                    { scenario: "Port Scan", packets: "1", bytes: "50", dur: "5", port: "22", color: "#fb923c" },
                                    { scenario: "Brute Force", packets: "40", bytes: "5000", dur: "8000", port: "22", color: "#facc15" },
                                    { scenario: "Normal", packets: "8", bytes: "1024", dur: "210", port: "443", color: "#4ade80" },
                                ].map((r) => {
                                    const key = r.scenario;
                                    const res = demoResults[key];
                                    const isLoading = demoRunning === key;
                                    const isPredictResult = res && !("error" in res);
                                    const riskColor = isPredictResult
                                        ? (RISK_COLOR[(res as PredictResult).risk] ?? "#fff")
                                        : "#f87171";
                                    return (
                                        <tr key={key} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                            <td style={{ padding: "9px 12px" }}>
                                                <span style={{ color: r.color, fontSize: 11, fontWeight: 700 }}>{r.scenario}</span>
                                            </td>
                                            <td style={{ padding: "9px 12px", fontFamily: "monospace", color: "rgba(255,255,255,0.6)" }}>{r.packets}</td>
                                            <td style={{ padding: "9px 12px", fontFamily: "monospace", color: "rgba(255,255,255,0.6)" }}>{r.bytes}</td>
                                            <td style={{ padding: "9px 12px", fontFamily: "monospace", color: "rgba(255,255,255,0.6)" }}>{r.dur}</td>
                                            <td style={{ padding: "9px 12px", fontFamily: "monospace", color: "rgba(255,255,255,0.6)" }}>{r.port}</td>
                                            <td style={{ padding: "9px 12px" }}>
                                                <button
                                                    onClick={() => analyseCSV(DEMO_CSVS[key], key)}
                                                    disabled={isLoading}
                                                    style={{
                                                        padding: "4px 12px", borderRadius: 8, border: `1px solid ${r.color}50`,
                                                        background: r.color + "15", color: r.color, fontSize: 10,
                                                        cursor: isLoading ? "wait" : "pointer", fontFamily: "inherit",
                                                        opacity: isLoading ? 0.6 : 1
                                                    }}>
                                                    {isLoading ? "⏳ ..." : "▶ جرّب"}
                                                </button>
                                            </td>
                                            <td style={{ padding: "9px 12px", minWidth: 140 }}>
                                                {!res && !isLoading && (
                                                    <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 10 }}>اضغط لتجربة</span>
                                                )}
                                                {isLoading && (
                                                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>جارٍ التحليل...</span>
                                                )}
                                                {res && "error" in res && (
                                                    <span style={{ color: "#f87171", fontSize: 9 }}>خطأ</span>
                                                )}
                                                {isPredictResult && (
                                                    <span style={{
                                                        fontSize: 10, padding: "2px 8px", borderRadius: 10,
                                                        color: riskColor, background: riskColor + "18",
                                                        border: `1px solid ${riskColor}40`,
                                                        display: "inline-flex", gap: 4, alignItems: "center"
                                                    }}>
                                                        {(res as PredictResult).label} — {((res as PredictResult).confidence * 100).toFixed(0)}%
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>


        </AppShell>
    );
}
