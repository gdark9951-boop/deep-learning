"use client";

import {
    useRef, useState, useCallback, useEffect,
    forwardRef, useImperativeHandle,
    type ReactNode, type WheelEvent, type PointerEvent as RPointerEvent,
} from "react";

const MIN_SCALE = 0.3;
const MAX_SCALE = 4.0;
const SCALE_STEP = 0.25;
const WHEEL_FACTOR = 0.001;

export interface NetworkMapViewportHandle {
    zoomIn: () => void;
    zoomOut: () => void;
    reset: () => void;
    toggleFullscreen: () => void;
}

interface Props {
    children: ReactNode;
    /** height of the viewport container in px */
    height?: number;
    /** extra style for the outer container */
    containerStyle?: React.CSSProperties;
}

export const NetworkMapViewport = forwardRef<NetworkMapViewportHandle, Props>(
    function NetworkMapViewport({ children, height = 300, containerStyle }, ref) {
        const containerRef = useRef<HTMLDivElement>(null);
        const innerRef = useRef<HTMLDivElement>(null);

        const [scale, setScale] = useState(1);
        const [offset, setOffset] = useState({ x: 0, y: 0 });
        const [isDragging, setIsDragging] = useState(false);

        // Store mutable drag state in a ref to avoid stale closures
        const drag = useRef({ active: false, startX: 0, startY: 0, ox: 0, oy: 0 });

        /* ─── helpers ─────────────────────────────────────────────────── */

        const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

        const applyZoom = useCallback((delta: number, cx?: number, cy?: number) => {
            setScale((prev) => {
                const next = clamp(prev + delta, MIN_SCALE, MAX_SCALE);
                if (next === prev) return prev;

                if (cx !== undefined && cy !== undefined) {
                    // Zoom toward the cursor point (in container coords)
                    const ratio = next / prev;
                    setOffset((o) => ({
                        x: cx + (o.x - cx) * ratio,
                        y: cy + (o.y - cy) * ratio,
                    }));
                }
                return next;
            });
        }, []);

        /* ─── pointer events (pan) ───────────────────────────────────── */

        const onPointerDown = useCallback((e: RPointerEvent<HTMLDivElement>) => {
            // Only left button
            if (e.button !== 0) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = { active: true, startX: e.clientX, startY: e.clientY, ox: offset.x, oy: offset.y };
            setIsDragging(true);
        }, [offset]);

        const onPointerMove = useCallback((e: RPointerEvent<HTMLDivElement>) => {
            if (!drag.current.active) return;
            const dx = e.clientX - drag.current.startX;
            const dy = e.clientY - drag.current.startY;
            setOffset({ x: drag.current.ox + dx, y: drag.current.oy + dy });
        }, []);

        const onPointerUp = useCallback((e: RPointerEvent<HTMLDivElement>) => {
            drag.current.active = false;
            e.currentTarget.releasePointerCapture(e.pointerId);
            setIsDragging(false);
        }, []);

        /* ─── wheel zoom ─────────────────────────────────────────────── */

        const onWheel = useCallback((e: WheelEvent<HTMLDivElement>) => {
            e.preventDefault();
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            // cursor position relative to container
            const cx = e.clientX - rect.left;
            const cy = e.clientY - rect.top;
            const delta = -e.deltaY * WHEEL_FACTOR * scale;
            applyZoom(delta, cx, cy);
        }, [applyZoom, scale]);

        /* ─── touch pinch zoom ───────────────────────────────────────── */
        const lastPinchDist = useRef<number | null>(null);

        useEffect(() => {
            const el = containerRef.current;
            if (!el) return;

            const touchMove = (e: TouchEvent) => {
                if (e.touches.length === 2) {
                    e.preventDefault();
                    const dx = e.touches[0].clientX - e.touches[1].clientX;
                    const dy = e.touches[0].clientY - e.touches[1].clientY;
                    const dist = Math.hypot(dx, dy);
                    if (lastPinchDist.current !== null) {
                        const delta = (dist - lastPinchDist.current) * 0.005;
                        applyZoom(delta);
                    }
                    lastPinchDist.current = dist;
                }
            };
            const touchEnd = () => { lastPinchDist.current = null; };

            el.addEventListener("touchmove", touchMove, { passive: false });
            el.addEventListener("touchend", touchEnd);
            return () => {
                el.removeEventListener("touchmove", touchMove);
                el.removeEventListener("touchend", touchEnd);
            };
        }, [applyZoom]);

        /* ─── double click to reset ──────────────────────────────────── */
        const onDoubleClick = useCallback(() => {
            setScale(1);
            setOffset({ x: 0, y: 0 });
        }, []);

        /* ─── imperative handle for buttons ─────────────────────────── */
        useImperativeHandle(ref, () => ({
            zoomIn: () => applyZoom(+SCALE_STEP),
            zoomOut: () => applyZoom(-SCALE_STEP),
            reset: () => { setScale(1); setOffset({ x: 0, y: 0 }); },
            toggleFullscreen: () => {
                const el = containerRef.current;
                if (!el) return;
                if (!document.fullscreenElement) {
                    el.requestFullscreen?.();
                } else {
                    document.exitFullscreen?.();
                }
            },
        }), [applyZoom]);

        return (
            <div
                ref={containerRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onWheel={onWheel}
                onDoubleClick={onDoubleClick}
                style={{
                    position: "relative",
                    height,
                    overflow: "hidden",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.06)",
                    background: "rgba(3,5,15,0.7)",
                    cursor: isDragging ? "grabbing" : "grab",
                    touchAction: "none",       // disable browser scroll during touch
                    userSelect: "none",
                    ...containerStyle,
                }}
            >
                {/* Transform layer */}
                <div
                    ref={innerRef}
                    style={{
                        position: "absolute",
                        inset: 0,
                        transformOrigin: "0 0",
                        transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                        willChange: "transform",
                        pointerEvents: "none",   // nodes/edges are decorative; pan handled by parent
                    }}
                >
                    {children}
                </div>

                {/* Scale indicator */}
                <div style={{
                    position: "absolute", bottom: 8, left: 12,
                    fontSize: 9, color: "rgba(255,255,255,0.25)", fontFamily: "monospace",
                    pointerEvents: "none",
                }}>
                    {(scale * 100).toFixed(0)}% · double-click to reset
                </div>
            </div>
        );
    }
);
