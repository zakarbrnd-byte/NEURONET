import { useMemo, useState } from "react";
import type { TimelineEntry } from "../../types/neural";
import { shortNeuronId } from "../../types/neural";
import type { TimelineFilter } from "../../types/ui";

interface TimelinePanelProps {
  entries: TimelineEntry[];
}

const FILTERS: Array<{ id: TimelineFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "fired", label: "Fired" },
  { id: "signals", label: "Signals" },
  { id: "recovery", label: "Recovery" },
];

function matchesFilter(entry: TimelineEntry, filter: TimelineFilter): boolean {
  if (filter === "all") return true;
  if (filter === "fired") return entry.firedNeuronIds.length > 0;
  if (filter === "signals") return entry.propagations.length > 0;
  return entry.firedNeuronIds.length === 0 && entry.propagations.length === 0;
}

export function TimelinePanel({ entries }: TimelinePanelProps) {
  const [filter, setFilter] = useState<TimelineFilter>("all");
  const visible = useMemo(
    () => entries.filter((entry) => matchesFilter(entry, filter)).slice(0, 20),
    [entries, filter],
  );

  return (
    <div className="timeline-panel">
      <div className="segmented" role="tablist" aria-label="Timeline filters">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={filter === item.id}
            className={`segmented-item ${filter === item.id ? "is-active" : ""}`}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="hint">No matching ticks yet.</p>
      ) : (
        <ol className="timeline-list">
          {visible.map((entry) => (
            <li key={`tick-${entry.tick}-${entry.summary}`} className="timeline-item">
              <div className="timeline-title">Tick {entry.tick}</div>
              <div>{entry.summary}</div>
              {entry.firedNeuronIds.length > 0 ? (
                <div className="timeline-detail">
                  Fired: {entry.firedNeuronIds.map(shortNeuronId).join(", ")}
                </div>
              ) : (
                <div className="timeline-detail">Fired: none</div>
              )}
              {entry.propagations.length > 0 ? (
                entry.propagations.map((propagation) => (
                  <div key={propagation.eventId} className="timeline-detail">
                    {shortNeuronId(propagation.sourceNeuronId)} →{" "}
                    {shortNeuronId(propagation.targetNeuronId)}: +{propagation.amountMv} mV
                  </div>
                ))
              ) : (
                <div className="timeline-detail">Signals: none</div>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
