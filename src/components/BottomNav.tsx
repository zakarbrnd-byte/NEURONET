import type { ReactNode } from "react";
import type { MissionPanel } from "../types/ui";

interface BottomNavProps {
  active: MissionPanel;
  onChange: (panel: MissionPanel) => void;
}

const ITEMS: Array<{
  id: MissionPanel;
  label: string;
  ariaLabel: string;
  icon: ReactNode;
}> = [
  {
    id: "network",
    label: "Network",
    ariaLabel: "Network view",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon">
        <circle cx="5" cy="12" r="2.2" fill="currentColor" />
        <circle cx="12" cy="6" r="2.2" fill="currentColor" />
        <circle cx="12" cy="18" r="2.2" fill="currentColor" />
        <circle cx="19" cy="12" r="2.2" fill="currentColor" />
        <path
          d="M7 12h3M12 8v2M12 14v2M15 12h2"
          stroke="currentColor"
          strokeWidth="1.6"
          fill="none"
        />
      </svg>
    ),
  },
  {
    id: "node",
    label: "Node",
    ariaLabel: "Neuron details",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon">
        <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "timeline",
    label: "Timeline",
    ariaLabel: "Tick timeline",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon">
        <path
          d="M5 6h14M5 12h10M5 18h12"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    ),
  },
  {
    id: "controls",
    label: "Controls",
    ariaLabel: "Simulation controls",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon">
        <rect x="4" y="4" width="6" height="6" rx="1.2" fill="currentColor" />
        <rect x="14" y="4" width="6" height="6" rx="1.2" fill="currentColor" />
        <rect x="4" y="14" width="6" height="6" rx="1.2" fill="currentColor" />
        <rect x="14" y="14" width="6" height="6" rx="1.2" fill="currentColor" />
      </svg>
    ),
  },
];

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Mission Control sections">
      {ITEMS.map((item) => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            type="button"
            className={`bottom-nav-item ${isActive ? "is-active" : ""}`}
            aria-label={item.ariaLabel}
            aria-current={isActive ? "page" : undefined}
            onClick={() => onChange(item.id)}
          >
            {item.icon}
            <span className="bottom-nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
