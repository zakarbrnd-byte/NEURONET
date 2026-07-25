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
import {
  HIT_TARGET_RADIUS,
  LONG_PRESS_MS,
  MOVE_TOLERANCE_PX,
} from "../network/NetworkView";

interface TissueViewProps {
  neurons: NeuronSnapshot[];
  synapses: SynapseSnapshot[];
  selectedNeuronId: string | null;
  selectedSynapseId?: string | null;
  activePropagations: PropagationTrace[];
  reducedMotion: boolean;
  interactionDisabled: boolean;
  pressingNeuronId: string | null;
  flashedNeuronId: string | null;
  onSelectNeuron: (neuronId: string) => void;
  onSelectSynapse?: (synapseId: string) => void;
  onLongPressStimulate: (neuronId: string) => void;
  onPressVisualChange: (neuronId: string | null) => void;
}

interface Point {
  x: number;
  y: number;
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

const WIDTH = 100;
const HEIGHT = 100;

function toPoint(neuron: NeuronSnapshot): Point {
  return {
    x: neuron.position.x * WIDTH,
    y: neuron.position.y * HEIGHT,
  };
}

function axonPath(from: Point, to: Point, fromRadius: number, toRadius: number): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const start = {
    x: from.x + ux * (fromRadius + 0.4),
    y: from.y + uy * (fromRadius + 0.4),
  };
  const end = {
    x: to.x - ux * (toRadius + 1.2),
    y: to.y - uy * (toRadius + 1.2),
  };
  const mx = (start.x + end.x) / 2;
  const my = (start.y + end.y) / 2;
  const cx = mx - uy * len * 0.12;
  const cy = my + ux * len * 0.12;
  return `M ${start.x} ${start.y} Q ${cx} ${cy} ${end.x} ${end.y}`;
}

