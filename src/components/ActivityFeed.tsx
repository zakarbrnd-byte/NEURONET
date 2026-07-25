interface ActivityFeedProps {
  items: string[];
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <section className="card" aria-labelledby="activity-heading">
      <h2 id="activity-heading" className="card-title">
        Activity Feed
      </h2>
      <ol className="activity-list">
        {items.map((item, index) => (
          <li key={`${index}-${item}`} className="activity-item">
            {item}
          </li>
        ))}
      </ol>
    </section>
  );
}
