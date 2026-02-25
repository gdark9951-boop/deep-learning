export const StatusPill = ({ status, label }: { status: boolean, label: string }) => (
  <span className={`status-pill ${status ? 'bg-neonBlue' : 'bg-red-500'}`}>{label} {status ? 'ok' : 'error'}</span>
);