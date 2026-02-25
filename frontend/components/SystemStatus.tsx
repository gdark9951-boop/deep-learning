import React from 'react';

interface SystemStatusProps {
  className?: string;
}

export const SystemStatus: React.FC<SystemStatusProps> = ({ className }) => {
  // Demo values
  const api = true;
  const db = true;
  const model = false;
  const demo = true;
  return (
    <div className={`flex gap-4 items-center ${className || ''}`}>
      <span className={`status-pill ${api ? 'bg-neonBlue' : 'bg-red-500'}`}>API {api ? 'ok' : 'error'}</span>
      <span className={`status-pill ${db ? 'bg-neonCyan' : 'bg-red-500'}`}>DB {db ? 'ok' : 'error'}</span>
      <span className={`status-pill ${model ? 'bg-neonViolet' : 'bg-yellow-500'}`}>{model ? 'Model loaded' : 'Demo mode'}</span>
      {demo && <span className="badge bg-neonGreen">Demo Mode</span>}
    </div>
  );
};
