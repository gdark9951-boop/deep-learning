"use client";

import { useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { CyberBackground } from "@/components/CyberBackground";
import { Button } from "@/components/ui/button";
import { FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { useScrollSpy } from "@/hooks/useScrollSpy";

/* ─── Sidebar config ── each item maps to a section id ─────────────────── */
const SECTIONS = [
    {
        category: "البداية",
        items: [
            { label: "التثبيت", id: "install" },
            { label: "الإعداد", id: "setup" },
            { label: "متطلبات النظام", id: "requirements" },
        ],
    },
    {
        category: "النماذج",
        items: [
            { label: "بنية CNN", id: "cnn" },
            { label: "تسلسل LSTM", id: "lstm" },
            { label: "المحرك الهجين", id: "hybrid" },
            { label: "عملية التدريب", id: "training" },
        ],
    },
    {
        category: "API Reference",
        items: [
            { label: "/predict", id: "api-predict" },
            { label: "/live Stream", id: "api-live" },
            { label: "المصادقة", id: "api-auth" },
            { label: "رموز الخطأ", id: "api-errors" },
        ],
    },
    {
        category: "الدليل",
        items: [
            { label: "رفع بيانات", id: "guide-upload" },
            { label: "تفسير النتائج", id: "guide-results" },
            { label: "إعداد التنبيهات", id: "guide-alerts" },
            { label: "التصدير", id: "guide-export" },
        ],
    },
];

/* flat list of all IDs for the scroll spy */
const ALL_IDS = SECTIONS.flatMap((s) => s.items.map((i) => i.id));

/* ─── Inline styles (unchanged from original) ───────────────────────────── */
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

/* ─── Content per section id ─────────────────────────────────────────────── */
type Section = {
    id: string;
    title: string;
    body: React.ReactNode;
};

const CONTENT: Section[] = [
    {
        id: "install",
        title: "التثبيت",
        body: (
            <>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 12, lineHeight: 1.7 }}>
                    مرحباً بك في منصة Cyber IDS. يشرح هذا الدليل كيفية إعداد نظام كشف التسلل.
                </p>
                <div style={{ borderRadius: 12, background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.08)", padding: "16px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                        {["#ef4444", "#eab308", "#22c55e"].map(c => (
                            <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.75 }} />
                        ))}
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginRight: 8, fontFamily: "sans-serif" }}>Terminal</span>
                    </div>
                    {`npm install cyber-ids-platform\nnpm run dev\npython backend/main.py`.split("\n").map((line, i) => (
                        <div key={i} style={{ display: "flex", gap: 10, marginBottom: 4 }}>
                            <span style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace", userSelect: "none" }}>$</span>
                            <span style={{ fontFamily: "monospace", fontSize: 13, color: "#4ade80" }}>{line}</span>
                        </div>
                    ))}
                </div>
            </>
        ),
    },
    {
        id: "setup",
        title: "الإعداد",
        body: (
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>
                بعد التثبيت، انسخ ملف <code style={{ fontFamily: "monospace", color: "#67e8f9", background: "rgba(255,255,255,0.06)", padding: "1px 5px", borderRadius: 4 }}>.env.example</code> إلى <code style={{ fontFamily: "monospace", color: "#67e8f9", background: "rgba(255,255,255,0.06)", padding: "1px 5px", borderRadius: 4 }}>.env.local</code> وعدّل المتغيرات المطلوبة: عنوان الخادم الخلفي، مفتاح API، وعنوان Redis.
            </p>
        ),
    },
    {
        id: "requirements",
        title: "متطلبات النظام",
        body: (
            <>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 12, lineHeight: 1.7 }}>
                    تأكد من توافر المكونات التالية قبل بدء التثبيت:
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {["Node.js 18+", "Python 3.9+", "CUDA GPU (اختياري)", "Redis Server"].map((p) => (
                        <div key={p} style={{
                            display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
                            borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                            fontSize: 12, color: "rgba(255,255,255,0.6)"
                        }}>
                            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#00F0FF", flexShrink: 0 }} />
                            {p}
                        </div>
                    ))}
                </div>
            </>
        ),
    },
    {
        id: "cnn",
        title: "بنية CNN",
        body: (
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>
                تعتمد بنية CNN على طبقات تلافيفية (Convolutional Layers) لاستخراج الميزات المكانية من حزم الشبكة. تتضمن 3 طبقات تلافيفية مع Batch Normalization و Dropout بنسبة 0.3 لمنع الإفراط في الملاءمة. وقت الاستدلال: 8ms متوسط.
            </p>
        ),
    },
    {
        id: "lstm",
        title: "تسلسل LSTM",
        body: (
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>
                يُعالج نموذج LSTM تسلسلات حزم الشبكة بطول 50 خطوة زمنية. يستخدم 2 طبقة LSTM متراكبة مع 128 وحدة مخفية، مما يمكّنه من اكتشاف أنماط الهجمات الزمنية كـ SlowLoris و TCP-FinWait. وقت الاستدلال: 18ms متوسط.
            </p>
        ),
    },
    {
        id: "hybrid",
        title: "المحرك الهجين",
        body: (
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>
                يجمع المحرك الهجين مخرجات CNN و LSTM عبر طبقة Fusion بأسلوب Late Fusion، مما يحقق دقة 99.2% على مجموعة البيانات القياسية NSL-KDD. هذا النموذج هو الافتراضي الموصى به لبيئات الإنتاج.
            </p>
        ),
    },
    {
        id: "training",
        title: "عملية التدريب",
        body: (
            <>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 12, lineHeight: 1.7 }}>
                    يمكن إعادة تدريب النماذج على بيانات مخصصة باستخدام:
                </p>
                <div style={{ borderRadius: 12, background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.08)", padding: "14px 16px" }}>
                    {["python train.py --model hybrid --epochs 50 --data ./data/custom.csv"].map((line, i) => (
                        <div key={i} style={{ display: "flex", gap: 10 }}>
                            <span style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace", userSelect: "none" }}>$</span>
                            <span style={{ fontFamily: "monospace", fontSize: 12, color: "#4ade80" }}>{line}</span>
                        </div>
                    ))}
                </div>
            </>
        ),
    },
    {
        id: "api-predict",
        title: "POST /predict",
        body: (
            <>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 12, lineHeight: 1.7 }}>
                    يقبل ملف CSV أو JSON يحتوي على ميزات الشبكة ويعيد نتيجة التصنيف.
                </p>
                <div style={{ borderRadius: 12, background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.08)", padding: "14px 16px" }}>
                    {[`curl -X POST http://localhost:8000/predict \\`, `  -H "Authorization: Bearer $TOKEN" \\`, `  -F "file=@traffic.csv"`].map((line, i) => (
                        <div key={i} style={{ display: "flex", gap: 10, marginBottom: 2 }}>
                            <span style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace", userSelect: "none" }}>$</span>
                            <span style={{ fontFamily: "monospace", fontSize: 12, color: "#4ade80" }}>{line}</span>
                        </div>
                    ))}
                </div>
            </>
        ),
    },
    {
        id: "api-live",
        title: "WebSocket /live",
        body: (
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>
                اتصال WebSocket مشفر يبث أحداث التهديد في الوقت الحقيقي. يرسل الخادم حدثاً JSON لكل حزمة مصنّفة تتجاوز عتبة الخطر 0.85. الاتصال: <code style={{ fontFamily: "monospace", color: "#67e8f9", background: "rgba(255,255,255,0.06)", padding: "1px 5px", borderRadius: 4 }}>wss://api.cyberids.ai/live</code>
            </p>
        ),
    },
    {
        id: "api-auth",
        title: "المصادقة",
        body: (
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>
                تستخدم جميع نقاط الـ API مصادقة JWT Bearer Token. احصل على رمزك من لوحة التحكم، وأرسله في رأس الطلب: <code style={{ fontFamily: "monospace", color: "#67e8f9", background: "rgba(255,255,255,0.06)", padding: "1px 5px", borderRadius: 4 }}>Authorization: Bearer &#123;token&#125;</code>
            </p>
        ),
    },
    {
        id: "api-errors",
        title: "رموز الخطأ",
        body: (
            <div>
                {[["400", "Invalid file format"], ["401", "Unauthorized — check token"], ["413", "File exceeds 50MB limit"], ["429", "Rate limit exceeded"], ["500", "Internal model error"]].map(([code, msg]) => (
                    <div key={code} style={{ display: "flex", gap: 12, padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12 }}>
                        <span style={{ fontFamily: "monospace", color: "#f87171", fontWeight: 700, width: 36 }}>{code}</span>
                        <span style={{ color: "rgba(255,255,255,0.55)" }}>{msg}</span>
                    </div>
                ))}
            </div>
        ),
    },
    {
        id: "guide-upload",
        title: "رفع بيانات",
        body: (
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>
                انتقل إلى صفحة Demo وارفع ملف CSV بصيغة CICIDS2017 أو NSL-KDD، أو استخدم واجهة السحب والإفلات. الحد الأقصى للملف 50MB ويدعم ما يصل إلى 100,000 سجل.
            </p>
        ),
    },
    {
        id: "guide-results",
        title: "تفسير النتائج",
        body: (
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>
                تُعيد النتائج: التصنيف (طبيعي / نوع الهجوم)، ودرجة الثقة (0–100%)، ومستوى الخطر (LOW/MED/HIGH). انتقل إلى صفحة Explainability لرؤية أبرز الميزات التي أثّرت في القرار.
            </p>
        ),
    },
    {
        id: "guide-alerts",
        title: "إعداد التنبيهات",
        body: (
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>
                في إعدادات النظام، حدد عتبة الخطر لإرسال التنبيهات (افتراضي: HIGH). يدعم النظام تنبيهات البريد الإلكتروني، Slack Webhook، وPagerDuty API.
            </p>
        ),
    },
    {
        id: "guide-export",
        title: "التصدير",
        body: (
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>
                صدّر نتائج التحليل بصيغة CSV أو JSON أو PDF من خلال زر التصدير في صفحة Live Monitor أو عبر نقطة API: <code style={{ fontFamily: "monospace", color: "#67e8f9", background: "rgba(255,255,255,0.06)", padding: "1px 5px", borderRadius: 4 }}>GET /export?format=csv&from=2024-01-01</code>
            </p>
        ),
    },
];

