import type { MissionModule, MissionModuleId } from "@shared/api-types";

interface SidebarProps {
  modules: MissionModule[];
  activeId: MissionModuleId;
  onSelect: (id: MissionModuleId) => void;
}

export function Sidebar({ modules, activeId, onSelect }: SidebarProps) {
  return (
    <aside className="sidebar" aria-label="Mission Control modules">
      <p className="sidebar__heading">Mission Control</p>
      <nav className="sidebar__nav">
        {modules.map((module) => {
          const active = module.id === activeId;
          return (
            <button
              key={module.id}
              type="button"
              className={`sidebar__item ${active ? "is-active" : ""} ${
                module.enabled ? "" : "is-disabled"
              }`}
              disabled={!module.enabled}
              onClick={() => onSelect(module.id)}
            >
              <span
                className={`sidebar__lamp ${module.enabled ? "is-live" : ""}`}
                aria-hidden="true"
              />
              <span>{module.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
