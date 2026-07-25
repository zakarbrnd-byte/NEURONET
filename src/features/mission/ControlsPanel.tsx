import { useState } from "react";
import type {
  DevelopmentSummary,
  EnvironmentControlsRequest,
  EnvironmentPreset,
  EnvironmentSnapshot,
  StructuralSnapshot,
} from "../../types/neural";
import { shortNeuronId } from "../../types/neural";
import type { ControlsCategory } from "../../types/ui";

interface ControlsPanelProps {
  selectedNeuronId: string | null;
  disabled: boolean;
  busy: boolean;
  running: boolean;
  autoStep: number;
  maxAutoSteps: number;
  structural: StructuralSnapshot | null;
  development?: DevelopmentSummary | null;
  environment?: EnvironmentSnapshot | null;
  stimulateDisabled?: boolean;
  onStimulateWeak: () => void;
  onStimulateStrong: () => void;
  onStep: () => void;
  onRun: () => void;
  onPause: () => void;
  onReset: () => void;
  onEnvironmentControls: (controls: EnvironmentControlsRequest) => void;
}

const CATEGORIES: Array<{ id: ControlsCategory; label: string }> = [
  { id: "stimulus", label: "Stimulus" },
  { id: "time", label: "Time" },
  { id: "structure", label: "Structure" },
  { id: "environment", label: "Environment" },
  { id: "reset", label: "Reset" },
];

const PRESETS: Array<{ id: EnvironmentPreset; label: string }> = [
  { id: "quiet", label: "Quiet" },
  { id: "balanced", label: "Balanced" },
  { id: "active", label: "Active" },
];

