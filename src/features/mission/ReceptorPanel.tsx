import type { SensoryConnection, SensoryReceptor } from "../../types/neural";
import { receptorTypeLabel, shortNeuronId } from "../../types/neural";

interface ReceptorPanelProps {
  receptor: SensoryReceptor | null;
  connections: SensoryConnection[];
}

export function ReceptorPanel({ receptor, connections }: ReceptorPanelProps) {
  if (!receptor) {
    return (
      <p className="hint">
        Select a sensory receptor in Tissue Sensory mode to inspect it.
      </p>
    );
  }

  const outbound = connections.filter((c) => c.receptorId === receptor.id);

  return (
    <div className="receptor-panel" data-testid="receptor-panel">
      <div className="panel-lede">
        <strong data-testid="receptor-id">{receptor.id}</strong>
        <span
          className={`state-badge ${receptor.active ? "state-fired" : "state-resting"}`}
          data-testid="receptor-active"
        >
          {receptor.active ? "Active" : "Idle"}
        </span>
      </div>
      <p className="hint" data-testid="receptor-no-stim-note">
        Sensory receptors are environment input channels. They have no neuron firing controls.
        Values come from the backend snapshot only.
      </p>
      <dl className="status-list panel-metrics">
        <div className="status-row">
          <dt>Receptor type</dt>
          <dd data-testid="receptor-type">{receptorTypeLabel(receptor.receptorType)}</dd>
        </div>
        <div className="status-row">
          <dt>Region</dt>
          <dd data-testid="receptor-region">{receptor.region}</dd>
        </div>
        <div className="status-row">
          <dt>Position</dt>
          <dd data-testid="receptor-position">
            x={receptor.position.x.toFixed(2)}, y={receptor.position.y.toFixed(2)}
          </dd>
        </div>
        <div className="status-row">
          <dt>Sensitivity</dt>
          <dd data-testid="receptor-sensitivity">{receptor.sensitivity.toFixed(2)}</dd>
        </div>
        <div className="status-row">
          <dt>Activation threshold</dt>
          <dd data-testid="receptor-threshold">{receptor.activationThreshold.toFixed(2)}</dd>
        </div>
        <div className="status-row">
          <dt>Current activation</dt>
          <dd data-testid="receptor-activation">{receptor.currentActivation.toFixed(2)}</dd>
        </div>
        <div className="status-row">
          <dt>Last activated tick</dt>
          <dd data-testid="receptor-last-tick">
            {receptor.lastActivatedTick != null ? `Tick ${receptor.lastActivatedTick}` : "Never"}
          </dd>
        </div>
        <div className="status-row">
          <dt>Activation count</dt>
          <dd data-testid="receptor-activation-count">{receptor.activationCount}</dd>
        </div>
      </dl>

      <h3 className="help-heading">Sensory connections</h3>
      {outbound.length === 0 ? (
        <p className="hint">No sensory connections from this receptor.</p>
      ) : (
        <ul className="receptor-connection-list" data-testid="receptor-connections">
          {outbound.map((conn) => (
            <li key={conn.id} data-testid={`receptor-connection-${conn.id}`}>
              <span>{conn.id}</span>
              <span>
                → {shortNeuronId(conn.targetNeuronId)} · {conn.weightMv.toFixed(1)} mV
                {conn.enabled ? "" : " (disabled)"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
