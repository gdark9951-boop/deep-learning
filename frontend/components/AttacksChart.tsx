import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { type: 'DoS', count: 12 },
  { type: 'Probe', count: 7 },
  { type: 'R2L', count: 3 },
  { type: 'U2R', count: 2 },
];

export const AttacksChart = () => (
  <div className="glass p-4">
    <span className="text-sm text-neonViolet">Attacks by Type</span>
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <XAxis dataKey="type" stroke="#7c3aed" />
        <YAxis stroke="#00eaff" />
        <Tooltip />
        <Bar dataKey="count" fill="#7c3aed" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);