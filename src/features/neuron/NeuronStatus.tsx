import type { NeuronSnapshot } from "../../types/neural";
import { distanceToThresholdMv, electricalState } from "../../types/neural";

interface NeuronStatusProps {
  neuron: NeuronSnapshot | null;
  networkTick: number;
}

function formatMv(value: number): string {
  return `${value.toFixed(1)} mV`;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export function NeuronStatus({ neuron, networkTick }: NeuronStatusProps) {
  if (!neuron) {
    return (
      <section className="card">
        <h2 className="card-title">Neuron Status</h2>
        <p className="hint">Select a backend neuron to inspect its electrical state.</p>
      </section>
    );
  }

  const state = electricalState(neuron);
  const distance = distanceToThresholdMv(neuron);
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
    <section className="card" aria-labelledby="status-heading">
      <h2 id="status-heading" className="card-title">
        Neuron Status
      </h2>
      <p className="hint">
        Values come from the Rust backend. This is an educational millivolt approximation, not a
        full biophysical simulation.
      </p>

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
        <div className="status-block">
          <div className="status-row">
            <dt>Resting Potential</dt>
            <dd>{formatMv(neuron.restingPotentialMv)}</dd>
          </div>
          <p className="field-note">The quiet baseline of this neuron.</p>
        </div>
        <div className="status-block">
          <div className="status-row">
            <dt>Current Membrane Potential</dt>
            <dd>{formatMv(neuron.membranePotentialMv)}</dd>
          </div>
          <p className="field-note">
            {distance > 0
              ? `The neuron is ${distance.toFixed(1)} mV away from firing.`
              : "The membrane is at or above the fire threshold."}
          </p>
        </div>
        <div className="status-block">
          <div className="status-row">
            <dt>Fire Threshold</dt>
            <dd>{formatMv(neuron.thresholdMv)}</dd>
          </div>
          <p className="field-note">Crossing this level causes a spike.</p>
        </div>
        <div className="status-row">
          <dt>Distance to Threshold</dt>
          <dd>{formatMv(distance)}</dd>
        </div>
        <div className="status-row">
          <dt>Energy</dt>
          <dd>{formatNumber(neuron.energy)}%</dd>
        </div>
        <div className="status-row">
          <dt>Fatigue</dt>
          <dd>{formatNumber(neuron.fatigue)}</dd>
        </div>
        <div className="status-row">
          <dt>Refractory Ticks</dt>
          <dd>{neuron.refractoryTicks}</dd>
        </div>
        <div className="status-row">
          <dt>Fired During Last Tick</dt>
          <dd>{neuron.fired ? "true" : "false"}</dd>
        </div>
        <div className="status-row">
          <dt>Neuron Tick</dt>
          <dd>{neuron.tick}</dd>
        </div>
        <div className="status-row">
          <dt>Network Tick</dt>
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
