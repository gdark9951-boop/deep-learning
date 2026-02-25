import { WidgetTotalScans, WidgetDetectedThreats, WidgetThreatLevel, WidgetAvgLatency } from '../../components/Widgets';
import { DetectionsChart } from '../../components/DetectionsChart';
import { NetworkMapPreview } from '../../components/NetworkMapPreview';

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