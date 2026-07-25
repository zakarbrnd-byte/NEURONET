import type { ConnectionSnapshot, NetworkEvent, NeuronSnapshot } from "../../types/neural";
import { electricalState } from "../../types/neural";

interface NetworkViewProps {
  neurons: NeuronSnapshot[];
  connections: ConnectionSnapshot[];
  selectedNeuronId: string;
  events: NetworkEvent[];
  onSelectNeuron: (neuronId: string) => void;
}

interface Point {
  x: number;
  y: number;
}

function layoutPositions(count: number, width: number, height: number): Point[] {
  if (count <= 0) {
    return [];
  }

  if (count === 1) {
    return [{ x: width / 2, y: height / 2 }];
  }

  return Array.from({ length: count }, (_, index) => {
    const t = index / (count - 1);
    return {
      x: 48 + t * (width - 96),
      y: height / 2 + Math.sin(t * Math.PI) * -28,
    };
  });
}

export function NetworkView({
  neurons,
  connections,
  selectedNeuronId,
  events,
  onSelectNeuron,
}: NetworkViewProps) {
  const width = 320;
  const height = 200;
  const sorted = [...neurons].sort((a, b) => a.id.localeCompare(b.id));
  const positions = layoutPositions(sorted.length, width, height);
  const byId = new Map(sorted.map((neuron, index) => [neuron.id, { neuron, point: positions[index] }]));

  const activePropagation = new Set(
    events
      .filter((event) => event.type === "signal_propagated")
      .slice(0, 8)
      .map((event) => `${event.sourceNeuronId}->${event.targetNeuronId}`),
  );

  return (
    <section className="card" aria-labelledby="network-heading">
      <h2 id="network-heading" className="card-title">
        Network View
      </h2>
      <p className="hint">
        Drawn only from backend neurons and connections. Tap a neuron to inspect it.
      </p>

      <div className="network-svg-wrap">
        <svg
          className="network-svg"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Backend neural network graph"
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L6,3 L0,6 Z" className="network-arrow" />
            </marker>
          </defs>

          {connections.map((connection) => {
            const source = byId.get(connection.sourceNeuronId);
            const target = byId.get(connection.targetNeuronId);
            if (!source || !target) {
              return null;
            }

            const dx = target.point.x - source.point.x;
            const dy = target.point.y - source.point.y;
            const length = Math.hypot(dx, dy) || 1;
            const inset = 28;
            const x1 = source.point.x + (dx / length) * inset;
            let y1 = source.point.y + (dy / length) * inset;
            const x2 = target.point.x - (dx / length) * inset;
            let y2 = target.point.y - (dy / length) * inset;

            // Slight curve offset for readability.
            y1 -= 4;
            y2 -= 4;

            const key = `${connection.sourceNeuronId}->${connection.targetNeuronId}`;
            const pulse = activePropagation.has(key);

            return (
              <line
                key={connection.id}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                className={`network-link ${pulse ? "network-link-pulse" : ""}`}
                strokeWidth={Math.max(2, Math.min(6, connection.weight))}
                markerEnd="url(#arrowhead)"
              />
            );
          })}

          {sorted.map((neuron) => {
            const point = byId.get(neuron.id)?.point;
            if (!point) {
              return null;
            }

            const state = electricalState(neuron);
            const selected = neuron.id === selectedNeuronId;

            return (
              <g key={neuron.id} className="network-node-group">
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={selected ? 24 : 22}
                  className={`network-node state-${state.toLowerCase()} ${selected ? "selected" : ""}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select ${neuron.id}`}
                  onClick={() => onSelectNeuron(neuron.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelectNeuron(neuron.id);
                    }
                  }}
                />
                <text x={point.x} y={point.y + 40} className="network-label">
                  {neuron.id.replace("NEURON-", "N-")}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
