"use client";

import Link from "next/link";
import { LucideIcon, ChevronLeft } from "lucide-react";
import { HubSettings } from "./HubSettingsPanel";

interface CyberNeonButtonProps {
    href: string;
    icon: LucideIcon;
    label: string;
    sub: string;
    accent: string;
    isActive: boolean;
    isDimmed: boolean;
    settings: HubSettings;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}

export function CyberNeonButton({
    href,
    icon: Icon,
    label,
    sub,
    accent,
    isActive,
    isDimmed,
    settings,
    onMouseEnter,
    onMouseLeave,
}: CyberNeonButtonProps) {
    const radius = settings.borderRadius;
    const iconBoxSize = settings.iconSize + 16; // icon + padding

    return (
        <div
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={{
                position: "relative",
                borderRadius: radius,
                opacity: isDimmed ? 0.3 : 1,
                transform: isActive ? "scale(1.015)" : "scale(1)",
                filter: isDimmed ? "grayscale(40%)" : "none",
                transition: "transform 0.18s ease, opacity 0.18s ease, filter 0.18s ease",
            }}
        >
            {/* Animated conic border */}
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    inset: -1.5,
                    borderRadius: radius + 2,
                    background: `conic-gradient(from var(--angle, 0deg), #00F0FF, #7A5FFF, #00FF9C 60%, #7A5FFF, #00F0FF)`,
                    animation: isActive
                        ? "spin-border 1s linear infinite"
                        : "spin-border 5s linear infinite",
                    opacity: isActive ? 0.85 : 0.25,
                    transition: "opacity 0.2s ease",
                    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                    padding: 1.5,
                    pointerEvents: "none",
                    zIndex: 0,
                }}
            />

            {/* Glow bloom */}
            {isActive && (
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        inset: -8,
                        borderRadius: radius + 8,
                        background: `radial-gradient(ellipse at 50% 50%, ${accent}40 0%, transparent 70%)`,
                        filter: "blur(10px)",
                        pointerEvents: "none",
                        zIndex: 0,
                    }}
                />
            )}

            {/* Clickable link — takes full area, z-index above decorations */}
            <Link
                href={href}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: `${settings.paddingY}px 14px`,
                    height: settings.buttonHeight,
                    borderRadius: radius,
                    background: isActive
                        ? `linear-gradient(135deg, ${accent}18 0%, rgba(6,10,24,0.93) 100%)`
                        : "rgba(6,10,24,0.80)",
                    backdropFilter: "blur(10px)",
                    border: `1px solid ${isActive ? accent + "55" : "rgba(255,255,255,0.07)"}`,
                    boxShadow: isActive ? `0 0 14px ${accent}28` : "none",
                    textDecoration: "none",
                    position: "relative",
                    zIndex: 1,
                    transition: "background 0.18s ease, border-color 0.18s ease",
                    overflow: "hidden",
                }}
            >
                {/* Icon box */}
                <div
                    style={{
                        width: iconBoxSize,
                        height: iconBoxSize,
                        minWidth: iconBoxSize,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: Math.max(6, radius - 4),
                        border: `1px solid ${isActive ? accent + "65" : accent + "25"}`,
                        background: isActive ? accent + "22" : accent + "0A",
                        boxShadow: isActive ? `0 0 10px ${accent}38` : "none",
                        transition: "all 0.18s ease",
                    }}
                >
                    <Icon size={settings.iconSize} style={{ color: isActive ? accent : accent + "99" }} />
                </div>

                {/* Text — dir=ltr so English reads left-to-right even in RTL page */}
                <div style={{ flex: 1, overflow: "hidden", textAlign: "right" }} dir="ltr">
                    <div
                        style={{
                            fontSize: settings.titleSize,
                            fontWeight: 600,
                            color: isActive ? "#fff" : accent + "cc",
                            textShadow: isActive ? `0 0 8px ${accent}65` : "none",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            lineHeight: 1.3,
                            transition: "color 0.18s ease",
                        }}
                    >
                        {label}
                    </div>
                    {settings.showSubtitle && (
                        <div
                            style={{
                                fontSize: settings.subtitleSize,
                                color: isActive ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.28)",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                lineHeight: 1.2,
                                transition: "color 0.18s ease",
                            }}
                        >
                            {sub}
                        </div>
                    )}
                </div>

                {/* Chevron */}
                <ChevronLeft
                    size={13}
                    style={{
                        color: isActive ? accent : "rgba(255,255,255,0.12)",
                        flexShrink: 0,
                        transition: "color 0.18s ease",
                    }}
                />
            </Link>
        </div>
    );
}
