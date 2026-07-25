import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type {
  ConnectionSnapshot,
  NeuronSnapshot,
  PropagationTrace,
} from "../../types/neural";
import { electricalState, shortNeuronId } from "../../types/neural";

interface NetworkViewProps {
  neurons: NeuronSnapshot[];
  connections: ConnectionSnapshot[];
  selectedNeuronId: string | null;
  activePropagations: PropagationTrace[];
  reducedMotion: boolean;
  interactionDisabled: boolean;
  pressingNeuronId: string | null;
  onSelectNeuron: (neuronId: string) => void;
  onLongPressStimulate: (neuronId: string) => void;
  onPressVisualChange: (neuronId: string | null) => void;
}

interface Point {
  x: number;
  y: number;
}

const LONG_PRESS_MS = 500;
const MOVE_TOLERANCE_PX = 12;

const CANONICAL_LAYOUT: Record<string, Point> = {
  "NEURON-001": { x: 36, y: 120 },
  "NEURON-002": { x: 120, y: 120 },
  "NEURON-003": { x: 204, y: 48 },
  "NEURON-004": { x: 204, y: 192 },
  "NEURON-005": { x: 288, y: 120 },
};

function layoutFor(neurons: NeuronSnapshot[], width: number, height: number): Map<string, Point> {
  const map = new Map<string, Point>();
  const known = neurons.filter((neuron) => CANONICAL_LAYOUT[neuron.id]);
  const unknown = neurons.filter((neuron) => !CANONICAL_LAYOUT[neuron.id]);

  for (const neuron of known) {
    map.set(neuron.id, CANONICAL_LAYOUT[neuron.id]);
  }

  unknown.forEach((neuron, index) => {
    const t = unknown.length === 1 ? 0.5 : index / (unknown.length - 1);
    map.set(neuron.id, {
      x: 40 + t * (width - 80),
      y: height - 28,
    });
  });

  return map;
}

function stateLabel(state: ReturnType<typeof electricalState>): string {
  if (state === "Fired") return "★";
  if (state === "Refractory") return "R";
  if (state === "Depolarized") return "↑";
  return "•";
}

interface PressSession {
  neuronId: string;
  pointerId: number;
  startX: number;
  startY: number;
  timer: number;
  stimulated: boolean;
  cancelled: boolean;
}

