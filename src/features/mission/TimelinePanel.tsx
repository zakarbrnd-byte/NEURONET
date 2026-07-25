import { useMemo, useState } from "react";
import type { NetworkEvent, TimelineEntry } from "../../types/neural";
import {
  isStructuralEventType,
  shortNeuronId,
  structuralEventPlainSummary,
} from "../../types/neural";
import type { TimelineFilter } from "../../types/ui";

interface TimelinePanelProps {
  entries: TimelineEntry[];
  events?: NetworkEvent[];
}

const FILTERS: Array<{ id: TimelineFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "fired", label: "Firing" },
  { id: "signals", label: "Propagation" },
  { id: "recovery", label: "Recovery" },
  { id: "candidates", label: "Candidates" },
  { id: "maturation", label: "Maturation" },
  { id: "pruning", label: "Pruning Risk" },
  { id: "birth", label: "Synapse born" },
  { id: "prune", label: "Synapse pruned" },
  { id: "blocked", label: "Blocked" },
];

function matchesFilter(
  entry: TimelineEntry,
  filter: TimelineFilter,
  tickEvents: NetworkEvent[],
): boolean {
  if (filter === "all") return true;
  if (filter === "fired") return entry.firedNeuronIds.length > 0;
  if (filter === "signals") return entry.propagations.length > 0;
  if (filter === "recovery") {
    return (
      entry.firedNeuronIds.length === 0 &&
      entry.propagations.length === 0 &&
      !tickEvents.some((event) => isStructuralEventType(event.type))
    );
  }
  if (filter === "candidates") {
    return tickEvents.some((event) => event.type.startsWith("growth_candidate_"));
  }
  if (filter === "maturation") {
    return tickEvents.some((event) => event.type === "growth_candidate_maturing");
  }
  if (filter === "pruning") {
    return tickEvents.some((event) => event.type.startsWith("synapse_pruning_"));
  }
  if (filter === "birth") {
    return tickEvents.some((event) => event.type === "synapse_created");
  }
  if (filter === "prune") {
    return tickEvents.some((event) => event.type === "synapse_pruned");
  }
  return tickEvents.some(
    (event) =>
      event.type === "candidate_creation_blocked" || event.type === "pruning_blocked",
  );
}

export function TimelinePanel({ entries, events = [] }: TimelinePanelProps) {
  const [filter, setFilter] = useState<TimelineFilter>("all");
  const eventsByTick = useMemo(() => {
    const map = new Map<number, NetworkEvent[]>();
    for (const event of events) {
      if (!isStructuralEventType(event.type)) continue;
      const list = map.get(event.networkTick) ?? [];
      list.push(event);
      map.set(event.networkTick, list);
    }
    return map;
  }, [events]);

  const visible = useMemo(() => {
    if (
      filter === "candidates" ||
      filter === "maturation" ||
      filter === "pruning" ||
      filter === "birth" ||
      filter === "prune" ||
      filter === "blocked"
    ) {
      const structural = events
        .filter((event) => {
          if (filter === "candidates") {
            return event.type.startsWith("growth_candidate_");
          }
          if (filter === "maturation") {
            return event.type === "growth_candidate_maturing";
          }
          if (filter === "pruning") {
            return event.type.startsWith("synapse_pruning_");
          }
          if (filter === "birth") {
            return event.type === "synapse_created";
          }
          if (filter === "prune") {
            return event.type === "synapse_pruned";
          }
          return (
            event.type === "candidate_creation_blocked" || event.type === "pruning_blocked"
          );
        })
        .slice(0, 20);
      return structural.map((event) => ({
        kind: "structural" as const,
        event,
      }));
    }

    return entries
      .filter((entry) =>
        matchesFilter(entry, filter, eventsByTick.get(entry.tick) ?? []),
      )
      .slice(0, 20)
      .map((entry) => ({ kind: "tick" as const, entry }));
  }, [entries, events, eventsByTick, filter]);

  return (
    <div className="timeline-panel" data-testid="timeline-panel">
      <div className="segmented segmented-wrap" role="tablist" aria-label="Timeline filters">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={filter === item.id}
            className={`segmented-item ${filter === item.id ? "is-active" : ""}`}
            onClick={() => setFilter(item.id)}
            data-testid={`timeline-filter-${item.id}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="hint">No matching ticks yet.</p>
      ) : (
        <ol className="timeline-list">
          {visible.map((item) => {
            if (item.kind === "structural") {
              const event = item.event;
              return (
                <li
                  key={event.id}
                  className="timeline-item timeline-structural"
                  data-testid="timeline-structural-item"
                >
                  <div className="timeline-title">Tick {event.networkTick}</div>
                  <div>{structuralEventPlainSummary(event)}</div>
                  <div className="timeline-detail">
                    Codes: {(event.reasonCodes ?? []).join(", ") || "none"}
                  </div>
                  {event.readinessOrRisk != null ? (
                    <div className="timeline-detail">
                      Metric: {event.readinessOrRisk.toFixed(2)}
                    </div>
                  ) : null}
                  {event.previousStatus || event.newStatus ? (
                    <div className="timeline-detail">
                      Status: {event.previousStatus ?? "—"} → {event.newStatus ?? "—"}
                    </div>
                  ) : null}
                </li>
              );
            }

            const entry = item.entry;
            const structural = eventsByTick.get(entry.tick) ?? [];
            return (
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
                      {shortNeuronId(propagation.targetNeuronId)}:{" "}
                      {propagation.amountMv >= 0 ? "+" : ""}
                      {propagation.amountMv} mV
                    </div>
                  ))
                ) : (
                  <div className="timeline-detail">Signals: none</div>
                )}
                {structural.map((event) => (
                  <div key={event.id} className="timeline-detail timeline-structural-detail">
                    {structuralEventPlainSummary(event)}
                  </div>
                ))}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
