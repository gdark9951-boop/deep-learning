import Link from 'next/link';
import { LucideShield, LucideBarChart, LucideFileText, LucideNetwork, LucideInfo, LucidePresentation } from 'lucide-react';

export const Sidebar = () => (
  <aside className="w-20 bg-glassBg h-screen flex flex-col items-center py-6 border-r border-neonBlue">
    <nav className="flex flex-col gap-6">
      <Link href="/dashboard"><LucideShield className="text-neonBlue" /></Link>
      <Link href="/models"><LucideBarChart className="text-neonViolet" /></Link>
      <Link href="/demo"><LucideFileText className="text-neonCyan" /></Link>
      <Link href="/live"><LucideNetwork className="text-neonGreen" /></Link>
      <Link href="/results"><LucideBarChart className="text-neonBlue" /></Link>
      <Link href="/explain"><LucideInfo className="text-neonViolet" /></Link>
      <Link href="/presentation"><LucidePresentation className="text-neonCyan" /></Link>
      <Link href="/docs"><LucideFileText className="text-neonGreen" /></Link>
      <Link href="/about"><LucideInfo className="text-neonBlue" /></Link>
      <Link href="/threat-intel"><LucideShield className="text-neonViolet" /></Link>
    </nav>
  </aside>
);