import { DarkModeToggle } from './DarkModeToggle';

export const Topbar = () => (
  <header className="w-full h-16 flex items-center justify-between px-6 bg-glassBg border-b border-neonBlue">
    <h1 className="text-2xl font-bold text-neonBlue">Cyber IDS Dashboard</h1>
    <DarkModeToggle />
  </header>
);