/* ─── Component ─────────────────────────────────────────────────────────── */
export default function DocsPage() {
    /* track which section is visible */
    const activeId = useScrollSpy(ALL_IDS);

    /* smooth scroll + update hash without navigation */
    const scrollToId = useCallback((id: string) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        // update URL hash without triggering Next.js navigation
        history.replaceState(null, "", `#${id}`);
    }, []);

    return (
        <AppShell title="Documentation" subtitle="Technical reference manual, API guide, and system architecture" badge="v2.0">
            <CyberBackground />

            <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 20, alignItems: "start" }}
                className="max-[800px]:!grid-cols-1">

                {/* ── Sidebar nav (same visual, now functional) ──────────────── */}
                <div style={{ ...card, position: "sticky", top: 80, zIndex: 10, pointerEvents: "auto" }}>
                    <div style={{ padding: "12px 0" }}>
                        {SECTIONS.map((sec) => (
                            <div key={sec.category} style={{ marginBottom: 8 }}>
                                <p style={{
                                    fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase",
                                    letterSpacing: "0.12em", padding: "6px 16px 4px",
                                    borderRight: "2px solid rgba(0,240,255,0.25)", margin: 0,
                                }}>
                                    {sec.category}
                                </p>
                                {sec.items.map((item) => {
                                    const isActive = activeId === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => scrollToId(item.id)}
                                            style={{
                                                display: "flex", alignItems: "center", gap: 7,
                                                width: "100%", padding: "7px 16px",
                                                fontSize: 12, border: "none", cursor: "pointer",
                                                fontFamily: "inherit", textAlign: "right",
                                                background: isActive ? "rgba(0,240,255,0.08)" : "transparent",
                                                color: isActive ? "#67e8f9" : "rgba(255,255,255,0.45)",
                                                transition: "all 0.15s ease",
                                                pointerEvents: "auto",
                                            }}
                                        >
                                            {isActive && <ChevronLeft size={11} color="#67e8f9" />}
                                            {item.label}
                                        </button>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Article (all sections stacked with IDs) ─────────────────── */}
                <div style={card}>
                    <div style={sectionHead}>
                        <FileText size={15} color="#00F0FF" />
                        التوثيق التقني
                        <span style={{
                            marginRight: "auto", fontSize: 9, padding: "2px 7px", borderRadius: 20,
                            border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.4)",
                        }}>
                            docs
                        </span>
                    </div>

                    <div style={{ padding: "8px 0" }}>
                        {CONTENT.map((section, index) => (
                            <section
                                key={section.id}
                                id={section.id}
                                style={{
                                    padding: "22px 24px",
                                    borderBottom: index < CONTENT.length - 1
                                        ? "1px solid rgba(255,255,255,0.05)"
                                        : "none",
                                    // Add some scroll-margin so the sticky header doesn't cover the section title
                                    scrollMarginTop: 120,
                                }}
                            >
                                <h2 style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: "0 0 12px" }}>
                                    {section.title}
                                </h2>
                                {section.body}
                            </section>
                        ))}

                        {/* Bottom nav buttons */}
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 24px" }}>
                            <Button variant="outline" size="sm"
                                style={{ borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                                <ChevronRight size={13} style={{ marginLeft: 4 }} /> السابق
                            </Button>
                            <Button variant="outline" size="sm"
                                style={{ borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                                التالي <ChevronLeft size={13} style={{ marginRight: 4 }} />
                            </Button>
                        </div>
                    </div>
                </div>

            </div>
        </AppShell>
    );
}
