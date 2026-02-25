import { useEffect, useState } from 'react';
import { LucideMoon, LucideSun } from 'lucide-react';

export const DarkModeToggle = () => {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);
  return (
    <button onClick={() => setDark(!dark)} className="glass p-2 rounded-full">
      {dark ? <LucideMoon className="text-neonBlue" /> : <LucideSun className="text-neonYellow" />}
    </button>
  );
};