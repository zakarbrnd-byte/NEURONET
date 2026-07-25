import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type {
  NeuronSnapshot,
  PropagationTrace,
  SynapseSnapshot,
} from "../../types/neural";
import { electricalState, shortNeuronId } from "../../types/neural";

interface NetworkViewProps {
  neurons: NeuronSnapshot[];
  synapses: SynapseSnapshot[];
  selectedNeuronId: string | null;
  selectedSynapseId?: string | null;
  activePropagations: PropagationTrace[];
  reducedMotion: boolean;
  interactionDisabled: boolean;
  pressingNeuronId: string | null;
  flashedNeuronId: string | null;
  /** Compact canvas mode for Mission Control (no card chrome). */
  compact?: boolean;
  onSelectNeuron: (neuronId: string) => void;
  onSelectSynapse?: (synapseId: string) => void;
  onLongPressStimulate: (neuronId: string) => void;
  onPressVisualChange: (neuronId: string | null) => void;
}

interface Point {
  x: number;
  y: number;
}

export const LONG_PRESS_MS = 500;
/** Movement tolerance in CSS pixels (client coordinates). */
export const MOVE_TOLERANCE_PX = 10;
/** Hit-target radius in SVG units → ≥44×44 CSS px at 1:1 viewBox scale. */
export const HIT_TARGET_RADIUS = 22;

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

interface GestureState {
  pointerId: number;
  neuronId: string;
  startX: number;
  startY: number;
  startTime: number;
  timerId: number | null;
  moved: boolean;
  canceled: boolean;
  longPressCompleted: boolean;
  consumed: boolean;
  stimulateRequested: boolean;
}

