export const EmptyState = ({ message }: { message: string }) => (
  <div className="glass p-8 flex flex-col items-center justify-center">
    <span className="text-neonCyan text-lg mb-2">{message}</span>
    <span className="text-neonBlue">No data available</span>
  </div>
);