export function ControlsPanel({
  selectedNeuronId,
  disabled,
  busy,
  running,
  autoStep,
  maxAutoSteps,
  structural,
  development = null,
  environment = null,
  stimulateDisabled = false,
  onStimulateWeak,
  onStimulateStrong,
  onStep,
  onRun,
  onPause,
  onReset,
  onEnvironmentControls,
}: ControlsPanelProps) {
  const [category, setCategory] = useState<ControlsCategory>("stimulus");
  const noNeuron = !selectedNeuronId;
  const stimLocked = disabled || busy || running || noNeuron || stimulateDisabled;
  const stepLocked = disabled || busy || running;
  const runLocked = disabled || busy || running;
  const pauseLocked = disabled || !running;
  const resetLocked = disabled || busy;
  const envLocked = disabled || busy;
  const cfg = environment?.config;

  return (
    <div className="controls-panel">
      <p className="controls-target">
        Target:{" "}
        <strong>
          {selectedNeuronId ? shortNeuronId(selectedNeuronId) : "None selected"}
        </strong>
      </p>
      <p className="hint">
        Long-press a neuron on the graph for Laboratory Electrode +5 mV. Sequence:{" "}
        {running ? "running" : "paused"} · {autoStep}/{maxAutoSteps}
        {stimulateDisabled
          ? " · Developing cells are not electrically eligible for stimulation."
          : ""}
      </p>

      <div className="segmented" role="tablist" aria-label="Control categories">
        {CATEGORIES.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={category === item.id}
            className={`segmented-item ${category === item.id ? "is-active" : ""}`}
            onClick={() => setCategory(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="controls-actions">
        {category === "stimulus" ? (
          <>
            <p className="hint" data-testid="laboratory-electrode-label">
              Laboratory Electrode — direct current injection into a selected neuron. Distinct from
              sensory receptor input.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              disabled={stimLocked}
              onClick={onStimulateWeak}
            >
              Weak Signal +5 mV
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={stimLocked}
              onClick={onStimulateStrong}
            >
              Strong Signal +20 mV
            </button>
          </>
        ) : null}

        {category === "time" ? (
          <>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={stepLocked}
              onClick={onStep}
            >
              Step One Tick
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={runLocked}
              onClick={onRun}
            >
              Run Sequence
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={pauseLocked}
              onClick={onPause}
            >
              Pause Sequence
            </button>
          </>
        ) : null}

        {category === "structure" ? (
          <>
            <section
              className="development-controls"
              aria-label="Development summary"
              data-testid="development-summary-controls"
            >
              <h3 className="help-heading">Development</h3>
              <p className="hint">
                Read-only summary. Progenitor birth and settlement are backend-owned in Version
                0.7+.
              </p>
              <dl className="status-list panel-metrics">
                <div className="status-row">
                  <dt>Population</dt>
                  <dd data-testid="development-population">
                    {development
                      ? `${development.totalCellCount}/${development.populationCapacity}`
                      : "—"}
                  </dd>
                </div>
                <div className="status-row">
                  <dt>Developing</dt>
                  <dd data-testid="development-developing-count">
                    {development?.developingCellCount ?? "—"}
                  </dd>
                </div>
                <div className="status-row">
                  <dt>Settled</dt>
                  <dd data-testid="development-settled-count">
                    {development?.settledNeuronCount ?? "—"}
                  </dd>
                </div>
                <div className="status-row">
                  <dt>Next birth tick</dt>
                  <dd data-testid="development-next-birth">
                    {development?.nextBirthEligibilityTick != null
                      ? `Tick ${development.nextBirthEligibilityTick}`
                      : "None"}
                  </dd>
                </div>
                <div className="status-row">
                  <dt>Latest evaluation</dt>
                  <dd data-testid="development-latest-eval">
                    {development?.latestDevelopmentEvaluationTick != null
                      ? `Tick ${development.latestDevelopmentEvaluationTick}`
                      : "None yet"}
                  </dd>
                </div>
                <div className="status-row">
                  <dt>Lifecycle activity</dt>
                  <dd data-testid="development-lifecycle-activity">
                    {development?.currentLifecycleActivity ?? "—"}
                  </dd>
                </div>
              </dl>
            </section>

            <section
              className="structural-controls"
              aria-label="Structural plasticity"
              data-testid="structural-plasticity-controls"
            >
              <h3 className="help-heading">Structural Plasticity</h3>
              <p className="hint">
                Read-only summary. Birth and pruning are backend-owned.
              </p>
              <dl className="status-list panel-metrics">
                <div className="status-row">
                  <dt>Enabled</dt>
                  <dd>{structural?.config.enabled ? "Yes" : "No"}</dd>
                </div>
                <div className="status-row">
                  <dt>Evaluation interval</dt>
                  <dd>{structural?.config.evaluationIntervalTicks ?? "—"} ticks</dd>
                </div>
                <div className="status-row">
                  <dt>Latest evaluation</dt>
                  <dd>
                    {structural?.latestEvaluationTick != null
                      ? `Tick ${structural.latestEvaluationTick}`
                      : "None yet"}
                  </dd>
                </div>
                <div className="status-row">
                  <dt>Candidates</dt>
                  <dd data-testid="structural-candidate-count">
                    {structural?.candidateCount ?? 0}
                  </dd>
                </div>
                <div className="status-row">
                  <dt>At-risk synapses</dt>
                  <dd data-testid="structural-at-risk-count">
                    {structural?.atRiskSynapseCount ?? 0}
                  </dd>
                </div>
                <div className="status-row">
                  <dt>Created this session</dt>
                  <dd data-testid="structural-created-count">
                    {structural?.topology.createdThisSession ?? 0}
                  </dd>
                </div>
                <div className="status-row">
                  <dt>Pruned this session</dt>
                  <dd data-testid="structural-pruned-count">
                    {structural?.topology.prunedThisSession ?? 0}
                  </dd>
                </div>
                <div className="status-row">
                  <dt>Synapse capacity</dt>
                  <dd>
                    {structural?.topology.synapseCount ?? 0}/
                    {structural?.topology.maxSynapseCapacity ?? "—"}
                  </dd>
                </div>
              </dl>
            </section>
          </>
        ) : null}

        {category === "environment" ? (
          <section
            className="environment-controls"
            aria-label="Autonomous Sensory Environment"
            data-testid="environment-controls"
          >
            <h3 className="help-heading">Autonomous Sensory Environment</h3>
            <p className="hint" data-testid="environment-limitations-note">
              Scientific limitation: this is a deterministic virtual sensory schedule, not
              perception, embodiment, or cognition. Events come only from the backend.
            </p>

            <div className="env-toggle-row">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={envLocked}
                data-testid="env-toggle-enabled"
                onClick={() => onEnvironmentControls({ enabled: !(cfg?.enabled ?? true) })}
              >
                Environment: {cfg?.enabled ? "On" : "Off"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={envLocked || !(cfg?.enabled ?? false)}
                data-testid="env-toggle-background"
                onClick={() =>
                  onEnvironmentControls({
                    backgroundEnabled: !(cfg?.backgroundEnabled ?? true),
                  })
                }
              >
                Background: {cfg?.backgroundEnabled ? "On" : "Off"}
              </button>
            </div>
            <div className="env-toggle-row">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={envLocked || !(cfg?.enabled ?? false)}
                data-testid="env-toggle-pattern-a"
                onClick={() =>
                  onEnvironmentControls({
                    patternAEnabled: !(cfg?.patternAEnabled ?? true),
                  })
                }
              >
                Pattern A: {cfg?.patternAEnabled ? "On" : "Off"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={envLocked || !(cfg?.enabled ?? false)}
                data-testid="env-toggle-pattern-b"
                onClick={() =>
                  onEnvironmentControls({
                    patternBEnabled: !(cfg?.patternBEnabled ?? true),
                  })
                }
              >
                Pattern B: {cfg?.patternBEnabled ? "On" : "Off"}
              </button>
            </div>

            <p className="hint">Preset</p>
            <div
              className="segmented"
              role="group"
              aria-label="Environment preset"
              data-testid="environment-preset-group"
            >
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`segmented-item ${
                    environment?.preset === preset.id ? "is-active" : ""
                  }`}
                  disabled={envLocked}
                  data-testid={`env-preset-${preset.id}`}
                  onClick={() => onEnvironmentControls({ preset: preset.id })}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <dl className="status-list panel-metrics" data-testid="environment-status-summary">
              <div className="status-row">
                <dt>Mode</dt>
                <dd data-testid="env-mode">{environment?.mode ?? "—"}</dd>
              </div>
              <div className="status-row">
                <dt>Preset</dt>
                <dd data-testid="env-preset">{environment?.preset ?? "—"}</dd>
              </div>
              <div className="status-row">
                <dt>Age (ticks)</dt>
                <dd data-testid="env-age">{environment?.ageTicks ?? "—"}</dd>
              </div>
              <div className="status-row">
                <dt>Event count</dt>
                <dd data-testid="env-event-count">{environment?.eventCount ?? "—"}</dd>
              </div>
              <div className="status-row">
                <dt>Active patterns</dt>
                <dd data-testid="env-active-patterns">
                  {environment?.activePatterns.length
                    ? environment.activePatterns.join(", ")
                    : "None"}
                </dd>
              </div>
              <div className="status-row">
                <dt>Next scheduled</dt>
                <dd data-testid="env-next-scheduled">
                  {environment?.nextScheduledEventTick != null
                    ? `Tick ${environment.nextScheduledEventTick}`
                    : "None"}
                </dd>
              </div>
              <div className="status-row">
                <dt>Neural synapses</dt>
                <dd data-testid="env-neural-synapse-count">
                  {environment?.neuralSynapseCount ?? "—"}
                </dd>
              </div>
              <div className="status-row">
                <dt>Sensory inputs</dt>
                <dd data-testid="env-sensory-input-count">
                  {environment?.sensoryInputCount ?? "—"}
                </dd>
              </div>
            </dl>
          </section>
        ) : null}

        {category === "reset" ? (
          <>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={resetLocked}
              onClick={onReset}
            >
              Reset Network
            </button>
            <section className="help-section" aria-labelledby="help-heading">
              <h3 id="help-heading" className="help-heading">
                Help
              </h3>
              <dl className="help-list">
                <div>
                  <dt>What is Tissue View?</dt>
                  <dd>
                    This view shows the physical organization of the artificial nervous system.
                    Neuron positions come from the backend. Sensory mode shows receptors and
                    sensory input paths distinct from neural synapses.
                  </dd>
                </div>
                <div>
                  <dt>Laboratory Electrode</dt>
                  <dd>
                    Manual stimulation injects current directly into a neuron. It is not a sensory
                    receptor event.
                  </dd>
                </div>
                <div>
                  <dt>Tick</dt>
                  <dd>One complete backend simulation step. It is not one real-world second.</dd>
                </div>
                <div>
                  <dt>Membrane Potential</dt>
                  <dd>The neuron&apos;s current electrical state.</dd>
                </div>
                <div>
                  <dt>Threshold</dt>
                  <dd>The level required for the neuron to fire.</dd>
                </div>
              </dl>
              <p className="hint">
                Tap a neuron to inspect. Hold ~0.5s for Laboratory Electrode +5 mV (settled cells
                only). Autonomous Sensory Environment · Version 0.8
              </p>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
