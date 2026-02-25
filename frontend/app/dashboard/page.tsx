"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Bell, Settings, Shield, Wifi, AlertTriangle, Activity, TrendingUp, Globe } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamic import for map (avoids SSR issues)
const WorldMap = dynamic(() => import("../../components/WorldMap"), { ssr: false });

// ─── Data ────────────────────────────────────────────────────────────────────

type MiniPoint = { name: string; v: number };
type StackPoint = { name: string; low: number; med: number; high: number };
type TimePoint = { t: string; attacks: number; benign: number };

const miniSeries: MiniPoint[] = [
  { name: "1", v: 20 }, { name: "2", v: 35 }, { name: "3", v: 18 },
  { name: "4", v: 52 }, { name: "5", v: 26 }, { name: "6", v: 60 }, { name: "7", v: 44 },
];

const timelineSeries: TimePoint[] = [
  { t: "Jan", attacks: 120, benign: 980 },
  { t: "Feb", attacks: 210, benign: 1200 },
  { t: "Mar", attacks: 180, benign: 1100 },
  { t: "Apr", attacks: 340, benign: 1400 },
  { t: "May", attacks: 290, benign: 1350 },
  { t: "Jun", attacks: 450, benign: 1600 },
  { t: "Jul", attacks: 380, benign: 1500 },
];

const externalBars: StackPoint[] = [
  { name: "EA|ISO", low: 10, med: 25, high: 70 },
  { name: "EA|SR", low: 15, med: 35, high: 55 },
  { name: "IA|ISO", low: 22, med: 40, high: 45 },
  { name: "IA|SR", low: 18, med: 30, high: 85 },
];

const internalBars: StackPoint[] = [
  { name: "Q1", low: 12, med: 28, high: 40 },
  { name: "Q2", low: 16, med: 38, high: 78 },
  { name: "Q3", low: 20, med: 45, high: 60 },
  { name: "Q4", low: 14, med: 32, high: 55 },
];

const threatPie = [
  { name: "Critical", value: 15, color: "#f87171" },
  { name: "High", value: 28, color: "#fb923c" },
  { name: "Medium", value: 35, color: "#a78bfa" },
  { name: "Low", value: 22, color: "#34d399" },
];

