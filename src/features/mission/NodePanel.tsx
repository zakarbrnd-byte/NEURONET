import { useState } from "react";
import { MetricHint } from "../../components/MetricHint";
import type {
  ConnectionSnapshot,
  NetworkEvent,
  NeuronSnapshot,
} from "../../types/neural";
import {
  distanceToThresholdMv,
  electricalState,
  shortNeuronId,
} from "../../types/neural";
import type { NodeCategory } from "../../types/ui";

interface NodePanelProps {
  neuron: NeuronSnapshot | null;
  networkTick: number;
  connections: ConnectionSnapshot[];
  events: NetworkEvent[];
}

const CATEGORIES: Array<{ id: NodeCategory; label: string }> = [
  { id: "electrical", label: "Electrical" },
  { id: "recovery", label: "Recovery" },
  { id: "connections", label: "Connections" },
  { id: "history", label: "History" },
];

function formatMv(value: number): string {
  return `${value.toFixed(1)} mV`;
}

export function NodePanel({ neuron, networkTick, connections, events }: NodePanelProps) {
  const [category, setCategory] = useState<NodeCategory>("electrical");

  if (!neuron) {
    return <p className="hint">Select a neuron on the network graph to inspect it.</p>;
  }

  const state = electricalState(neuron);
  const distance = distanceToThresholdMv(neuron);
  const incoming = connections.filter((c) => c.targetNeuronId === neuron.id).length;
  const outgoing = connections.filter((c) => c.sourceNeuronId === neuron.id).length;
  const latestReceived = events.find(
    (event) =>
      event.type === "signal_propagated" && event.targetNeuronId === neuron.id,
  );
  const latestFire = events.find(
    (event) => event.type === "neuron_fired" && event.neuronId === neuron.id,
  );

  return (
    <div className="node-panel">
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
                <MetricHint metric="restingPotential" label="Resting Potential" />
              </dt>
              <dd>{formatMv(neuron.restingPotentialMv)}</dd>
            </div>
            <div className="status-row">
              <dt>
                <MetricHint metric="membranePotential" label="Membrane Potential" />
              </dt>
              <dd>{formatMv(neuron.membranePotentialMv)}</dd>
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
          </>
        ) : null}

        {category === "recovery" ? (
          <>
            <div className="status-row">
              <dt>
                <MetricHint metric="energy" label="Energy" />
              </dt>
              <dd>{neuron.energy}%</dd>
            </div>
            <div className="status-row">
              <dt>
                <MetricHint metric="fatigue" label="Fatigue" />
              </dt>
              <dd>{neuron.fatigue}</dd>
            </div>
            <div className="status-row">
              <dt>
                <MetricHint metric="refractoryTicks" label="Refractory Ticks" />
              </dt>
              <dd>{neuron.refractoryTicks}</dd>
            </div>
            <div className="status-row">
              <dt>
                <MetricHint metric="firedLastTick" label="Fired Last Tick" />
              </dt>
              <dd>{neuron.fired ? "true" : "false"}</dd>
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
          </>
        ) : null}

        {category === "history" ? (
          <>
            <div className="status-row">
              <dt>
                <MetricHint metric="latestSignal" label="Latest Received Signal" />
              </dt>
              <dd>
                {latestReceived?.amountMv != null
                  ? `+${latestReceived.amountMv} mV`
                  : "None"}
              </dd>
            </div>
            <div className="status-row">
              <dt>
                <MetricHint metric="latestFiringTick" label="Latest Firing Tick" />
              </dt>
              <dd>{latestFire ? latestFire.networkTick : "None"}</dd>
            </div>
            <div className="status-row">
              <dt>
                <MetricHint metric="neuronTick" label="Neuron Tick" />
              </dt>
              <dd>{neuron.tick}</dd>
            </div>
            <div className="status-row">
              <dt>
                <MetricHint metric="networkTick" label="Network Tick" />
              </dt>
              <dd>{networkTick}</dd>
            </div>
          </>
        ) : null}
      </dl>
    </div>
  );
}
