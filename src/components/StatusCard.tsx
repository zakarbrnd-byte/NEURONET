import type { NodeData } from "../types/node";

interface StatusCardProps {
  node: NodeData;
}

export function StatusCard({ node }: StatusCardProps) {
  return (
    <section className="card" aria-labelledby="status-heading">
      <h2 id="status-heading" className="card-title">
        Node Status
      </h2>

      <dl className="status-list">
        <div className="status-row">
          <dt>Node ID</dt>
          <dd>{node.id}</dd>
        </div>
        <div className="status-row">
          <dt>State</dt>
          <dd>
            <span className={`state-badge state-${node.state.toLowerCase()}`}>
              {node.state}
            </span>
          </dd>
        </div>
        <div className="status-row">
          <dt>Energy</dt>
          <dd>{node.energy}%</dd>
        </div>
        <div className="status-row">
          <dt>Tick</dt>
          <dd>{node.tick}</dd>
        </div>
        <div className="status-row">
          <dt>Last Message</dt>
          <dd className="message-value">{node.lastMessage}</dd>
        </div>
      </dl>

      <div className="energy-block">
        <div className="energy-label-row">
          <span>Energy</span>
          <span>{node.energy}%</span>
        </div>
        <div
          className="energy-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={node.energy}
          aria-label="Node energy"
        >
          <div
            className="energy-fill"
            style={{ width: `${Math.max(0, Math.min(100, node.energy))}%` }}
          />
        </div>
      </div>
    </section>
  );
}
