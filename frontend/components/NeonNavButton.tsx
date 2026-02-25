"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, LucideIcon } from "lucide-react";

interface NeonNavButtonProps {
    href: string;
    icon: LucideIcon;
    label: string;
    sub: string;
    accent: "#00F0FF" | "#7A5FFF";
}

export function NeonNavButton({ href, icon: Icon, label, sub, accent }: NeonNavButtonProps) {
    return (
        <motion.div whileHover={{ scale: 1.025 }} whileTap={{ scale: 0.975 }} transition={{ duration: 0.15 }}>
            <Link href={href} className="block w-full">
                <div
                    className="group relative flex w-full items-center gap-4 rounded-2xl border px-4 py-3.5 transition-all duration-200 cursor-pointer select-none"
                    style={{
                        borderColor: `${accent}22`,
                        background: `linear-gradient(135deg, ${accent}08 0%, rgba(7,10,24,0.8) 100%)`,
                        backdropFilter: "blur(12px)",
                    }}
                    onMouseEnter={(e) => {
                        const el = e.currentTarget;
                        el.style.borderColor = `${accent}55`;
                        el.style.boxShadow = `0 0 24px ${accent}25, inset 0 0 20px ${accent}08`;
                    }}
                    onMouseLeave={(e) => {
                        const el = e.currentTarget;
                        el.style.borderColor = `${accent}22`;
                        el.style.boxShadow = "none";
                    }}
                >
                    {/* Icon box */}
                    <div
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition-all duration-200 group-hover:scale-105"
                        style={{ borderColor: `${accent}30`, background: `${accent}15` }}
                    >
                        <Icon className="h-4.5 w-4.5" style={{ color: accent }} size={18} />
                    </div>

                    {/* Text — force LTR inside so English title reads correctly */}
                    <div className="flex flex-1 flex-col gap-0.5 text-right" dir="rtl">
                        <span className="text-sm font-bold leading-none" style={{ color: accent }}>
                            {label}
                        </span>
                        <span className="text-[11px] leading-none text-white/40">{sub}</span>
                    </div>

                    {/* Chevron — in RTL this points left (toward the link direction) */}
                    <ChevronLeft
                        size={14}
                        className="shrink-0 text-white/20 transition-all duration-200 group-hover:text-white/50 group-hover:-translate-x-0.5"
                    />

                    {/* Subtle scan line on hover */}
                    <div
                        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        style={{
                            background: `linear-gradient(90deg, transparent 0%, ${accent}06 50%, transparent 100%)`,
                        }}
                    />
                </div>
            </Link>
        </motion.div>
    );
}
