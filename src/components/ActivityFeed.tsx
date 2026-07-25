import type { NetworkEvent } from "../types/neural";

interface ActivityFeedProps {
  events: NetworkEvent[];
}

const MAX_VISIBLE = 40;

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }
  return date.toLocaleTimeString();
}

export function ActivityFeed({ events }: ActivityFeedProps) {
  const visible = events.slice(0, MAX_VISIBLE);

  return (
    <section className="card" aria-labelledby="activity-heading">
      <h2 id="activity-heading" className="card-title">
        Backend Events
      </h2>
      <p className="hint">Newest first. These events come from the Rust backend.</p>

      {visible.length === 0 ? (
        <p className="hint">No backend events yet.</p>
      ) : (
        <ol className="activity-list">
          {visible.map((event) => (
            <li key={event.id} className="activity-item">
              <div className="event-meta">
                <span>{formatTime(event.timestamp)}</span>
                <span>tick {event.networkTick}</span>
                <span className="event-type">{event.type}</span>
              </div>
              <div>{event.message}</div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
