"use client";
import * as React from "react";

interface TabsProps {
  children: React.ReactNode;
  defaultValue?: string;
}

interface TabProps {
  title: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}

export function Tabs({ children }: TabsProps) {
  const [active, setActive] = React.useState(0);
  const tabs = React.Children.toArray(children) as React.ReactElement<TabProps>[];

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {tabs.map((child, idx) => (
          <button
            key={idx}
            className={`px-4 py-2 rounded glass transition-all ${active === idx
                ? "bg-neonBlue text-white shadow-neon"
                : "bg-glassBg text-neonBlue hover:bg-neonBlue/20"
              }`}
            onClick={() => setActive(idx)}
          >
            {child.props.title}
          </button>
        ))}
      </div>
      <div className="mt-2">
        {tabs[active]?.props.children}
      </div>
    </div>
  );
}

export function Tab({ title, children, active, onClick }: TabProps) {
  // Tab renders nothing directly — Tabs component reads its props
  return null;
}
