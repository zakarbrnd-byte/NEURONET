import { useState } from "react";
import type { DevelopmentSummary, StructuralSnapshot } from "../../types/neural";
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
  stimulateDisabled?: boolean;
  onStimulateWeak: () => void;
  onStimulateStrong: () => void;
  onStep: () => void;
  onRun: () => void;
  onPause: () => void;
  onReset: () => void;
}

const CATEGORIES: Array<{ id: ControlsCategory; label: string }> = [
  { id: "stimulus", label: "Stimulus" },
  { id: "time", label: "Time" },
  { id: "structure", label: "Structure" },
  { id: "reset", label: "Reset" },
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
  stimulateDisabled = false,
  onStimulateWeak,
  onStimulateStrong,
  onStep,
  onRun,
  onPause,
  onReset,
}: ControlsPanelProps) {
  const [category, setCategory] = useState<ControlsCategory>("stimulus");
  const noNeuron = !selectedNeuronId;
  const stimLocked = disabled || busy || running || noNeuron || stimulateDisabled;
  const stepLocked = disabled || busy || running;
  const runLocked = disabled || busy || running;
  const pauseLocked = disabled || !running;
  const resetLocked = disabled || busy;

  return (
    <div className="controls-panel">
      <p className="controls-target">
        Target:{" "}
        <strong>
          {selectedNeuronId ? shortNeuronId(selectedNeuronId) : "None selected"}
        </strong>
      </p>
      <p className="hint">
        Long-press a neuron on the graph for quick +5 mV. Sequence:{" "}
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
                0.7.
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
                    Neuron positions come from the backend. Signals travel along axons. Development
                    mode shows the Simplified Progenitor Zone, developing cells, growth candidates,
                    and pruning risk without inventing biology.
                  </dd>
                </div>
                <div>
                  <dt>Network View vs Tissue View</dt>
                  <dd>
                    Network View is a schematic graph for dynamics. Tissue View uses backend cell
                    positions, soma/dendrite morphology, and excitatory (arrow) vs inhibitory (bar)
                    synapses.
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
                <div>
                  <dt>Distance to Threshold</dt>
                  <dd>How much more depolarization is needed before firing.</dd>
                </div>
                <div>
                  <dt>Refractory</dt>
                  <dd>How many simulation steps remain before the neuron can fire again.</dd>
                </div>
                <div>
                  <dt>Fatigue</dt>
                  <dd>A simplified temporary exhaustion value.</dd>
                </div>
                <div>
                  <dt>Energy</dt>
                  <dd>A simplified simulation cost indicator.</dd>
                </div>
              </dl>
              <p className="hint">
                Tap a neuron to inspect. Hold ~0.5s to stimulate +5 mV (settled cells only).
                Developmental Neural Tissue · Version 0.7
              </p>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
