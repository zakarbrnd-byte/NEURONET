import type { GrowthCandidate } from "../../types/neural";
import { shortNeuronId } from "../../types/neural";

interface GrowthCandidatePanelProps {
  candidate: GrowthCandidate | null;
  maturationTicksRequired: number;
}

function pct(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

function reasonLabel(code: string): string {
  return code.replaceAll("_", " ");
}

export function GrowthCandidatePanel({
  candidate,
  maturationTicksRequired,
}: GrowthCandidatePanelProps) {
  if (!candidate) {
    return (
      <p className="hint">
        Tap a dashed growth-candidate path in Tissue Development mode. Creation happens only
        when the backend commits a matured candidate — never from this panel.
      </p>
    );
  }

  const maturationProgress = Math.min(
    1,
    candidate.maturationTicks / Math.max(1, maturationTicksRequired),
  );

  return (
    <div className="candidate-panel" data-testid="growth-candidate-panel">
      <div className="panel-lede">
        <strong>{candidate.id}</strong>
        <span className={`state-badge state-${candidate.status}`}>{candidate.status}</span>
      </div>
      <p className="hint">
        Candidate {shortNeuronId(candidate.sourceNeuronId)} →{" "}
        {shortNeuronId(candidate.targetNeuronId)} · not a real synapse
      </p>

      <dl className="status-list panel-metrics">
        <div className="status-row">
          <dt>Proposed type</dt>
          <dd className="capitalize">{candidate.proposedConnectionType}</dd>
        </div>
        <div className="status-row">
          <dt>Status</dt>
          <dd className="capitalize">{candidate.status}</dd>
        </div>
        <div className="status-row">
          <dt>Readiness</dt>
          <dd data-testid="candidate-readiness">{pct(candidate.readiness)}</dd>
        </div>
        <div className="status-row">
          <dt>Maturation</dt>
          <dd>
            {candidate.maturationTicks}/{maturationTicksRequired} (
            {pct(maturationProgress)})
          </dd>
        </div>
        <div className="status-row">
          <dt>Distance</dt>
          <dd>{candidate.distance.toFixed(3)}</dd>
        </div>
        <div className="status-row">
          <dt>Compatibility</dt>
          <dd>{pct(candidate.structuralCompatibility)}</dd>
        </div>
        <div className="status-row">
          <dt>Coactivation</dt>
          <dd>{candidate.coactivationScore.toFixed(2)}</dd>
        </div>
        <div className="status-row">
          <dt>Created</dt>
          <dd>Tick {candidate.createdTick}</dd>
        </div>
        <div className="status-row">
          <dt>Last evaluated</dt>
          <dd>Tick {candidate.lastEvaluatedTick}</dd>
        </div>
      </dl>

      <section aria-label="Supporting reasons">
        <h3 className="help-heading">Supporting reasons</h3>
        {candidate.supportingReasons.length === 0 ? (
          <p className="hint">None</p>
        ) : (
          <ul className="reason-code-list" data-testid="candidate-supporting-reasons">
            {candidate.supportingReasons.map((reason) => (
              <li key={reason}>{reasonLabel(reason)}</li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Blocking reasons">
        <h3 className="help-heading">Blocking reasons</h3>
        {candidate.blockingReasons.length === 0 ? (
          <p className="hint">None</p>
        ) : (
          <ul className="reason-code-list" data-testid="candidate-blocking-reasons">
            {candidate.blockingReasons.map((reason) => (
              <li key={reason}>{reasonLabel(reason)}</li>
            ))}
          </ul>
        )}
      </section>

      <p className="hint" data-testid="candidate-observe-only">
        No manual create control. The backend alone may birth a synapse after maturation.
      </p>
    </div>
  );
}