export function NetworkView({
  neurons,
  synapses,
  selectedNeuronId,
  selectedSynapseId = null,
  activePropagations,
  reducedMotion,
  interactionDisabled,
  pressingNeuronId,
  flashedNeuronId,
  compact = false,
  onSelectNeuron,
  onSelectSynapse,
  onLongPressStimulate,
  onPressVisualChange,
}: NetworkViewProps) {
  const width = 324;
  const height = 240;
  const positions = layoutFor(neurons, width, height);
  const gestureRef = useRef<GestureState | null>(null);
  /** Survives cleanup so a synthetic click after long-press is ignored. */
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
    const gesture = gestureRef.current;
    if (gesture?.timerId != null) {
      window.clearTimeout(gesture.timerId);
      gesture.timerId = null;
    }
  }

  function endPressVisual() {
    setLocalPressingId(null);
    onPressVisualChange(null);
  }

  /** Single cleanup path for ending a gesture (keeps suppress flag if consumed). */
  function cleanupGesture(options?: { keepSuppress?: boolean }) {
    clearLongPressTimer();
    const consumed = gestureRef.current?.consumed === true;
    gestureRef.current = null;
    endPressVisual();
    if (options?.keepSuppress || consumed) {
      suppressNextClickRef.current = true;
    }
  }

  useEffect(() => {
    return () => {
      clearLongPressTimer();
      gestureRef.current = null;
    };
  }, []);

  function onPointerDown(neuronId: string, event: ReactPointerEvent<SVGGElement>) {
    if (interactionDisabled) {
      return;
    }

    // Pointer down never selects, never opens inspector, never injects.
    event.preventDefault();
    event.stopPropagation();

    clearLongPressTimer();
    suppressNextClickRef.current = false;

    const target = event.currentTarget;
    target.setPointerCapture?.(event.pointerId);

    const gesture: GestureState = {
      pointerId: event.pointerId,
      neuronId,
      startX: event.clientX,
      startY: event.clientY,
      startTime: performance.now(),
      timerId: null,
      moved: false,
      canceled: false,
      longPressCompleted: false,
      consumed: false,
      stimulateRequested: false,
    };
    gestureRef.current = gesture;

    gesture.timerId = window.setTimeout(() => {
      const current = gestureRef.current;
      if (
        !current ||
        current.pointerId !== gesture.pointerId ||
        current.neuronId !== neuronId ||
        current.canceled ||
        current.moved ||
        current.stimulateRequested
      ) {
        return;
      }

      current.longPressCompleted = true;
      current.consumed = true;
      current.stimulateRequested = true;
      suppressNextClickRef.current = true;
      current.timerId = null;
      onLongPressStimulate(neuronId);
    }, LONG_PRESS_MS);

    setLocalPressingId(neuronId);
    onPressVisualChange(neuronId);
  }

  function onPointerMove(event: ReactPointerEvent<SVGGElement>) {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) {
      return;
    }
    if (gesture.canceled || gesture.consumed || gesture.moved) {
      return;
    }

    const dx = event.clientX - gesture.startX;
    const dy = event.clientY - gesture.startY;
    if (Math.hypot(dx, dy) > MOVE_TOLERANCE_PX) {
      gesture.moved = true;
      clearLongPressTimer();
      endPressVisual();
    }
  }

  function onPointerUp(event: ReactPointerEvent<SVGGElement>) {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const elapsed = performance.now() - gesture.startTime;
    const isShortTap =
      !gesture.longPressCompleted &&
      !gesture.consumed &&
      !gesture.canceled &&
      !gesture.moved &&
      elapsed < LONG_PRESS_MS;

    if (gesture.consumed || gesture.longPressCompleted) {
      // Long press already stimulated — release only cleans up.
      cleanupGesture({ keepSuppress: true });
      return;
    }

    const neuronId = gesture.neuronId;
    cleanupGesture();

    if (isShortTap) {
      onSelectNeuron(neuronId);
    }
  }

  function onPointerCancel(event: ReactPointerEvent<SVGGElement>) {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    gesture.canceled = true;
    cleanupGesture({ keepSuppress: gesture.consumed });
  }

  function onLostPointerCapture(event: ReactPointerEvent<SVGGElement>) {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) {
      return;
    }
    // Capture loss without a prior up/cancel — treat as cancel.
    gesture.canceled = true;
    cleanupGesture({ keepSuppress: gesture.consumed });
  }

  function onSyntheticClick(event: React.MouseEvent<SVGGElement>) {
    // Never use click for touch selection. Only suppress after a consumed long press.
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    event.preventDefault();
    event.stopPropagation();
  }

  return (
    <section
      className={compact ? "network-canvas" : "card"}
      aria-labelledby="network-heading"
    >
      {compact ? (
        <h2 id="network-heading" className="sr-only">
          Network View
        </h2>
      ) : (
        <>
          <h2 id="network-heading" className="card-title">
            Network View
          </h2>
          <p className="hint">
            Tap a neuron to inspect it. Long-press (~0.5s) for direct electrode-style +5 mV
            stimulation.
          </p>
        </>
      )}

      <div className="network-svg-wrap">
        <svg
          className="network-svg"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Backend neural network graph"
          preserveAspectRatio="xMidYMid meet"
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

          {synapses.map((synapse) => {
            const source = positions.get(synapse.sourceNeuronId);
            const target = positions.get(synapse.targetNeuronId);
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
            const key = `${synapse.sourceNeuronId}->${synapse.targetNeuronId}`;
            const pulse = pulseByEdge.get(key);
            const selected = selectedSynapseId === synapse.id;
            const strengthClass =
              synapse.lastWeightDelta > 0
                ? "synapse-strengthening"
                : synapse.lastWeightDelta < 0
                  ? "synapse-weakening"
                  : "";
            const strokeWidth = Math.max(1.5, Math.min(6, synapse.weight / 4));
            const inhibitory = synapse.type === "inhibitory";

            return (
              <g
                key={synapse.id}
                className={`network-synapse ${selected ? "is-selected" : ""} ${strengthClass}`}
                data-testid={`network-synapse-${synapse.id}`}
              >
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  className="network-link-hit"
                  strokeWidth={Math.max(14, strokeWidth + 10)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Inspect synapse ${synapse.id}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectSynapse?.(synapse.id);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelectSynapse?.(synapse.id);
                    }
                  }}
                />
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  className={`network-link ${inhibitory ? "is-inhibitory" : ""} ${
                    pulse ? "network-link-pulse" : ""
                  }`}
                  strokeWidth={strokeWidth}
                  markerEnd="url(#arrowhead)"
                  strokeDasharray={pulse && reducedMotion ? "4 3" : undefined}
                  pointerEvents="none"
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
                    <text x={midX} y={midY - 8} className="network-pulse-label" pointerEvents="none">
                      {pulse.amountMv >= 0 ? "+" : ""}
                      {pulse.amountMv} mV
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
            const nodeRadius = pressing ? 26 : selected ? 24 : 22;

            return (
              <g
                key={neuron.id}
                className={`neuron-hit-target network-node-group ${selected ? "is-selected" : ""} ${pressing ? "is-pressing" : ""} ${flashed ? "is-flashed" : ""}`}
                role="button"
                tabIndex={0}
                aria-label={`Select ${neuron.id}, ${state}, ${neuron.membranePotentialMv.toFixed(0)} mV. Long press to stimulate +5 mV.`}
                onPointerDown={(event) => onPointerDown(neuron.id, event)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerCancel}
                onLostPointerCapture={onLostPointerCapture}
                onClick={onSyntheticClick}
                onContextMenu={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    event.stopPropagation();
                    // Keyboard selects only — never stimulates.
                    onSelectNeuron(neuron.id);
                  }
                }}
              >
                {/* Invisible ≥44×44 hit target; receives all pointer events. */}
                <circle
                  className="network-hit-area"
                  cx={point.x}
                  cy={point.y}
                  r={HIT_TARGET_RADIUS}
                />
                {pressing ? (
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={30}
                    className="network-hold-ring"
                    pointerEvents="none"
                    style={{
                      animationDuration: reducedMotion ? "0ms" : `${LONG_PRESS_MS}ms`,
                    }}
                  />
                ) : null}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={nodeRadius}
                  className={`network-node state-${state.toLowerCase()} ${selected ? "selected" : ""} ${pressing ? "pressing" : ""} ${flashed ? "flashed" : ""}`}
                  pointerEvents="none"
                />
                <text
                  x={point.x}
                  y={point.y - 2}
                  className="network-node-id"
                  pointerEvents="none"
                >
                  {shortNeuronId(neuron.id)}
                </text>
                <text
                  x={point.x}
                  y={point.y + 11}
                  className="network-node-mv"
                  pointerEvents="none"
                >
                  {neuron.membranePotentialMv.toFixed(0)}
                </text>
                <text
                  x={point.x + 18}
                  y={point.y - 14}
                  className="network-state-mark"
                  pointerEvents="none"
                >
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
