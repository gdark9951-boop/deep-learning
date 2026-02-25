"use client";

import { useEffect, useState } from "react";

/**
 * useScrollSpy
 * Watches a list of element IDs and returns the one currently in view.
 * Uses IntersectionObserver — works perfectly with RTL and Next.js App Router.
 */
export function useScrollSpy(ids: string[], options?: IntersectionObserverInit): string {
    const [activeId, setActiveId] = useState<string>(ids[0] ?? "");

    useEffect(() => {
        if (typeof window === "undefined" || ids.length === 0) return;

        // Map each id → element
        const elements = ids
            .map((id) => document.getElementById(id))
            .filter(Boolean) as HTMLElement[];

        if (elements.length === 0) return;

        // Track which sections are visible
        const visibleMap = new Map<string, number>(); // id → intersectionRatio

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    visibleMap.set(entry.target.id, entry.intersectionRatio);
                });

                // Pick the section with the highest visibility ratio
                let bestId = activeId;
                let bestRatio = -1;
                visibleMap.forEach((ratio, id) => {
                    if (ratio > bestRatio) {
                        bestRatio = ratio;
                        bestId = id;
                    }
                });

                if (bestId && bestId !== activeId) {
                    setActiveId(bestId);
                }
            },
            {
                rootMargin: "-20% 0px -60% 0px", // trigger when section is ~20% from top
                threshold: [0, 0.1, 0.25, 0.5, 1.0],
                ...options,
            }
        );

        elements.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ids.join(",")]);

    return activeId;
}
