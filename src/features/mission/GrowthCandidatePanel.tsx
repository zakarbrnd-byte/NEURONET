import type { GrowthCandidate } from "../../types/neural";
import { shortNeuronId } from "../../types/neural";

interface GrowthCandidatePanelProps {
  candidate: GrowthCandidate | null;
  maturationTicksRequired: number;
  creationThreshold?: number;
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
  creationThreshold = 0.65,
}: GrowthCandidatePanelProps) {
  if (!candidate) {
    return (
      <p className="hint">
        Tap a dashed growth-candidate path in Tissue Development mode. Creation happens only
        when the backend commits a matured candidate — never from this panel.
      </p>
    );
  }

  const requiredMaturation =
    candidate.requiredMaturationEvals ?? maturationTicksRequired;
  const threshold = candidate.creationThreshold ?? creationThreshold;
  const maxReadiness = candidate.maxReadiness ?? candidate.readiness;
  const whyNot =
    candidate.whyNotCreated && candidate.whyNotCreated.length > 0
      ? candidate.whyNotCreated
      : candidate.blockingReasons;
  const maturationProgress = Math.min(
    1,
    candidate.maturationTicks / Math.max(1, requiredMaturation),
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

      <section aria-label="Why not created yet" data-testid="candidate-why-not-created">
        <h3 className="help-heading">Why not created yet?</h3>
        {whyNot.length === 0 ? (
          <p className="hint">
            No blocking reasons — waiting for the next structural commit evaluation.
          </p>
        ) : (
          <ul className="reason-code-list">
            {whyNot.map((reason) => (
              <li key={reason}>{reasonLabel(reason)}</li>
            ))}
          </ul>
        )}
      </section>

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
          <dt>Readiness / threshold</dt>
          <dd data-testid="candidate-readiness">
            {pct(candidate.readiness)} / {pct(threshold)}
            {candidate.readinessDelta != null
              ? ` (Δ ${candidate.readinessDelta >= 0 ? "+" : ""}${candidate.readinessDelta.toFixed(3)})`
              : ""}
          </dd>
        </div>
        <div className="status-row">
          <dt>Max readiness</dt>
          <dd data-testid="candidate-max-readiness">{pct(maxReadiness)}</dd>
        </div>
        <div className="status-row">
          <dt>Maturation</dt>
          <dd data-testid="candidate-maturation">
            {candidate.maturationTicks}/{requiredMaturation} (
            {pct(maturationProgress)})
          </dd>
        </div>
        <div className="status-row">
          <dt>Coactivation evidence</dt>
          <dd data-testid="candidate-coactivation">
            {candidate.coactivationScore.toFixed(2)}
          </dd>
        </div>
        <div className="status-row">
          <dt>Consecutive eligible</dt>
          <dd>{candidate.consecutiveEligibleEvals ?? "—"}</dd>
        </div>
        <div className="status-row">
          <dt>Last evidence tick</dt>
          <dd>
            {candidate.lastEvidenceTick != null ? `Tick ${candidate.lastEvidenceTick}` : "—"}
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
          <dt>Structural reach</dt>
          <dd>
            {candidate.withinStructuralReach == null
              ? "—"
              : candidate.withinStructuralReach
                ? "Yes"
                : "No"}
          </dd>
        </div>
        <div className="status-row">
          <dt>Source out / limit</dt>
          <dd>
            {candidate.sourceOutgoingCount ?? "—"} / {candidate.maxOutgoingLimit ?? "—"}
          </dd>
        </div>
        <div className="status-row">
          <dt>Target in / limit</dt>
          <dd>
            {candidate.targetIncomingCount ?? "—"} / {candidate.maxIncomingLimit ?? "—"}
          </dd>
        </div>
        <div className="status-row">
          <dt>Total synapses / limit</dt>
          <dd>
            {candidate.totalSynapseCount ?? "—"} / {candidate.maxTotalSynapsesLimit ?? "—"}
          </dd>
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
