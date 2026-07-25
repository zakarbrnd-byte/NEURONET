import type { TimelineEntry } from "../../types/neural";
import { shortNeuronId } from "../../types/neural";

interface TimelineProps {
  entries: TimelineEntry[];
}

export function Timeline({ entries }: TimelineProps) {
  return (
    <section className="card" aria-labelledby="timeline-heading">
      <h2 id="timeline-heading" className="card-title">
        Tick Timeline
      </h2>
      <p className="hint">Display history of backend step traces. Newest first.</p>

      {entries.length === 0 ? (
        <p className="hint">No ticks observed yet.</p>
      ) : (
        <ol className="timeline-list">
          {entries.map((entry) => (
            <li key={`tick-${entry.tick}-${entry.summary}`} className="timeline-item">
              <div className="timeline-title">Tick {entry.tick}</div>
              <div>{entry.summary}</div>
              {entry.firedNeuronIds.length > 0 ? (
                <div className="timeline-detail">
                  Fired: {entry.firedNeuronIds.map(shortNeuronId).join(", ")}
                </div>
              ) : null}
              {entry.propagations.map((propagation) => (
                <div
                  key={propagation.eventId}
                  className="timeline-detail"
                >
                  {shortNeuronId(propagation.sourceNeuronId)} →{" "}
                  {shortNeuronId(propagation.targetNeuronId)}: +{propagation.amountMv} mV
                </div>
              ))}
              <div className="timeline-detail">
                Depolarized neurons: {entry.depolarizedCount}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
