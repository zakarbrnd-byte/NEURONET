import type {
  EnvironmentSnapshot,
  StructuralSnapshot,
} from "../../types/neural";
import type { PauseReason, RunMode } from "./runLoop";
import {
  presetForSpeed,
  renderModeLabel,
  shortSpeedLabel,
  type SimulationSpeedId,
} from "./simulationSpeed";

interface ObserverStatusPanelProps {
  running: boolean;
  pauseReason: PauseReason;
  tick: number;
  runMode: RunMode;
  observationLimit: number;
  stepsThisRun: number;
  simulationSpeed: SimulationSpeedId;
  actualTicksPerSecond: number;
  backendLatencyMs: number | null;
  backendVersion: string | null;
  environment: EnvironmentSnapshot | null;
  structural: StructuralSnapshot | null;
}

function modeLabel(mode: RunMode): string {
  return mode === "continuous" ? "Continuous" : "Observation";
}

export function ObserverStatusPanel({
  running,
  pauseReason,
  tick,
  runMode,
  observationLimit,
  stepsThisRun,
  simulationSpeed,
  actualTicksPerSecond,
  backendLatencyMs,
  backendVersion,
  environment,
  structural,
}: ObserverStatusPanelProps) {
  const metrics = structural?.metrics;
  const renderMode = presetForSpeed(simulationSpeed).renderMode;
  const activePattern =
    environment?.activePatterns?.[0] ??
    (environment?.patterns.find((p) => p.active)?.id ?? "None");
  const latestReceptor =
    environment?.receptors
      .filter((r) => r.lastActivatedTick != null)
      .sort((a, b) => (b.lastActivatedTick ?? 0) - (a.lastActivatedTick ?? 0))[0] ?? null;

  return (
    <section
      className="observer-status-panel"
      aria-label="Observer status"
      data-testid="observer-status-panel"
    >
      <h3 className="help-heading">Observer Status</h3>

      <dl className="status-list panel-metrics">
        <div className="status-row">
          <dt>Simulation</dt>
          <dd data-testid="observer-sim-state">{running ? "Running" : "Paused"}</dd>
        </div>
        <div className="status-row">
          <dt>Pause reason</dt>
          <dd data-testid="observer-pause-reason">{pauseReason}</dd>
        </div>
        <div className="status-row">
          <dt>Tick</dt>
          <dd data-testid="observer-tick">{tick}</dd>
        </div>
        <div className="status-row">
          <dt>Run mode</dt>
          <dd data-testid="observer-run-mode">
            {modeLabel(runMode)}
            {runMode === "observation"
              ? ` · ${stepsThisRun}/${observationLimit}`
              : stepsThisRun > 0
                ? ` · ${stepsThisRun} steps`
                : ""}
          </dd>
        </div>
        <div className="status-row">
          <dt>Selected speed</dt>
          <dd data-testid="observer-selected-speed">{shortSpeedLabel(simulationSpeed)}</dd>
        </div>
        <div className="status-row">
          <dt>Actual ticks/s</dt>
          <dd data-testid="observer-actual-tps">
            {actualTicksPerSecond > 0 ? actualTicksPerSecond.toFixed(1) : "—"}
          </dd>
        </div>
        <div className="status-row">
          <dt>Backend latency</dt>
          <dd data-testid="observer-backend-latency">
            {backendLatencyMs != null ? `${Math.round(backendLatencyMs)} ms` : "—"}
          </dd>
        </div>
        <div className="status-row">
          <dt>Render mode</dt>
          <dd data-testid="observer-render-mode">{renderModeLabel(renderMode)}</dd>
        </div>
        <div className="status-row">
          <dt>Frontend / backend</dt>
          <dd data-testid="observer-versions">
            0.8.2 / {backendVersion ?? "—"}
          </dd>
        </div>
      </dl>

      <dl className="status-list panel-metrics">
        <div className="status-row">
          <dt>Active pattern</dt>
          <dd data-testid="observer-active-pattern">{activePattern}</dd>
        </div>
        <div className="status-row">
          <dt>Next env event</dt>
          <dd data-testid="observer-next-env">
            {environment?.nextScheduledEventTick != null
              ? `Tick ${environment.nextScheduledEventTick}`
              : "—"}
          </dd>
        </div>
        <div className="status-row">
          <dt>Latest receptor</dt>
          <dd data-testid="observer-latest-receptor">
            {latestReceptor
              ? `${latestReceptor.id} @ ${latestReceptor.lastActivatedTick}`
              : "None"}
          </dd>
        </div>
      </dl>

      <dl className="status-list panel-metrics">
        <div className="status-row">
          <dt>Synapses</dt>
          <dd data-testid="observer-synapse-count">
            {structural?.topology.synapseCount ?? "—"}
          </dd>
        </div>
        <div className="status-row">
          <dt>Candidates</dt>
          <dd data-testid="observer-candidate-count">
            {structural?.candidateCount ?? "—"}
          </dd>
        </div>
        <div className="status-row">
          <dt>Maturing</dt>
          <dd data-testid="observer-maturing-count">
            {metrics?.candidatesMaturing ??
              structural?.growthCandidates.filter((c) => c.status === "maturing").length ??
              "—"}
          </dd>
        </div>
        <div className="status-row">
          <dt>Births</dt>
          <dd data-testid="observer-births">
            {metrics?.synapsesCreatedTotal ?? structural?.topology.createdThisSession ?? "—"}
          </dd>
        </div>
        <div className="status-row">
          <dt>Pruning</dt>
          <dd data-testid="observer-prunes">
            {metrics?.synapsesPrunedTotal ?? structural?.topology.prunedThisSession ?? "—"}
          </dd>
        </div>
        <div className="status-row">
          <dt>Balance</dt>
          <dd data-testid="observer-balance" className="capitalize">
            {metrics?.structuralBalance ?? "—"}
          </dd>
        </div>
      </dl>
    </section>
  );
}
