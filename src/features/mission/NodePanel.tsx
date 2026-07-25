import { useState } from "react";
import { MetricHint } from "../../components/MetricHint";
import type {
  NetworkEvent,
  NeuronSnapshot,
  SynapseSnapshot,
} from "../../types/neural";
import {
  distanceToThresholdMv,
  electricalState,
  neuronIsDeveloping,
  neuronIsElectricallyEligible,
  shortNeuronId,
} from "../../types/neural";
import type { NodeCategory } from "../../types/ui";

interface NodePanelProps {
  neuron: NeuronSnapshot | null;
  networkTick: number;
  synapses: SynapseSnapshot[];
  events: NetworkEvent[];
}

const CATEGORIES: Array<{ id: NodeCategory; label: string }> = [
  { id: "electrical", label: "Electrical" },
  { id: "recovery", label: "Recovery" },
  { id: "connections", label: "Connections" },
  { id: "history", label: "History" },
  { id: "biology", label: "Biology" },
];

function formatMv(value: number): string {
  return `${value.toFixed(1)} mV`;
}

function formatPos(pos: { x: number; y: number } | null | undefined): string {
  if (!pos) return "—";
  return `x=${pos.x.toFixed(2)}, y=${pos.y.toFixed(2)}`;
}

export function NodePanel({ neuron, networkTick, synapses, events }: NodePanelProps) {
  const [category, setCategory] = useState<NodeCategory>("electrical");

  if (!neuron) {
    return <p className="hint">Select a neuron on the network graph to inspect it.</p>;
  }

  const developing = neuronIsDeveloping(neuron);
  const eligible = neuronIsElectricallyEligible(neuron, networkTick);
  const showLifecycleInspector = developing || !eligible;

  if (showLifecycleInspector) {
    return (
      <div className="node-panel" data-testid="lifecycle-inspector">
        <div className="panel-lede">
          <strong>{shortNeuronId(neuron.id)}</strong>
          <span className={`state-badge state-lifecycle-${neuron.lifecycle}`}>
            {neuron.lifecycle}
          </span>
        </div>
        <p className="hint" data-testid="lifecycle-no-stim-note">
          Developing / electrically ineligible cells have no stimulation controls. Values are from
          the backend snapshot only.
        </p>
        <dl className="status-list panel-metrics">
          <div className="status-row">
            <dt>Lifecycle</dt>
            <dd data-testid="lifecycle-state">{neuron.lifecycle}</dd>
          </div>
          <div className="status-row">
            <dt>Developmental age</dt>
            <dd>{neuron.developmentalAge}</dd>
          </div>
          <div className="status-row">
            <dt>Phase age</dt>
            <dd>{neuron.phaseAge}</dd>
          </div>
          <div className="status-row">
            <dt>Birth tick</dt>
            <dd>{neuron.birthTick}</dd>
          </div>
          <div className="status-row">
            <dt>Origin</dt>
            <dd>{neuron.developmentalOrigin}</dd>
          </div>
          <div className="status-row">
            <dt>Cell type assigned</dt>
            <dd className="capitalize">{neuron.cellTypeAssigned ?? "pending"}</dd>
          </div>
          <div className="status-row">
            <dt>Position</dt>
            <dd data-testid="lifecycle-position">{formatPos(neuron.position)}</dd>
          </div>
          <div className="status-row">
            <dt>Target position</dt>
            <dd>{formatPos(neuron.targetPosition)}</dd>
          </div>
          <div className="status-row">
            <dt>Migration progress</dt>
            <dd data-testid="lifecycle-migration-progress">
              {(neuron.migrationProgress * 100).toFixed(0)}%
            </dd>
          </div>
          <div className="status-row">
            <dt>Migration distance</dt>
            <dd>{neuron.migrationDistance.toFixed(3)}</dd>
          </div>
          <div className="status-row">
            <dt>Morphology progress</dt>
            <dd>{(neuron.morphologyProgress * 100).toFixed(0)}%</dd>
          </div>
          <div className="status-row">
            <dt>Electrically eligible from</dt>
            <dd>
              {neuron.electricallyEligibleFromTick != null
                ? `Tick ${neuron.electricallyEligibleFromTick}`
                : "Not yet"}
            </dd>
          </div>
          {neuron.blockingConditions.length > 0 ? (
            <div className="status-block">
              <dt style={{ color: "var(--text-muted)", marginBottom: 6 }}>Blocking conditions</dt>
              <dd style={{ textAlign: "left", fontWeight: 400 }}>
                <ul className="reason-code-list">
                  {neuron.blockingConditions.map((code) => (
                    <li key={code}>{code}</li>
                  ))}
                </ul>
              </dd>
            </div>
          ) : null}
        </dl>
      </div>
    );
  }

  const state = electricalState(neuron);
  const distance = distanceToThresholdMv(neuron);
  const incoming = synapses.filter((c) => c.targetNeuronId === neuron.id).length;
  const outgoing = synapses.filter((c) => c.sourceNeuronId === neuron.id).length;
  const latestReceived = events.find(
    (event) =>
      event.type === "signal_propagated" && event.targetNeuronId === neuron.id,
  );
  const latestFire = events.find(
    (event) => event.type === "neuron_fired" && event.neuronId === neuron.id,
  );

  return (
    <div className="node-panel" data-testid="neuron-inspector-panel">
      <div className="panel-lede">
        <strong>{shortNeuronId(neuron.id)}</strong>
        <span className={`state-badge state-${state.toLowerCase()}`}>{state}</span>
      </div>

      <div className="segmented" role="tablist" aria-label="Neuron detail categories">
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

      <dl className="status-list panel-metrics">
        {category === "electrical" ? (
          <>
            <div className="status-row">
              <dt>
                <MetricHint metric="membranePotential" label="Membrane Potential" />
              </dt>
              <dd>{formatMv(neuron.membranePotentialMv)}</dd>
            </div>
            <div className="status-row">
              <dt>
                <MetricHint metric="restingPotential" label="Resting Potential" />
              </dt>
              <dd>{formatMv(neuron.restingPotentialMv)}</dd>
            </div>
            <div className="status-row">
              <dt>
                <MetricHint metric="threshold" label="Threshold" />
              </dt>
              <dd>{formatMv(neuron.thresholdMv)}</dd>
            </div>
            <div className="status-row">
              <dt>
                <MetricHint metric="distanceToThreshold" label="Distance to Threshold" />
              </dt>
              <dd>{formatMv(distance)}</dd>
            </div>
            <div className="status-row">
              <dt>
                <MetricHint metric="firedLastTick" label="Fired Status" />
              </dt>
              <dd>{neuron.fired ? "Fired" : "Not fired"}</dd>
            </div>
            <div className="status-row">
              <dt>
                <MetricHint metric="neuronTick" label="Neuron Tick" />
              </dt>
              <dd>{neuron.tick}</dd>
            </div>
          </>
        ) : null}

        {category === "recovery" ? (
          <>
            <div className="status-row">
              <dt>
                <MetricHint metric="refractoryTicks" label="Refractory Ticks" />
              </dt>
              <dd>{neuron.refractoryTicks}</dd>
            </div>
            <div className="status-row">
              <dt>
                <MetricHint metric="fatigue" label="Fatigue" />
              </dt>
              <dd>{neuron.fatigue}</dd>
            </div>
            <div className="status-row">
              <dt>
                <MetricHint metric="energy" label="Energy" />
              </dt>
              <dd>{neuron.energy}%</dd>
            </div>
          </>
        ) : null}

        {category === "connections" ? (
          <>
            <div className="status-row">
              <dt>
                <MetricHint metric="incoming" label="Incoming Connections" />
              </dt>
              <dd>{incoming}</dd>
            </div>
            <div className="status-row">
              <dt>
                <MetricHint metric="outgoing" label="Outgoing Connections" />
              </dt>
              <dd>{outgoing}</dd>
            </div>
            <div className="status-row">
              <dt>
                <MetricHint metric="latestSignal" label="Latest Received Signal" />
              </dt>
              <dd>
                {latestReceived?.amountMv != null
                  ? `${latestReceived.amountMv >= 0 ? "+" : ""}${latestReceived.amountMv} mV`
                  : "None"}
              </dd>
            </div>
          </>
        ) : null}

        {category === "biology" ? (
          <>
            <div className="status-row">
              <dt>
                <MetricHint metric="region" label="Region" />
              </dt>
              <dd>{neuron.region}</dd>
            </div>
            <div className="status-row">
              <dt>
                <MetricHint metric="layer" label="Layer" />
              </dt>
              <dd>{neuron.layer}</dd>
            </div>
            <div className="status-row">
              <dt>
                <MetricHint metric="cellType" label="Cell Type" />
              </dt>
              <dd className="capitalize">{neuron.cellType}</dd>
            </div>
            <div className="status-row">
              <dt>
                <MetricHint metric="dnaId" label="DNA ID" />
              </dt>
              <dd>{neuron.dnaId}</dd>
            </div>
            <div className="status-row">
              <dt>
                <MetricHint metric="position" label="Position" />
              </dt>
              <dd>{formatPos(neuron.position)}</dd>
            </div>
            <div className="status-row">
              <dt>
                <MetricHint metric="somaRadius" label="Soma Radius" />
              </dt>
              <dd>{neuron.somaRadius.toFixed(3)}</dd>
            </div>
            <div className="status-row">
              <dt>
                <MetricHint metric="dendriteRadius" label="Dendrite Radius" />
              </dt>
              <dd>{neuron.dendriteRadius.toFixed(3)}</dd>
            </div>
            <div className="status-row">
              <dt>
                <MetricHint metric="axonLength" label="Axon Length" />
              </dt>
              <dd>{neuron.axonLength.toFixed(3)}</dd>
            </div>
            <div className="status-row">
              <dt>Birth tick</dt>
              <dd data-testid="settled-birth-tick">{neuron.birthTick}</dd>
            </div>
            {neuron.settledTick != null ? (
              <div className="status-row">
                <dt>Settled tick</dt>
                <dd data-testid="settled-settled-tick">{neuron.settledTick}</dd>
              </div>
            ) : null}
            <div className="status-row">
              <dt>Developmental origin</dt>
              <dd data-testid="settled-developmental-origin">{neuron.developmentalOrigin}</dd>
            </div>
            {neuron.migrationDistance > 0 ? (
              <div className="status-row">
                <dt>Migration distance</dt>
                <dd data-testid="settled-migration-distance">
                  {neuron.migrationDistance.toFixed(3)}
                </dd>
              </div>
            ) : null}
            {neuron.originalTargetPosition ? (
              <div className="status-row">
                <dt>Original target</dt>
                <dd data-testid="settled-original-target">
                  {formatPos(neuron.originalTargetPosition)}
                </dd>
              </div>
            ) : null}
          </>
        ) : null}

        {category === "history" ? (
          <>
            <div className="status-row">
              <dt>
                <MetricHint metric="latestFiringTick" label="Latest Firing Tick" />
              </dt>
              <dd>{latestFire ? latestFire.networkTick : "None"}</dd>
            </div>
            <div className="status-row">
              <dt>
                <MetricHint metric="networkTick" label="Network Tick" />
              </dt>
              <dd>{networkTick}</dd>
            </div>
            <div className="status-block">
              <dt style={{ color: "var(--text-muted)", marginBottom: 6 }}>Recent events</dt>
              <dd style={{ textAlign: "left", fontWeight: 400 }}>
                {events.filter(
                  (event) =>
                    event.neuronId === neuron.id ||
                    event.sourceNeuronId === neuron.id ||
                    event.targetNeuronId === neuron.id,
                ).length === 0 ? (
                  <span className="hint">No recent events for this neuron.</span>
                ) : (
                  <ul className="timeline-list">
                    {events
                      .filter(
                        (event) =>
                          event.neuronId === neuron.id ||
                          event.sourceNeuronId === neuron.id ||
                          event.targetNeuronId === neuron.id,
                      )
                      .slice(0, 8)
                      .map((event) => (
                        <li key={event.id} className="timeline-item">
                          <div className="timeline-title">
                            Tick {event.networkTick} · {event.type}
                          </div>
                          <div className="timeline-detail">{event.message}</div>
                        </li>
                      ))}
                  </ul>
                )}
              </dd>
            </div>
          </>
        ) : null}
      </dl>
    </div>
  );
}