export function NetworkView({
  neurons,
  connections,
  selectedNeuronId,
  activePropagations,
  reducedMotion,
  interactionDisabled,
  pressingNeuronId,
  onSelectNeuron,
  onLongPressStimulate,
  onPressVisualChange,
}: NetworkViewProps) {
  const width = 324;
  const height = 240;
  const positions = layoutFor(neurons, width, height);
  const pressRef = useRef<PressSession | null>(null);
  const [localPressingId, setLocalPressingId] = useState<string | null>(null);

  const activePressId = pressingNeuronId ?? localPressingId;

  const pulseByEdge = new Map(
    activePropagations.map((propagation) => [
      `${propagation.sourceNeuronId}->${propagation.targetNeuronId}`,
      propagation,
    ]),
  );

  function clearPressTimer() {
    const session = pressRef.current;
    if (session) {
      window.clearTimeout(session.timer);
    }
  }

  function endPressVisual() {
    setLocalPressingId(null);
    onPressVisualChange(null);
  }

  function beginPress(neuronId: string, event: ReactPointerEvent<SVGCircleElement>) {
    if (interactionDisabled) {
      return;
    }

    clearPressTimer();
    event.currentTarget.setPointerCapture?.(event.pointerId);

    const timer = window.setTimeout(() => {
      const session = pressRef.current;
      if (!session || session.cancelled || session.neuronId !== neuronId) {
        return;
      }
      session.stimulated = true;
      onLongPressStimulate(neuronId);
    }, LONG_PRESS_MS);

    pressRef.current = {
      neuronId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      timer,
      stimulated: false,
      cancelled: false,
    };

    setLocalPressingId(neuronId);
    onPressVisualChange(neuronId);
  }

  function movePress(event: ReactPointerEvent<SVGCircleElement>) {
    const session = pressRef.current;
    if (!session || session.pointerId !== event.pointerId || session.cancelled) {
      return;
    }

    const dx = event.clientX - session.startX;
    const dy = event.clientY - session.startY;
    if (Math.hypot(dx, dy) > MOVE_TOLERANCE_PX) {
      session.cancelled = true;
      clearPressTimer();
      endPressVisual();
    }
  }

  function finishPress(event: ReactPointerEvent<SVGCircleElement>) {
    const session = pressRef.current;
    if (!session || session.pointerId !== event.pointerId) {
      return;
    }

    clearPressTimer();
    pressRef.current = null;
    endPressVisual();

    // Normal tap: select only. Never inject on tap.
    if (!session.stimulated && !session.cancelled) {
      onSelectNeuron(session.neuronId);
    }
  }

  function cancelPress(event: ReactPointerEvent<SVGCircleElement>) {
    const session = pressRef.current;
    if (!session || session.pointerId !== event.pointerId) {
      return;
    }
    session.cancelled = true;
    clearPressTimer();
    pressRef.current = null;
    endPressVisual();
  }

  return (
    <section className="card" aria-labelledby="network-heading">
      <h2 id="network-heading" className="card-title">
        Network View
      </h2>
      <p className="hint">
        Tap a neuron to inspect it. Long-press (~0.5s) for direct electrode-style +5 mV stimulation.
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
            const source = positions.get(connection.sourceNeuronId);
            const target = positions.get(connection.targetNeuronId);
            if (!source || !target) {
              return null;
            }

            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const length = Math.hypot(dx, dy) || 1;
            const inset = 26;
            const x1 = source.x + (dx / length) * inset;
            const y1 = source.y + (dy / length) * inset;
            const x2 = target.x - (dx / length) * inset;
            const y2 = target.y - (dy / length) * inset;
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            const key = `${connection.sourceNeuronId}->${connection.targetNeuronId}`;
            const pulse = pulseByEdge.get(key);

            return (
              <g key={connection.id}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  className={`network-link ${pulse ? "network-link-pulse" : ""}`}
                  strokeWidth={Math.max(2, Math.min(5, connection.weight / 4))}
                  markerEnd="url(#arrowhead)"
                  strokeDasharray={pulse && reducedMotion ? "4 3" : undefined}
                />
                {pulse ? (
                  <>
                    {!reducedMotion ? (
                      <circle r="5" className="network-pulse-dot">
                        <animateMotion
                          dur="0.7s"
                          repeatCount="1"
                          path={`M ${x1} ${y1} L ${x2} ${y2}`}
                        />
                      </circle>
                    ) : null}
                    <text x={midX} y={midY - 8} className="network-pulse-label">
                      +{pulse.amountMv} mV
                    </text>
                  </>
                ) : null}
              </g>
            );
          })}

          {neurons.map((neuron) => {
            const point = positions.get(neuron.id);
            if (!point) {
              return null;
            }

            const state = electricalState(neuron);
            const selected = neuron.id === selectedNeuronId;
            const pressing = neuron.id === activePressId;

            return (
              <g key={neuron.id} className="network-node-group">
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={pressing ? 26 : selected ? 24 : 22}
                  className={`network-node state-${state.toLowerCase()} ${selected ? "selected" : ""} ${pressing ? "pressing" : ""}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select ${neuron.id}, ${state}, ${neuron.membranePotentialMv.toFixed(0)} mV. Long press to stimulate +5 mV.`}
                  style={{ touchAction: "none" }}
                  onPointerDown={(event) => beginPress(neuron.id, event)}
                  onPointerMove={movePress}
                  onPointerUp={finishPress}
                  onPointerCancel={cancelPress}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelectNeuron(neuron.id);
                    }
                  }}
                />
                <text x={point.x} y={point.y - 2} className="network-node-id">
                  {shortNeuronId(neuron.id)}
                </text>
                <text x={point.x} y={point.y + 11} className="network-node-mv">
                  {neuron.membranePotentialMv.toFixed(0)}
                </text>
                <text x={point.x + 18} y={point.y - 14} className="network-state-mark">
                  {stateLabel(state)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
