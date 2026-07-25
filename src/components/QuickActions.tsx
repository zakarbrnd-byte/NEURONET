import { SpeedControl } from "../features/mission/SpeedControl";
import type { SimulationSpeedId } from "../features/mission/simulationSpeed";

interface QuickActionsProps {
  disabled: boolean;
  busy: boolean;
  running: boolean;
  simulationSpeed: SimulationSpeedId;
  onSimulationSpeedChange: (speed: SimulationSpeedId) => void;
  onStep: () => void;
  onRun: () => void;
  onPause: () => void;
  onReset: () => void;
}

export function QuickActions({
  disabled,
  busy,
  running,
  simulationSpeed,
  onSimulationSpeedChange,
  onStep,
  onRun,
  onPause,
  onReset,
}: QuickActionsProps) {
  return (
    <div className="quick-actions" aria-label="Quick simulation actions">
      <button
        type="button"
        className="quick-action-btn"
        disabled={disabled || busy || running}
        onClick={onStep}
        aria-label="Step one tick"
      >
        <span className="quick-action-icon" aria-hidden="true">
          ▸|
        </span>
        Step
      </button>
      {running ? (
        <button
          type="button"
          className="quick-action-btn quick-action-primary"
          disabled={disabled}
          onClick={onPause}
          aria-label="Pause sequence"
        >
          <span className="quick-action-icon" aria-hidden="true">
            ❚❚
          </span>
          Pause
        </button>
      ) : (
        <button
          type="button"
          className="quick-action-btn quick-action-primary"
          disabled={disabled || busy}
          onClick={onRun}
          aria-label="Continuous run"
        >
          <span className="quick-action-icon" aria-hidden="true">
            ▶
          </span>
          Run
        </button>
      )}
      <SpeedControl
        speed={simulationSpeed}
        onSpeedChange={onSimulationSpeedChange}
        disabled={disabled}
        compact
      />
      <button
        type="button"
        className="quick-action-btn"
        disabled={disabled || busy}
        onClick={onReset}
        aria-label="Reset network"
      >
        <span className="quick-action-icon" aria-hidden="true">
          ↺
        </span>
        Reset
      </button>
    </div>
  );
}