export function TissueView({
  neurons,
  synapses,
  selectedNeuronId,
  selectedSynapseId = null,
  activePropagations,
  reducedMotion,
  interactionDisabled,
  pressingNeuronId,
  flashedNeuronId,
  onSelectNeuron,
  onSelectSynapse,
  onLongPressStimulate,
  onPressVisualChange,
}: TissueViewProps) {
  const positions = new Map(neurons.map((neuron) => [neuron.id, toPoint(neuron)]));
  const byId = new Map(neurons.map((neuron) => [neuron.id, neuron]));
  const gestureRef = useRef<GestureState | null>(null);
  const suppressNextClickRef = useRef(false);
  const [localPressingId, setLocalPressingId] = useState<string | null>(null);
  const activePressId = pressingNeuronId ?? localPressingId;

  const pulseByEdge = new Map(
    activePropagations.map((propagation) => [
      `${propagation.sourceNeuronId}->${propagation.targetNeuronId}`,
      propagation,
    ]),
  );

  useEffect(() => {
    return () => {
      const gesture = gestureRef.current;
      if (gesture?.timerId != null) {
        window.clearTimeout(gesture.timerId);
      }
    };
  }, []);

  const clearGestureTimer = () => {
    const gesture = gestureRef.current;
    if (gesture?.timerId != null) {
      window.clearTimeout(gesture.timerId);
      gesture.timerId = null;
    }
  };

  const endPressVisual = () => {
    setLocalPressingId(null);
    onPressVisualChange(null);
  };

  const onPointerDown = (event: ReactPointerEvent<SVGGElement>, neuronId: string) => {
    if (interactionDisabled || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    clearGestureTimer();
    const timerId = window.setTimeout(() => {
      const gesture = gestureRef.current;
      if (!gesture || gesture.neuronId !== neuronId || gesture.moved || gesture.canceled) {
        return;
      }
      gesture.longPressCompleted = true;
      gesture.consumed = true;
      gesture.stimulateRequested = true;
      suppressNextClickRef.current = true;
      onLongPressStimulate(neuronId);
    }, LONG_PRESS_MS);

    gestureRef.current = {
      pointerId: event.pointerId,
      neuronId,
      startX: event.clientX,
      startY: event.clientY,
      startTime: performance.now(),
      timerId,
      moved: false,
      canceled: false,
      longPressCompleted: false,
      consumed: false,
      stimulateRequested: false,
    };
    setLocalPressingId(neuronId);
    onPressVisualChange(neuronId);
  };

  const onPointerMove = (event: ReactPointerEvent<SVGGElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId || gesture.canceled) return;
    const dx = event.clientX - gesture.startX;
    const dy = event.clientY - gesture.startY;
    if (Math.hypot(dx, dy) > MOVE_TOLERANCE_PX) {
      gesture.moved = true;
      gesture.canceled = true;
      clearGestureTimer();
      endPressVisual();
    }
  };

  const finishPointer = (event: ReactPointerEvent<SVGGElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    clearGestureTimer();
    endPressVisual();

    const elapsed = performance.now() - gesture.startTime;
    const isTap =
      !gesture.moved &&
      !gesture.canceled &&
      !gesture.longPressCompleted &&
      !gesture.stimulateRequested &&
      elapsed < LONG_PRESS_MS;

    if (isTap) {
      onSelectNeuron(gesture.neuronId);
    }

    if (gesture.stimulateRequested || gesture.longPressCompleted) {
      suppressNextClickRef.current = true;
    }

    gestureRef.current = null;
  };

  const onClickCapture = (event: React.MouseEvent) => {
    if (suppressNextClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
      suppressNextClickRef.current = false;
    }
  };

  return (
    <div
      className="tissue-view"
      data-testid="tissue-view"
      onClickCapture={onClickCapture}
    >
      <p className="tissue-hint">
        Fixed cell positions from the backend · Tap: Inspect · Hold: Stimulate +5 mV
      </p>
      <svg
        className="tissue-canvas"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Artificial neural tissue"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <marker
            id="tissue-arrowhead"
            markerWidth="4"
            markerHeight="4"
            refX="3.2"
            refY="2"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path d="M0,0 L4,2 L0,4 Z" className="tissue-marker-excitatory" />
          </marker>
          <marker
            id="tissue-barhead"
            markerWidth="3"
            markerHeight="6"
            refX="1.5"
            refY="3"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path d="M1,0 L1,6" className="tissue-marker-inhibitory" />
          </marker>
        </defs>

        {synapses.map((synapse) => {
          const source = byId.get(synapse.sourceNeuronId);
          const target = byId.get(synapse.targetNeuronId);
          const from = positions.get(synapse.sourceNeuronId);
          const to = positions.get(synapse.targetNeuronId);
          if (!source || !target || !from || !to) return null;

          const inhibitory = synapse.type === "inhibitory";
          const edgeKey = `${synapse.sourceNeuronId}->${synapse.targetNeuronId}`;
          const pulse = pulseByEdge.get(edgeKey);
          const d = axonPath(
            from,
            to,
            source.somaRadius * WIDTH,
            target.somaRadius * WIDTH,
          );
          const selected = selectedSynapseId === synapse.id;
          const strengthClass =
            synapse.lastWeightDelta > 0
              ? "synapse-strengthening"
              : synapse.lastWeightDelta < 0
                ? "synapse-weakening"
                : "";
          const strokeWidth = Math.max(0.45, Math.min(1.8, synapse.weight / 14));

          return (
            <g
              key={synapse.id}
              className={`tissue-axon-group ${selected ? "is-selected" : ""} ${strengthClass}`}
              data-testid={`tissue-synapse-${synapse.id}`}
            >
              <path
                d={d}
                className="tissue-axon-hit"
                strokeWidth={Math.max(3.5, strokeWidth + 2.5)}
                fill="none"
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
              <path
                d={d}
                className={`tissue-axon ${inhibitory ? "is-inhibitory" : "is-excitatory"} ${
                  pulse ? "is-pulse" : ""
                }`}
                strokeWidth={strokeWidth}
                markerEnd={inhibitory ? "url(#tissue-barhead)" : "url(#tissue-arrowhead)"}
                fill="none"
                pointerEvents="none"
              />
              {pulse && !reducedMotion ? (
                <circle r="1.2" className="tissue-pulse-dot">
                  <animateMotion dur="0.7s" repeatCount="1" path={d} />
                </circle>
              ) : null}
              {pulse ? (
                <text
                  x={(from.x + to.x) / 2}
                  y={(from.y + to.y) / 2 - 2}
                  className="tissue-pulse-label"
                  pointerEvents="none"
                >
                  {pulse.amountMv >= 0 ? "+" : ""}
                  {pulse.amountMv} mV
                </text>
              ) : null}
            </g>
          );
        })}

        {neurons.map((neuron) => {
          const point = positions.get(neuron.id)!;
          const soma = neuron.somaRadius * WIDTH;
          const dendrite = neuron.dendriteRadius * WIDTH;
          const selected = selectedNeuronId === neuron.id;
          const pressing = activePressId === neuron.id;
          const flashed = flashedNeuronId === neuron.id;
          const state = electricalState(neuron);
          const inhibitory = neuron.cellType === "inhibitory";

          return (
            <g
              key={neuron.id}
              className={`tissue-cell ${inhibitory ? "is-inhibitory" : "is-excitatory"} ${
                selected ? "is-selected" : ""
              } ${pressing ? "is-pressing" : ""} ${flashed ? "is-flashed" : ""} state-${state.toLowerCase()}`}
              data-testid={`tissue-cell-${neuron.id}`}
              data-cell-type={neuron.cellType}
              transform={`translate(${point.x} ${point.y})`}
              onPointerDown={(event) => onPointerDown(event, neuron.id)}
              onPointerMove={onPointerMove}
              onPointerUp={finishPointer}
              onPointerCancel={finishPointer}
              style={{ touchAction: "none" }}
            >
              <circle
                r={Math.max(HIT_TARGET_RADIUS * (WIDTH / 324), dendrite + 1)}
                className="tissue-hit"
                fill="transparent"
              />
              <circle r={dendrite} className="tissue-dendrite" pointerEvents="none" />
              <circle r={soma} className="tissue-soma" pointerEvents="none" />
              <text y={soma + 3.5} className="tissue-label" pointerEvents="none">
                {shortNeuronId(neuron.id)}
              </text>
              <text y={soma + 6.2} className="tissue-sublabel" pointerEvents="none">
                {inhibitory ? "Inh" : "Exc"} · {neuron.membranePotentialMv.toFixed(0)} mV
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
