import { MetricLabel } from "../../components/MetricLabel";
import type {
  ConnectionSnapshot,
  NetworkEvent,
  NeuronSnapshot,
} from "../../types/neural";
import { distanceToThresholdMv, electricalState } from "../../types/neural";

interface NeuronStatusProps {
  neuron: NeuronSnapshot | null;
  networkTick: number;
  connections: ConnectionSnapshot[];
  events: NetworkEvent[];
  embedded?: boolean;
}

function formatMv(value: number): string {
  return `${value.toFixed(1)} mV`;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export function NeuronStatus({
  neuron,
  networkTick,
  connections,
  events,
  embedded = false,
}: NeuronStatusProps) {
  if (!neuron) {
    return (
      <section className={embedded ? "inspector-body" : "card"}>
        {!embedded ? <h2 className="card-title">Neuron Inspector</h2> : null}
        <p className="hint">Select a backend neuron to inspect its electrical state.</p>
      </section>
    );
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

  const towardThresholdPercent = Math.max(
    0,
    Math.min(
      100,
      ((neuron.membranePotentialMv - neuron.restingPotentialMv) /
        Math.max(neuron.thresholdMv - neuron.restingPotentialMv, 0.0001)) *
        100,
    ),
  );

  return (
    <section
      className={embedded ? "inspector-body" : "card"}
      aria-labelledby={embedded ? undefined : "status-heading"}
    >
      {!embedded ? (
        <>
          <h2 id="status-heading" className="card-title">
            Neuron Inspector
          </h2>
          <p className="hint">
            Values come from the Rust backend. Educational millivolt approximation only.
            Tap the information icons for plain-language explanations.
          </p>
        </>
      ) : (
        <p className="hint">
          Values come from the Rust backend. Tap an information icon for a short explanation.
        </p>
      )}

      <dl className="status-list">
        <div className="status-row">
          <dt>Neuron ID</dt>
          <dd>{neuron.id}</dd>
        </div>
        <div className="status-row">
          <dt>Electrical State</dt>
          <dd>
            <span className={`state-badge state-${state.toLowerCase()}`}>{state}</span>
          </dd>
        </div>
        <div className="status-row">
          <MetricLabel metric="restingPotential" />
          <dd>{formatMv(neuron.restingPotentialMv)}</dd>
        </div>
        <div className="status-row">
          <MetricLabel metric="currentMembranePotential" />
          <dd>{formatMv(neuron.membranePotentialMv)}</dd>
        </div>
        <div className="status-row">
          <MetricLabel metric="fireThreshold" />
          <dd>{formatMv(neuron.thresholdMv)}</dd>
        </div>
        <div className="status-row">
          <MetricLabel metric="distanceToThreshold" />
          <dd>{formatMv(distance)}</dd>
        </div>
        <div className="status-row">
          <MetricLabel metric="energy" />
          <dd>{formatNumber(neuron.energy)}%</dd>
        </div>
        <div className="status-row">
          <MetricLabel metric="fatigue" />
          <dd>{formatNumber(neuron.fatigue)}</dd>
        </div>
        <div className="status-row">
          <MetricLabel metric="refractoryTicks" />
          <dd>{neuron.refractoryTicks}</dd>
        </div>
        <div className="status-row">
          <MetricLabel metric="firedDuringLastTick" />
          <dd>{neuron.fired ? "true" : "false"}</dd>
        </div>
        <div className="status-row">
          <MetricLabel metric="incomingConnections" />
          <dd>{incoming}</dd>
        </div>
        <div className="status-row">
          <MetricLabel metric="outgoingConnections" />
          <dd>{outgoing}</dd>
        </div>
        <div className="status-row">
          <MetricLabel metric="latestReceivedSignal" />
          <dd>
            {latestReceived?.amountMv != null
              ? `+${latestReceived.amountMv} mV`
              : "None"}
          </dd>
        </div>
        <div className="status-row">
          <MetricLabel metric="latestFiringTick" />
          <dd>{latestFire ? latestFire.networkTick : "None"}</dd>
        </div>
        <div className="status-row">
          <MetricLabel metric="neuronTick" />
          <dd>{neuron.tick}</dd>
        </div>
        <div className="status-row">
          <MetricLabel metric="networkTick" />
          <dd>{networkTick}</dd>
        </div>
      </dl>

      <div className="energy-block">
        <div className="energy-label-row">
          <span>Depolarization Progress</span>
          <span>{towardThresholdPercent.toFixed(0)}%</span>
        </div>
        <div
          className="energy-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(towardThresholdPercent)}
          aria-label="Depolarization toward threshold"
        >
          <div
            className={`energy-fill ${state === "Fired" ? "energy-fill-fired" : ""}`}
            style={{ width: `${towardThresholdPercent}%` }}
          />
        </div>
      </div>
    </section>
  );
}
