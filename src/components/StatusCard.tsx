import type { NeuronData } from "../types/neuron";

interface StatusCardProps {
  neuron: NeuronData;
}

function formatNumber(value: number): string {
  // Keep the Debug Board readable without long floating-point noise.
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export function StatusCard({ neuron }: StatusCardProps) {
  const activationPercent = Math.min(
    100,
    (neuron.activation / Math.max(neuron.threshold, 0.0001)) * 100,
  );

  return (
    <section className="card" aria-labelledby="status-heading">
      <h2 id="status-heading" className="card-title">
        Neuron Status
      </h2>

      <dl className="status-list">
        <div className="status-row">
          <dt>Neuron ID</dt>
          <dd>{neuron.id}</dd>
        </div>
        <div className="status-row">
          <dt>Activation</dt>
          <dd>{formatNumber(neuron.activation)}</dd>
        </div>
        <div className="status-row">
          <dt>Threshold</dt>
          <dd>{formatNumber(neuron.threshold)}</dd>
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
          <dt>Refractory</dt>
          <dd>{neuron.refractoryTicks}</dd>
        </div>
        <div className="status-row">
          <dt>Tick</dt>
          <dd>{neuron.tick}</dd>
        </div>
        <div className="status-row">
          <dt>Fired</dt>
          <dd>
            <span className={`state-badge ${neuron.fired ? "state-fired" : "state-quiet"}`}>
              {neuron.fired ? "true" : "false"}
            </span>
          </dd>
        </div>
      </dl>

      <div className="energy-block">
        <div className="energy-label-row">
          <span>Activation vs Threshold</span>
          <span>
            {formatNumber(neuron.activation)} / {formatNumber(neuron.threshold)}
          </span>
        </div>
        <div
          className="energy-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(activationPercent)}
          aria-label="Neuron activation toward threshold"
        >
          <div
            className={`energy-fill ${neuron.fired ? "energy-fill-fired" : ""}`}
            style={{ width: `${Math.max(0, Math.min(100, activationPercent))}%` }}
          />
        </div>
      </div>

      <div className="energy-block">
        <div className="energy-label-row">
          <span>Energy</span>
          <span>{formatNumber(neuron.energy)}%</span>
        </div>
        <div
          className="energy-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={neuron.energy}
          aria-label="Neuron energy"
        >
          <div
            className="energy-fill"
            style={{ width: `${Math.max(0, Math.min(100, neuron.energy))}%` }}
          />
        </div>
      </div>
    </section>
  );
}
