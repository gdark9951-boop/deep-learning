export const ThreatLevelBadge = ({ level }: { level: 'Low' | 'Medium' | 'High' | 'Critical' }) => {
  const color = {
    Low: 'bg-neonGreen',
    Medium: 'bg-neonCyan',
    High: 'bg-neonViolet',
    Critical: 'bg-red-500',
  }[level];
  return <span className={`badge ${color}`}>{level}</span>;
};