import type { SynapseSnapshot } from "../../types/neural";
import { shortNeuronId } from "../../types/neural";

interface SynapsePanelProps {
  synapse: SynapseSnapshot | null;
  prunedNotice?: string | null;
  maturationTicksRequired?: number;
}

function pct(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

function shortSynapseId(id: string): string {
  return id.replace("SYNAPSE-", "S-").replace("CONNECTION-", "C-");
}

export function SynapsePanel({
  synapse,
  prunedNotice = null,
}: SynapsePanelProps) {
  if (!synapse) {
    return (
      <div data-testid="synapse-panel-empty">
        {prunedNotice ? (
          <p className="hint" data-testid="synapse-pruned-notice" role="status">
            {prunedNotice}
          </p>
        ) : (
          <p className="hint">
            Tap a connection (axon) on Network or Tissue View to inspect a living synapse.
          </p>
        )}
      </div>
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

      <section
        className="synapse-development"
        aria-label="Development pruning observation"
        data-testid="synapse-development-section"
      >
        <h3 className="help-heading">Development</h3>
        <dl className="status-list panel-metrics">
          <div className="status-row">
            <dt>Created tick</dt>
            <dd>Tick {synapse.creationTick}</dd>
          </div>
          <div className="status-row">
            <dt>Origin candidate</dt>
            <dd data-testid="synapse-origin-candidate">
              {synapse.originCandidateId ?? "Initial tissue"}
            </dd>
          </div>
          <div className="status-row">
            <dt>Eligible from</dt>
            <dd>Tick {synapse.eligibleFromTick}</dd>
          </div>
          <div className="status-row">
            <dt>Structural protection</dt>
            <dd data-testid="synapse-structural-protection">
              {synapse.structurallyProtected
                ? synapse.protectionReason?.replaceAll("_", " ") ?? "protected"
                : "none"}
            </dd>
          </div>
          <div className="status-row">
            <dt>Pruning status</dt>
            <dd className="capitalize" data-testid="synapse-pruning-status">
              {synapse.pruningStatus}
            </dd>
          </div>
          <div className="status-row">
            <dt>Pruning risk</dt>
            <dd data-testid="synapse-pruning-risk">{pct(synapse.pruningRisk)}</dd>
          </div>
          <div className="status-row">
            <dt>At-risk evals</dt>
            <dd>{synapse.atRiskEvals}</dd>
          </div>
          <div className="status-row">
            <dt>Inactivity</dt>
            <dd>{synapse.inactivityTicks} ticks</dd>
          </div>
          <div className="status-row">
            <dt>Low-weight duration</dt>
            <dd>{synapse.lowWeightTicks} ticks</dd>
          </div>
          <div className="status-row">
            <dt>Low-health duration</dt>
            <dd>{synapse.lowHealthTicks} ticks</dd>
          </div>
          <div className="status-row">
            <dt>Protected until</dt>
            <dd>Tick {synapse.protectedUntilTick}</dd>
          </div>
        </dl>
        {synapse.pruningReasons.length > 0 ? (
          <ul className="reason-code-list" data-testid="synapse-pruning-reasons">
            {synapse.pruningReasons.map((reason) => (
              <li key={reason}>{reason.replaceAll("_", " ")}</li>
            ))}
          </ul>
        ) : (
          <p className="hint">No pruning reasons.</p>
        )}
      </section>
    </div>
  );
}
