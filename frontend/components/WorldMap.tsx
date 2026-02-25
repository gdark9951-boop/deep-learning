"use client";

import React from "react";
import {
    ComposableMap,
    Geographies,
    Geography,
    Marker,
} from "react-simple-maps";

const GEO_URL =
    "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Hot spots (attack origins)
const hotSpots: { name: string; coords: [number, number]; size: number }[] = [
    { name: "China", coords: [116.4, 39.9], size: 18 },
    { name: "Russia", coords: [37.6, 55.7], size: 14 },
    { name: "USA", coords: [-95.7, 37.1], size: 12 },
    { name: "Brazil", coords: [-51.9, -14.2], size: 8 },
    { name: "India", coords: [78.9, 20.6], size: 10 },
    { name: "Germany", coords: [10.4, 51.2], size: 7 },
    { name: "South Korea", coords: [127.8, 35.9], size: 9 },
];

export default function WorldMap() {
    return (
        <div className="relative h-[300px] w-full bg-[#060A18]">
            {/* Grid overlay */}
            <div
                className="pointer-events-none absolute inset-0 opacity-20"
                style={{
                    backgroundImage:
                        "linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.07) 1px, transparent 1px)",
                    backgroundSize: "26px 26px",
                }}
            />

            <ComposableMap
                projectionConfig={{ scale: 145, center: [10, 10] }}
                width={980}
                height={420}
                style={{ width: "100%", height: "100%" }}
            >
                <Geographies geography={GEO_URL}>
                    {({ geographies }) =>
                        geographies.map((geo) => (
                            <Geography
                                key={geo.rsmKey}
                                geography={geo}
                                fill="rgba(167,139,250,0.22)"
                                stroke="rgba(255,255,255,0.08)"
                                strokeWidth={0.5}
                                style={{
                                    default: { outline: "none" },
                                    hover: { outline: "none", fill: "rgba(34,211,238,0.28)", transition: "fill 0.2s" },
                                    pressed: { outline: "none" },
                                }}
                            />
                        ))
                    }
                </Geographies>

                {hotSpots.map((spot) => (
                    <Marker key={spot.name} coordinates={spot.coords}>
                        {/* Outer pulse rings */}
                        <circle r={spot.size * 1.8} fill="rgba(248,113,113,0.06)" />
                        <circle r={spot.size * 1.2} fill="rgba(248,113,113,0.12)" />
                        {/* Core dot */}
                        <circle r={spot.size * 0.55} fill="rgba(248,113,113,0.85)" />
                        <circle r={spot.size * 0.55} fill="none" stroke="rgba(248,113,113,0.6)" strokeWidth={1} />
                    </Marker>
                ))}
            </ComposableMap>

            {/* Color legend */}
            <div className="absolute bottom-3 left-4 flex items-center gap-3 text-[10px] text-white/40">
                <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-violet-400/60" /> Countries
                </span>
                <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-red-400/80" /> Attack Origin
                </span>
            </div>
        </div>
    );
}
