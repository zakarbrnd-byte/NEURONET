import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
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
  flashedNeuronId: string | null;
  onSelectNeuron: (neuronId: string) => void;
  onLongPressStimulate: (neuronId: string) => void;
  onPressVisualChange: (neuronId: string | null) => void;
}

interface Point {
  x: number;
  y: number;
}

export const LONG_PRESS_MS = 500;
export const MOVE_TOLERANCE_PX = 12;

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
  /** True once the long-press timer fired; suppresses tap/selection. */
  consumedByLongPress: boolean;
  /** True when movement/leave/cancel invalidated the press. */
  cancelled: boolean;
  /** Guards against duplicate stimulate calls for one press. */
  stimulateRequested: boolean;
}

export function NetworkView({
  neurons,
  connections,
  selectedNeuronId,
  activePropagations,
  reducedMotion,
  interactionDisabled,
  pressingNeuronId,
  flashedNeuronId,
  onSelectNeuron,
  onLongPressStimulate,
  onPressVisualChange,
}: NetworkViewProps) {
  const width = 324;
  const height = 240;
  const positions = layoutFor(neurons, width, height);
  const pressRef = useRef<PressSession | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  /** Survives session cleanup so the synthetic click after pointerup is suppressed. */
  const suppressNextClickRef = useRef(false);
  const [localPressingId, setLocalPressingId] = useState<string | null>(null);

  const activePressId = pressingNeuronId ?? localPressingId;

  const pulseByEdge = new Map(
    activePropagations.map((propagation) => [
      `${propagation.sourceNeuronId}->${propagation.targetNeuronId}`,
      propagation,
    ]),
  );

  function clearLongPressTimer() {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  function endPressVisual() {
    setLocalPressingId(null);
    onPressVisualChange(null);
  }

  function resetPressSession() {
    clearLongPressTimer();
    pressRef.current = null;
    endPressVisual();
  }

  useEffect(() => {
    return () => {
      clearLongPressTimer();
      pressRef.current = null;
    };
  }, []);

  function beginPress(neuronId: string, event: ReactPointerEvent<SVGCircleElement>) {
    if (interactionDisabled) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    clearLongPressTimer();
    suppressNextClickRef.current = false;
    event.currentTarget.setPointerCapture?.(event.pointerId);

    pressRef.current = {
      neuronId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      consumedByLongPress: false,
      cancelled: false,
      stimulateRequested: false,
    };

    longPressTimerRef.current = window.setTimeout(() => {
      const session = pressRef.current;
      if (
        !session ||
        session.cancelled ||
        session.neuronId !== neuronId ||
        session.stimulateRequested
      ) {
        return;
      }

      // Mark consumed before stimulating so any later pointer/click path cannot select.
      session.consumedByLongPress = true;
      session.stimulateRequested = true;
      suppressNextClickRef.current = true;
      onLongPressStimulate(neuronId);
    }, LONG_PRESS_MS);

    setLocalPressingId(neuronId);
    onPressVisualChange(neuronId);
  }

  function movePress(event: ReactPointerEvent<SVGCircleElement>) {
    const session = pressRef.current;
    if (!session || session.pointerId !== event.pointerId || session.cancelled) {
      return;
    }

    // Once long-press has already stimulated, ignore later movement.
    if (session.consumedByLongPress) {
      return;
    }

    const dx = event.clientX - session.startX;
    const dy = event.clientY - session.startY;
    if (Math.hypot(dx, dy) > MOVE_TOLERANCE_PX) {
      session.cancelled = true;
      clearLongPressTimer();
      endPressVisual();
    }
  }

  function finishPress(event: ReactPointerEvent<SVGCircleElement>) {
    const session = pressRef.current;
    if (!session || session.pointerId !== event.pointerId) {
      return;
    }

    const { consumedByLongPress, cancelled, neuronId } = session;
    clearLongPressTimer();
    pressRef.current = null;
    endPressVisual();

    // Long press already handled stimulation — never select/open inspector.
    if (consumedByLongPress) {
      suppressNextClickRef.current = true;
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    // Movement / leave cancel: not a tap (does not satisfy normal tap conditions).
    if (cancelled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    // Short press without cancel = normal tap.
    onSelectNeuron(neuronId);
  }

  function cancelPress(event: ReactPointerEvent<SVGCircleElement>) {
    const session = pressRef.current;
    if (!session || session.pointerId !== event.pointerId) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    // Pointer cancel always clears the pending timer and drops the interaction.
    session.cancelled = true;
    if (session.consumedByLongPress) {
      suppressNextClickRef.current = true;
    }
    resetPressSession();
  }

  function leavePress(event: ReactPointerEvent<SVGCircleElement>) {
    const session = pressRef.current;
    if (!session || session.pointerId !== event.pointerId) {
      return;
    }
    // With capture, leave can still fire; cancel pending long press before it completes.
    if (!session.consumedByLongPress) {
      session.cancelled = true;
      clearLongPressTimer();
      endPressVisual();
    }
  }

  function handleClick(event: React.MouseEvent<SVGCircleElement>, neuronId: string) {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    const session = pressRef.current;
    if (session?.consumedByLongPress) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    // Fallback for environments that deliver click without a prior pointerup selection.
    // Only select when there is no active cancelled/consumed press for this neuron.
    if (session && session.neuronId === neuronId && session.cancelled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
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
            const flashed = neuron.id === flashedNeuronId;

            return (
              <g key={neuron.id} className="network-node-group">
                {pressing ? (
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={30}
                    className="network-hold-ring"
                    style={{
                      animationDuration: reducedMotion ? "0ms" : `${LONG_PRESS_MS}ms`,
                    }}
                  />
                ) : null}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={pressing ? 26 : selected ? 24 : 22}
                  className={`network-node state-${state.toLowerCase()} ${selected ? "selected" : ""} ${pressing ? "pressing" : ""} ${flashed ? "flashed" : ""}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select ${neuron.id}, ${state}, ${neuron.membranePotentialMv.toFixed(0)} mV. Long press to stimulate +5 mV.`}
                  style={{ touchAction: "none" }}
                  onPointerDown={(event) => beginPress(neuron.id, event)}
                  onPointerMove={movePress}
                  onPointerUp={finishPress}
                  onPointerCancel={cancelPress}
                  onPointerLeave={leavePress}
                  onClick={(event) => handleClick(event, neuron.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      event.stopPropagation();
                      // Keyboard selects only — never stimulates.
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
