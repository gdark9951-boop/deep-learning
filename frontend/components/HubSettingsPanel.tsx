"use client";

import { RotateCcw } from "lucide-react";

export interface HubSettings {
    panelWidth: "xs" | "sm" | "md";
    buttonHeight: number;
    iconSize: number;
    titleSize: number;
    gap: number;
    borderRadius: number;
    showSubtitle: boolean;
    paddingY: number;
    subtitleSize: number;
}

export const DEFAULT_SETTINGS: HubSettings = {
    panelWidth: "sm",
    buttonHeight: 44,
    paddingY: 8,
    iconSize: 16,
    titleSize: 14,
    subtitleSize: 11,
    gap: 8,
    borderRadius: 12,
    showSubtitle: true,
};

const STORAGE_KEY = "cyberHubSettings";

export function loadSettings(): HubSettings {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
    } catch {
        return DEFAULT_SETTINGS;
    }
}

export function saveSettings(s: HubSettings) {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

interface Props {
    settings: HubSettings;
    onChange: (s: HubSettings) => void;
}

const sliderStyle: React.CSSProperties = {
    width: "100%",
    accentColor: "#22d3ee",
    cursor: "pointer",
    height: 4,
};

function Row({ label, value, children }: { label: string; value?: string | number; children: React.ReactNode }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "rgba(255,255,255,0.45)" }}>
                <span>{label}</span>
                {value !== undefined && <span style={{ color: "#22d3ee", fontFamily: "monospace" }}>{value}</span>}
            </div>
            {children}
        </div>
    );
}

export function HubSettingsPanel({ settings, onChange }: Props) {
    const set = (patch: Partial<HubSettings>) => {
        const next = { ...settings, ...patch };
        onChange(next);
        saveSettings(next);
    };

    return (
        <div style={{
            marginTop: 12, paddingTop: 12,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            display: "flex", flexDirection: "column", gap: 10,
        }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                    إعدادات اللوحة
                </span>
                <button
                    onClick={() => { onChange(DEFAULT_SETTINGS); saveSettings(DEFAULT_SETTINGS); }}
                    style={{
                        display: "flex", alignItems: "center", gap: 4,
                        fontSize: 9, color: "rgba(255,255,255,0.4)",
                        background: "none", border: "none", cursor: "pointer", padding: "2px 4px",
                        borderRadius: 4,
                    }}
                >
                    <RotateCcw size={10} /> إعادة تعيين
                </button>
            </div>

            {/* Panel width */}
            <Row label="عرض اللوحة">
                <div style={{ display: "flex", gap: 4 }}>
                    {(["xs", "sm", "md"] as const).map((w) => (
                        <button
                            key={w}
                            onClick={() => set({ panelWidth: w })}
                            style={{
                                flex: 1, padding: "3px 0",
                                borderRadius: 6, fontSize: 10, fontWeight: 700,
                                transition: "all 0.15s",
                                background: settings.panelWidth === w ? "rgba(34,211,238,0.18)" : "rgba(255,255,255,0.04)",
                                border: `1px solid ${settings.panelWidth === w ? "rgba(34,211,238,0.4)" : "rgba(255,255,255,0.1)"}`,
                                color: settings.panelWidth === w ? "#22d3ee" : "rgba(255,255,255,0.4)",
                                cursor: "pointer",
                            }}
                        >
                            {w.toUpperCase()}
                        </button>
                    ))}
                </div>
            </Row>

            {/* Button height */}
            <Row label="ارتفاع الزر" value={`${settings.buttonHeight}px`}>
                <input type="range" min={32} max={64} step={2}
                    value={settings.buttonHeight}
                    onChange={(e) => set({ buttonHeight: +e.target.value })}
                    style={sliderStyle}
                />
            </Row>

            {/* Icon size */}
            <Row label="حجم الأيقونة" value={`${settings.iconSize}px`}>
                <input type="range" min={12} max={24} step={1}
                    value={settings.iconSize}
                    onChange={(e) => set({ iconSize: +e.target.value })}
                    style={sliderStyle}
                />
            </Row>

            {/* Title font */}
            <Row label="حجم الخط" value={`${settings.titleSize}px`}>
                <input type="range" min={10} max={18} step={1}
                    value={settings.titleSize}
                    onChange={(e) => set({ titleSize: +e.target.value })}
                    style={sliderStyle}
                />
            </Row>

            {/* Gap */}
            <Row label="المسافة بين الأزرار" value={`${settings.gap}px`}>
                <input type="range" min={2} max={20} step={2}
                    value={settings.gap}
                    onChange={(e) => set({ gap: +e.target.value })}
                    style={sliderStyle}
                />
            </Row>

            {/* Border radius */}
            <Row label="استدارة الحواف" value={`${settings.borderRadius}px`}>
                <input type="range" min={4} max={24} step={2}
                    value={settings.borderRadius}
                    onChange={(e) => set({ borderRadius: +e.target.value })}
                    style={sliderStyle}
                />
            </Row>

            {/* Show subtitle toggle */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>إظهار الوصف</span>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                    <div
                        onClick={() => set({ showSubtitle: !settings.showSubtitle })}
                        style={{
                            width: 36, height: 20, borderRadius: 10,
                            background: settings.showSubtitle ? "#22d3ee" : "rgba(255,255,255,0.12)",
                            position: "relative", cursor: "pointer",
                            transition: "background 0.2s",
                            border: "1px solid rgba(255,255,255,0.1)",
                        }}
                    >
                        <div style={{
                            position: "absolute", top: 2,
                            left: settings.showSubtitle ? 18 : 2,
                            width: 14, height: 14, borderRadius: "50%",
                            background: "#fff", transition: "left 0.2s",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
                        }} />
                    </div>
                </label>
            </div>
        </div>
    );
}
