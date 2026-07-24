import { useState } from "react";
import type { MissionModuleId } from "@shared/api-types";
import { ActivityFeed } from "./components/ActivityFeed";
import { ControlPanel } from "./components/ControlPanel";
import { DigitalCellPanel } from "./components/DigitalCellPanel";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { useOrganism } from "./hooks/useOrganism";
import { MISSION_MODULES } from "./modules";

export default function App() {
  const organism = useOrganism();
  const [activeModule, setActiveModule] = useState<MissionModuleId>("digital-cell");

  return (
    <div className="shell">
      <div className="shell__atmosphere" aria-hidden="true" />
      <TopBar version={organism.version} online={organism.online} />

      <div className="shell__body">
        <Sidebar
          modules={MISSION_MODULES}
          activeId={activeModule}
          onSelect={setActiveModule}
        />

        <main className="workspace">
          {organism.error ? (
            <div className="banner banner--error" role="alert">
              {organism.error}
            </div>
          ) : null}

          {activeModule === "digital-cell" ? (
            <div className="workspace__grid">
              <DigitalCellPanel status={organism.status} />
              <ControlPanel
                busy={organism.busy}
                onWake={() => void organism.wake()}
                onSleep={() => void organism.sleep()}
                onStepTick={() => void organism.stepTick()}
                onInject={() => void organism.injectMessage("Hello Cell")}
                onRefresh={() => void organism.refresh()}
              />
              <ActivityFeed events={organism.events} />
            </div>
          ) : (
            <section className="panel">
              <div className="panel__header">
                <h2>Module Standby</h2>
                <p>This observatory channel activates in a future NEURONET release.</p>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
