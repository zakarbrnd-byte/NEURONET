import type { SynapseSnapshot } from "../../types/neural";
import { shortNeuronId } from "../../types/neural";

interface SynapsePanelProps {
  synapse: SynapseSnapshot | null;
}

function pct(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

function shortSynapseId(id: string): string {
  return id.replace("SYNAPSE-", "S-").replace("CONNECTION-", "C-");
}

export function SynapsePanel({ synapse }: SynapsePanelProps) {
  if (!synapse) {
    return (
      <p className="hint">
        Tap a connection (axon) on Network or Tissue View to inspect a living synapse.
      </p>
    );
  }

  const history = [...synapse.weightHistory].slice().reverse();

  return (
    <div className="synapse-panel" data-testid="synapse-panel">
      <div className="panel-lede">
        <strong>{shortSynapseId(synapse.id)}</strong>
        <span className={`state-badge state-${synapse.type}`}>{synapse.type}</span>
      </div>
      <p className="hint">
        {shortNeuronId(synapse.sourceNeuronId)} → {shortNeuronId(synapse.targetNeuronId)}
      </p>

      <dl className="status-list panel-metrics">
        <div className="status-row">
          <dt>Weight</dt>
          <dd>
            {synapse.weight.toFixed(2)} mV
            {synapse.lastWeightDelta !== 0 ? (
              <span
                className={
                  synapse.lastWeightDelta > 0 ? "synapse-delta-up" : "synapse-delta-down"
                }
              >
                {" "}
                ({synapse.lastWeightDelta > 0 ? "+" : ""}
                {synapse.lastWeightDelta.toFixed(2)})
              </span>
            ) : null}
          </dd>
        </div>
        <div className="status-row">
          <dt>Usage</dt>
          <dd>{synapse.usageCount}</dd>
        </div>
        <div className="status-row">
          <dt>Health</dt>
          <dd>{pct(synapse.health)}</dd>
        </div>
        <div className="status-row">
          <dt>Age</dt>
          <dd>{synapse.age} ticks</dd>
        </div>
        <div className="status-row">
          <dt>Stability</dt>
          <dd>{pct(synapse.stability)}</dd>
        </div>
        <div className="status-row">
          <dt>Type</dt>
          <dd className="capitalize">{synapse.type}</dd>
        </div>
        <div className="status-row">
          <dt>Last Used</dt>
          <dd>
            {synapse.lastActivatedTick != null
              ? `Tick ${synapse.lastActivatedTick}`
              : "Never"}
          </dd>
        </div>
        <div className="status-row">
          <dt>Created</dt>
          <dd>Tick {synapse.creationTick}</dd>
        </div>
      </dl>

      <section className="synapse-history" aria-label="Weight history">
        <h3 className="help-heading">Weight history</h3>
        {history.length === 0 ? (
          <p className="hint">No weight samples yet.</p>
        ) : (
          <ol className="weight-history-list">
            {history.map((entry, index) => {
              const older = history[index + 1];
              const arrow =
                older == null
                  ? null
                  : entry.weight > older.weight
                    ? "↑"
                    : entry.weight < older.weight
                      ? "↓"
                      : "·";
              return (
                <li key={`${entry.tick}-${entry.weight}-${index}`}>
                  <span>Tick {entry.tick}</span>
                  <span>
                    {entry.weight.toFixed(2)}
                    {arrow ? ` ${arrow}` : ""}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
