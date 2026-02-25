import { useState } from 'react';

export const Toast = ({ message, type }: { message: string, type: 'success' | 'error' | 'info' }) => {
  const color = {
    success: 'bg-neonGreen',
    error: 'bg-red-500',
    info: 'bg-neonBlue',
  }[type];
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div className={`toast ${color} fixed bottom-6 right-6 p-4 rounded shadow-lg z-50`} onClick={() => setVisible(false)}>
      {message}
    </div>
  );
};