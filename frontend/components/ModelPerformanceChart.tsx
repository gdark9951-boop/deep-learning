import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

const data = [
  { metric: 'Accuracy', CNN: 0.95, LSTM: 0.93, Hybrid: 0.97 },
  { metric: 'Precision', CNN: 0.92, LSTM: 0.91, Hybrid: 0.94 },
  { metric: 'Recall', CNN: 0.93, LSTM: 0.90, Hybrid: 0.96 },
  { metric: 'F1', CNN: 0.94, LSTM: 0.91, Hybrid: 0.95 },
  { metric: 'AUC', CNN: 0.96, LSTM: 0.92, Hybrid: 0.98 },
];

export const ModelPerformanceChart = () => (
  <div className="glass p-4">
    <span className="text-sm text-neonCyan">Model Performance Comparison</span>
    <ResponsiveContainer width="100%" height={200}>
      <RadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="metric" />
        <PolarRadiusAxis />
        <Radar name="CNN" dataKey="CNN" stroke="#00eaff" fill="#00eaff" fillOpacity={0.3} />
        <Radar name="LSTM" dataKey="LSTM" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.3} />
        <Radar name="Hybrid" dataKey="Hybrid" stroke="#00ff99" fill="#00ff99" fillOpacity={0.3} />
      </RadarChart>
    </ResponsiveContainer>
  </div>
);