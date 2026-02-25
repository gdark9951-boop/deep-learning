import { ReactNode } from 'react';

// Dashboard uses its own full-screen HUD layout
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