const recentAlerts = [
  { id: 1, time: "13:42:01", src: "192.168.1.45", type: "Port Scan", level: "high" },
  { id: 2, time: "13:41:38", src: "10.0.0.23", type: "SQL Injection", level: "critical" },
  { id: 3, time: "13:40:55", src: "172.16.0.8", type: "Brute Force", level: "medium" },
  { id: 4, time: "13:39:12", src: "192.168.2.100", type: "DDoS Attempt", level: "high" },
  { id: 5, time: "13:38:47", src: "10.0.1.15", type: "XSS Attempt", level: "low" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cn(...c: (string | undefined | false)[]) {
  return c.filter(Boolean).join(" ");
}

const TOOLTIP_STYLE = {
  background: "rgba(7,10,24,0.95)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 10,
  color: "white",
  fontSize: 12,
};

// ─── Corner Accents ───────────────────────────────────────────────────────────

function CornerAccents({ color = "cyan" }: { color?: "cyan" | "violet" | "red" | "green" }) {
  const c =
    color === "cyan" ? "border-cyan-400/70"
      : color === "violet" ? "border-violet-400/70"
        : color === "red" ? "border-red-400/70"
          : "border-emerald-400/70";
  return (
    <>
      <span className={`pointer-events-none absolute left-2 top-2 h-3 w-3 border-l-2 border-t-2 ${c}`} />
      <span className={`pointer-events-none absolute right-2 top-2 h-3 w-3 border-r-2 border-t-2 ${c}`} />
      <span className={`pointer-events-none absolute left-2 bottom-2 h-3 w-3 border-b-2 border-l-2 ${c}`} />
      <span className={`pointer-events-none absolute bottom-2 right-2 h-3 w-3 border-b-2 border-r-2 ${c}`} />
    </>
  );
}

// ─── HUD Card ────────────────────────────────────────────────────────────────

function HudCard({
  title, className, children, accent = "cyan", delay = 0,
}: {
  title?: string; className?: string; children: React.ReactNode;
  accent?: "cyan" | "violet" | "red" | "green"; delay?: number;
}) {
  const glowColor =
    accent === "cyan" ? "rgba(34,211,238,0.06)"
      : accent === "violet" ? "rgba(167,139,250,0.06)"
        : accent === "red" ? "rgba(248,113,113,0.06)"
          : "rgba(52,211,153,0.06)";

  const borderColor =
    accent === "cyan" ? "rgba(34,211,238,0.18)"
      : accent === "violet" ? "rgba(167,139,250,0.18)"
        : accent === "red" ? "rgba(248,113,113,0.18)"
          : "rgba(52,211,153,0.18)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn("relative rounded-xl p-4 backdrop-blur-xl", className)}
      style={{
        background: `linear-gradient(135deg, rgba(255,255,255,0.04) 0%, ${glowColor} 100%)`,
        border: `1px solid ${borderColor}`,
        boxShadow: `0 0 0 1px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.06)`,
      }}
    >
      <CornerAccents color={accent} />
      {title && (
        <div className="mb-3 flex items-center gap-3">
          <span className="text-[10px] font-semibold tracking-[0.2em] text-white/60 uppercase">
            {title}
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent" />
        </div>
      )}
      {children}
    </motion.div>
  );
}

// ─── Stat Pill ───────────────────────────────────────────────────────────────

function StatPill({
  icon, label, value, sub, tone = "cyan",
}: {
  icon: React.ReactNode; label: string; value: string; sub?: string;
  tone?: "cyan" | "violet" | "red" | "green";
}) {
  const bg =
    tone === "cyan" ? "from-cyan-500/15 to-transparent border-cyan-400/20"
      : tone === "violet" ? "from-violet-500/15 to-transparent border-violet-400/20"
        : tone === "red" ? "from-red-500/15 to-transparent border-red-400/20"
          : "from-emerald-500/15 to-transparent border-emerald-400/20";

  const iconBg =
    tone === "cyan" ? "bg-cyan-400/10 text-cyan-300"
      : tone === "violet" ? "bg-violet-400/10 text-violet-300"
        : tone === "red" ? "bg-red-400/10 text-red-300"
          : "bg-emerald-400/10 text-emerald-300";

  return (
    <div className={cn("relative rounded-lg border bg-gradient-to-b p-3", bg)}>
      <div className="flex items-center gap-3">
        <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", iconBg)}>
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-[10px] text-white/50 tracking-wide uppercase">{label}</div>
          <div className="text-lg font-bold text-white leading-tight">{value}</div>
          {sub && <div className="text-[10px] text-white/40">{sub}</div>}
        </div>
      </div>
    </div>
  );
}

// ─── Mini Sparkline ──────────────────────────────────────────────────────────

function MiniSparkline({ color = "#22d3ee" }: { color?: string }) {
  return (
    <div className="h-14 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={miniSeries} margin={{ top: 4, bottom: 0, left: 0, right: 0 }}>
          <defs>
            <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.5} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
            fill={`url(#spark-${color.replace("#", "")})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Stacked Bar Chart ───────────────────────────────────────────────────────

function StackedIsoBars({ data }: { data: StackPoint[] }) {
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barCategoryGap={20} margin={{ left: -10, right: 4 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }}
            axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
            axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={TOOLTIP_STYLE} />
          <Bar dataKey="low" stackId="a" fill="rgba(52,211,153,0.7)" radius={[0, 0, 6, 6]} />
          <Bar dataKey="med" stackId="a" fill="rgba(167,139,250,0.7)" />
          <Bar dataKey="high" stackId="a" fill="rgba(248,113,113,0.8)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Timeline Chart ──────────────────────────────────────────────────────────

function TimelineChart() {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={timelineSeries} margin={{ left: -10, right: 4, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="gAtk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f87171" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gBen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="t" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }}
            axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
            axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={TOOLTIP_STYLE} />
          <Area type="monotone" dataKey="benign" stroke="#22d3ee" strokeWidth={2} fill="url(#gBen)" />
          <Area type="monotone" dataKey="attacks" stroke="#f87171" strokeWidth={2} fill="url(#gAtk)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Threat Pie ──────────────────────────────────────────────────────────────

function ThreatPie() {
  return (
    <div className="flex items-center gap-4">
      <div className="h-36 w-36 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={threatPie} cx="50%" cy="50%" innerRadius={38} outerRadius={60}
              dataKey="value" strokeWidth={0}>
              {threatPie.map((entry, i) => (
                <Cell key={i} fill={entry.color} opacity={0.85} />
              ))}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2 flex-1">
        {threatPie.map((t) => (
          <div key={t.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: t.color }} />
              <span className="text-white/60">{t.name}</span>
            </div>
            <span className="font-semibold text-white">{t.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Alert Level Badge ───────────────────────────────────────────────────────

function LevelBadge({ level }: { level: string }) {
  const cls =
    level === "critical" ? "bg-red-500/20 text-red-300 border-red-500/30"
      : level === "high" ? "bg-orange-500/20 text-orange-300 border-orange-500/30"
        : level === "medium" ? "bg-violet-500/20 text-violet-300 border-violet-500/30"
          : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", cls)}>
      {level}
    </span>
  );
}

// ─── Cyber Backdrop ──────────────────────────────────────────────────────────

function CyberBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-[#060A18]" />
      {/* Radial glows */}
      <div className="absolute inset-0"
        style={{
          backgroundImage: [
            "radial-gradient(ellipse 60% 40% at 15% 10%, rgba(34,211,238,0.18) 0%, transparent 70%)",
            "radial-gradient(ellipse 50% 35% at 85% 15%, rgba(167,139,250,0.15) 0%, transparent 70%)",
            "radial-gradient(ellipse 40% 30% at 70% 85%, rgba(34,211,238,0.10) 0%, transparent 70%)",
          ].join(","),
        }}
      />
      {/* Grid */}
      <div className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.07) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
    </div>
  );
}

// ─── Scanning Line Animation ─────────────────────────────────────────────────

function ScanLine() {
  return (
    <motion.div
      className="pointer-events-none absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"
      animate={{ top: ["0%", "100%"] }}
      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
    />
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [range, setRange] = useState<"2022-2024" | "2023-2024">("2022-2024");
  const rangeLabel = range === "2022-2024" ? "Jan 2022 – Jan 2024" : "Jan 2023 – Jan 2024";

  return (
    <div className="min-h-screen font-sans text-white">
      <CyberBackdrop />

      {/* ── Top HUD Bar ── */}
      <div className="sticky top-0 z-50 mx-auto max-w-[1600px] px-4 pt-3">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative flex items-center justify-between overflow-hidden rounded-xl px-5 py-3"
          style={{
            background: "rgba(6,10,24,0.85)",
            border: "1px solid rgba(34,211,238,0.18)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 0 40px rgba(34,211,238,0.06), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <ScanLine />
          <CornerAccents />

          {/* Left: Date */}
          <div className="text-[11px]">
            <div className="font-semibold text-white/90">12 / 10 / 2023</div>
            <div className="text-white/45">Tuesday · 13:00</div>
          </div>

          {/* Center: Title + Range */}
          <div className="absolute left-1/2 -translate-x-1/2 text-center">
            <div className="text-[11px] font-semibold tracking-[0.3em] text-cyan-200/90 uppercase">
              I/E Findings Dashboard
            </div>
            <div className="mt-1 flex items-center justify-center gap-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
              <button
                onClick={() => setRange(r => r === "2022-2024" ? "2023-2024" : "2022-2024")}
                className="rounded-md border border-white/10 bg-white/5 px-3 py-0.5 text-[10px] text-white/60 hover:bg-white/10 transition-colors"
              >
                {rangeLabel}
              </button>
            </div>
          </div>

          {/* Right: Status + Actions */}
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[11px] text-emerald-300">
              <Shield className="h-3.5 w-3.5" /> SECURE
            </span>
            {[Bell, Settings].map((Icon, i) => (
              <button key={i}
                className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all">
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Main Grid ── */}
      <div className="mx-auto max-w-[1600px] px-4 pb-10 pt-4">
        <div className="grid grid-cols-12 gap-4">

          {/* ── LEFT COLUMN ── */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">

            {/* External KPIs */}
            <HudCard title="External Findings" accent="cyan" delay={0.05}>
              <div className="grid grid-cols-2 gap-3">
                <StatPill icon={<Globe className="h-4 w-4" />}
                  label="Total External" value="367.9K" sub="findings" tone="cyan" />
                <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                  <div className="text-[10px] text-white/50 mb-1 uppercase tracking-wide">Activity</div>
                  <MiniSparkline color="#22d3ee" />
                </div>
                <StatPill icon={<Shield className="h-4 w-4" />}
                  label="Closed" value="560" tone="green" />
                <StatPill icon={<AlertTriangle className="h-4 w-4" />}
                  label="Open" value="427" tone="red" />
              </div>
            </HudCard>

            {/* External Stacked Bars */}
            <HudCard title="Open External Findings" accent="cyan" delay={0.1}>
              <StackedIsoBars data={externalBars} />
              <div className="mt-2 flex items-center gap-4 text-[10px] text-white/50">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400/80" />Low</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-violet-400/80" />Med</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-400/80" />High</span>
              </div>
            </HudCard>

            {/* Threat Distribution */}
            <HudCard title="Threat Distribution" accent="violet" delay={0.15}>
              <ThreatPie />
            </HudCard>
          </div>

          {/* ── CENTER COLUMN ── */}
          <div className="col-span-12 lg:col-span-6 flex flex-col gap-4">

            {/* Top KPI Row */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: <Activity className="h-4 w-4" />, label: "Total Findings", value: "5.6M", tone: "cyan" as const },
                { icon: <Shield className="h-4 w-4" />, label: "Total Closed", value: "5.1M", tone: "green" as const },
                { icon: <AlertTriangle className="h-4 w-4" />, label: "Total Open", value: "0.5M", tone: "red" as const },
              ].map((s, i) => (
                <HudCard key={i} delay={0.05 * i} accent={s.tone}>
                  <StatPill {...s} />
                </HudCard>
              ))}
            </div>

            {/* Timeline Chart */}
            <HudCard title="Attack Timeline — 2022 / 2024" accent="cyan" delay={0.1}>
              <TimelineChart />
              <div className="mt-2 flex items-center gap-6 text-[10px] text-white/50">
                <span className="flex items-center gap-1.5"><span className="h-px w-6 bg-cyan-400" />Benign Traffic</span>
                <span className="flex items-center gap-1.5"><span className="h-px w-6 bg-red-400" />Attack Events</span>
              </div>
            </HudCard>

            {/* World Map */}
            <HudCard title="Overall Attacks — Global Map" accent="violet" delay={0.15} className="overflow-hidden">
              <div className="relative -mx-4 -mb-4 overflow-hidden rounded-b-xl">
                <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-transparent to-black/40" />
                <WorldMap />
                <div className="absolute bottom-3 left-4 right-4 z-20 flex items-center gap-2">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <span className="text-[10px] text-white/40 tracking-widest">0 ··· 16,000 events</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </div>
              </div>
            </HudCard>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">

            {/* Internal KPIs */}
            <HudCard title="Internal Findings" accent="violet" delay={0.05}>
              <div className="grid grid-cols-2 gap-3">
                <StatPill icon={<Wifi className="h-4 w-4" />}
                  label="Total Internal" value="367.9K" sub="findings" tone="violet" />
                <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                  <div className="text-[10px] text-white/50 mb-1 uppercase tracking-wide">Activity</div>
                  <MiniSparkline color="#a78bfa" />
                </div>
                <StatPill icon={<Shield className="h-4 w-4" />}
                  label="Closed" value="560" tone="green" />
                <StatPill icon={<AlertTriangle className="h-4 w-4" />}
                  label="Open" value="427" tone="red" />
              </div>
            </HudCard>

            {/* Internal Stacked Bars */}
            <HudCard title="Open Internal Findings" accent="violet" delay={0.1}>
              <StackedIsoBars data={internalBars} />
              <div className="mt-2 flex items-center gap-4 text-[10px] text-white/50">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400/80" />Low</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-violet-400/80" />Med</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-400/80" />High</span>
              </div>
            </HudCard>

            {/* Recent Alerts */}
            <HudCard title="Recent Alerts" accent="red" delay={0.15}>
              <div className="space-y-2">
                {recentAlerts.map((a) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * a.id }}
                    className="flex items-center justify-between rounded-lg border border-white/8 bg-white/4 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="text-[11px] font-medium text-white/90 truncate">{a.type}</div>
                      <div className="text-[10px] text-white/40">{a.src} · {a.time}</div>
                    </div>
                    <LevelBadge level={a.level} />
                  </motion.div>
                ))}
              </div>
              <div className="mt-3 text-center">
                <button className="text-[11px] text-cyan-400/80 hover:text-cyan-300 transition-colors">
                  View all alerts →
                </button>
              </div>
            </HudCard>
          </div>

        </div>
      </div>
    </div>
  );
}
