"use client";

import dynamic from "next/dynamic";
import { WidgetTotalScans, WidgetDetectedThreats, WidgetThreatLevel, WidgetAvgLatency } from "../../components/Widgets";

const DetectionsChart = dynamic(() =>
  import("../../components/DetectionsChart").then((m) => ({ default: m.DetectionsChart })),
  { ssr: false, loading: () => <div className="glass p-4 h-[200px] animate-pulse" /> }
);

const NetworkMapPreview = dynamic(() =>
  import("../../components/NetworkMapPreview").then((m) => ({ default: m.NetworkMapPreview })),
  { ssr: false, loading: () => <div className="glass p-4 h-[300px] animate-pulse" /> }
);

export default function PresentationPage() {
  return (
    <div className="glass p-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <WidgetTotalScans />
        <WidgetDetectedThreats />
        <WidgetThreatLevel />
        <WidgetAvgLatency />
      </div>
      <div className="mb-8">
        <DetectionsChart />
      </div>
      <div>
        <NetworkMapPreview />
      </div>
    </div>
  );
}
