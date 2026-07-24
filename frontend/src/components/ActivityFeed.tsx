import type { ActivityEvent } from "@shared/api-types";

interface ActivityFeedProps {
  events: ActivityEvent[];
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function ActivityFeed({ events }: ActivityFeedProps) {
  return (
    <section className="panel activity-panel" aria-labelledby="activity-title">
      <div className="panel__header">
        <h2 id="activity-title">Activity Feed</h2>
        <p>Newest lifecycle events first</p>
      </div>

      <ol className="activity">
        {events.length === 0 ? (
          <li className="activity__empty">Awaiting organism signals…</li>
        ) : (
          events.map((event) => (
            <li key={event.id} className="activity__item">
              <time dateTime={event.timestamp}>{formatTime(event.timestamp)}</time>
              <strong>{event.category}</strong>
              <span>{event.detail}</span>
            </li>
          ))
        )}
      </ol>
    </section>
  );
}
