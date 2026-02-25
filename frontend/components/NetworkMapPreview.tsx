"use client";

import dynamic from "next/dynamic";

// Lazy-load WorldMap to avoid SSR issues with react-simple-maps
const WorldMap = dynamic(() => import("./WorldMap"), { ssr: false });

export function NetworkMapPreview() {
    return (
        <div className="glass p-4">
            <h3 className="text-sm font-semibold text-neonCyan mb-3">
                🌐 Global Threat Map
            </h3>
            <WorldMap />
        </div>
    );
}
