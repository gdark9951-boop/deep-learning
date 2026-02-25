export const AlertsTable = ({ limit = 50 }: { limit?: number }) => (
  <table className="w-full text-sm glass">
    <thead>
      <tr>
        <th className="text-neonBlue">ID</th>
        <th className="text-neonViolet">Event</th>
        <th className="text-neonGreen">Threat Level</th>
        <th className="text-neonCyan">Confidence</th>
        <th className="text-neonBlue">Timestamp</th>
      </tr>
    </thead>
    <tbody>
      {[...Array(limit)].map((_, i) => (
        <tr key={i}>
          <td>{i + 1}</td>
          <td>Demo Event</td>
          <td><span className="badge bg-neonGreen">Medium</span></td>
          <td>0.87</td>
          <td>2026-02-17 10:00:{(i % 60).toString().padStart(2, '0')}</td>
        </tr>
      ))}
    </tbody>
  </table>
);