import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { time: '10:00', detections: 5 },
  { time: '10:10', detections: 8 },
  { time: '10:20', detections: 12 },
  { time: '10:30', detections: 7 },
];

export const DetectionsChart = () => (
  <div className="glass p-4">
    <span className="text-sm text-neonBlue">Detections Over Time</span>
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <XAxis dataKey="time" stroke="#00eaff" />
        <YAxis stroke="#7c3aed" />
        <Tooltip />
        <Line type="monotone" dataKey="detections" stroke="#00eaff" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);