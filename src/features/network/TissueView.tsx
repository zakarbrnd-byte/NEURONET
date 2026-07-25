import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type {
  DevelopmentSummary,
  GrowthCandidate,
  LifecycleState,
  NeuronSnapshot,
  PropagationTrace,
  SynapseSnapshot,
  TopologySummary,
} from "../../types/neural";
import { electricalState, neuronIsDeveloping, shortNeuronId } from "../../types/neural";
import type { TissueDisplayMode } from "../../types/ui";
import {
  HIT_TARGET_RADIUS,
  LONG_PRESS_MS,
  MOVE_TOLERANCE_PX,
} from "../network/NetworkView";

interface TissueViewProps {
  neurons: NeuronSnapshot[];
  synapses: SynapseSnapshot[];
  growthCandidates?: GrowthCandidate[];
  selectedNeuronId: string | null;
  selectedSynapseId?: string | null;
  selectedCandidateId?: string | null;
  displayMode: TissueDisplayMode;
  onDisplayModeChange: (mode: TissueDisplayMode) => void;
  activePropagations: PropagationTrace[];
  reducedMotion: boolean;
  interactionDisabled: boolean;
  pressingNeuronId: string | null;
  flashedNeuronId: string | null;
  bornSynapseIds?: string[];
  pruningSynapseIds?: string[];
  topology?: TopologySummary | null;
  development?: DevelopmentSummary | null;
  onSelectNeuron: (neuronId: string) => void;
  onSelectSynapse?: (synapseId: string) => void;
  onSelectCandidate?: (candidateId: string) => void;
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

const DISPLAY_MODES: Array<{ id: TissueDisplayMode; label: string }> = [
  { id: "activity", label: "Activity" },
  { id: "structure", label: "Structure" },
  { id: "development", label: "Development" },
];

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

function migrationPathD(waypoints: Array<{ x: number; y: number }>): string {
  if (waypoints.length === 0) return "";
  return waypoints
    .map((wp, index) => {
      const x = wp.x * WIDTH;
      const y = wp.y * HEIGHT;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function lifecycleClass(lifecycle: LifecycleState): string {
  return `lifecycle-${lifecycle}`;
}

export function TissueView({
  neurons,
  synapses,
  growthCandidates = [],
  selectedNeuronId,
  selectedSynapseId = null,
  selectedCandidateId = null,
  displayMode,
  onDisplayModeChange,
  activePropagations,
  reducedMotion,
  interactionDisabled,
  pressingNeuronId,
  flashedNeuronId,
  bornSynapseIds = [],
  pruningSynapseIds = [],
  topology = null,
  development = null,
  onSelectNeuron,
  onSelectSynapse,
  onSelectCandidate,
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
    event.currentTarget.setPointerCapture?.(event.pointerId);

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

  const showPulse = displayMode === "activity";
  const emphasizeMorphology = displayMode === "structure" || displayMode === "development";
  const showDevelopment = displayMode === "development";
  const showDevViz = showDevelopment && development != null;
  const progenitorZone = development?.progenitorZone ?? null;

  return (
    <div
      className={`tissue-view mode-${displayMode}`}
      data-testid="tissue-view"
      data-display-mode={displayMode}
      data-has-development={showDevViz ? "true" : "false"}
      onClickCapture={onClickCapture}
    >
      <div
        className="segmented tissue-display-modes"
        role="tablist"
        aria-label="Tissue display mode"
        data-testid="tissue-display-mode"
      >
        {DISPLAY_MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            role="tab"
            aria-selected={displayMode === mode.id}
            className={`segmented-item ${displayMode === mode.id ? "is-active" : ""}`}
            onClick={() => onDisplayModeChange(mode.id)}
            data-testid={`tissue-mode-${mode.id}`}
          >
            {mode.label}
          </button>
        ))}
      </div>
      <p className="tissue-hint">
        Backend cell positions · Tap: Inspect · Hold: Stimulate +5 mV (settled)
        {showDevelopment
          ? " · Dashed paths are growth candidates · Migration paths from backend"
          : ""}
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
          <pattern
            id="pruning-warning-pattern"
            width="2"
            height="2"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width="1" height="2" fill="currentColor" opacity="0.85" />
          </pattern>
        </defs>

        {showDevViz && progenitorZone ? (
          <g
            className="tissue-progenitor-zone"
            data-testid="tissue-progenitor-zone"
            pointerEvents="none"
          >
            <rect
              x={progenitorZone.xMin * WIDTH}
              y={progenitorZone.yMin * HEIGHT}
              width={(progenitorZone.xMax - progenitorZone.xMin) * WIDTH}
              height={(progenitorZone.yMax - progenitorZone.yMin) * HEIGHT}
              className="tissue-progenitor-zone-rect"
            />
            <text
              x={((progenitorZone.xMin + progenitorZone.xMax) / 2) * WIDTH}
              y={progenitorZone.yMin * HEIGHT + 3.2}
              className="tissue-progenitor-zone-label"
              textAnchor="middle"
            >
              Simplified Progenitor Zone
            </text>
          </g>
        ) : null}

        {showDevViz
          ? neurons
              .filter(
                (neuron) =>
                  neuron.lifecycle === "migrating" &&
                  neuron.migrationPath &&
                  neuron.migrationPath.waypoints.length > 0,
              )
              .map((neuron) => {
                const path = neuron.migrationPath!;
                const d = migrationPathD(path.waypoints);
                const target = neuron.targetPosition;
                return (
                  <g
                    key={`mig-${neuron.id}`}
                    className="tissue-migration-group"
                    data-testid={`tissue-migration-path-${neuron.id}`}
                    pointerEvents="none"
                  >
                    <path d={d} className="tissue-migration-path" fill="none" />
                    {target ? (
                      <circle
                        cx={target.x * WIDTH}
                        cy={target.y * HEIGHT}
                        r={1.1}
                        className="tissue-migration-target"
                        data-testid={`tissue-migration-target-${neuron.id}`}
                      />
                    ) : null}
                    <text
                      x={neuron.position.x * WIDTH}
                      y={neuron.position.y * HEIGHT - (neuron.somaRadius * WIDTH + 4)}
                      className="tissue-migration-progress-label"
                      textAnchor="middle"
                      data-testid={`tissue-migration-progress-${neuron.id}`}
                    >
                      {Math.round(neuron.migrationProgress * 100)}%
                    </text>
                  </g>
                );
              })
          : null}

        {synapses.map((synapse) => {
          const source = byId.get(synapse.sourceNeuronId);
          const target = byId.get(synapse.targetNeuronId);
          const from = positions.get(synapse.sourceNeuronId);
          const to = positions.get(synapse.targetNeuronId);
          if (!source || !target || !from || !to) return null;

          const inhibitory = synapse.type === "inhibitory";
          const edgeKey = `${synapse.sourceNeuronId}->${synapse.targetNeuronId}`;
          const pulse = showPulse ? pulseByEdge.get(edgeKey) : undefined;
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
          const strokeWidth = Math.max(
            0.45,
            Math.min(1.8, synapse.weight / 14) * (emphasizeMorphology ? 1.15 : 1),
          );
          const atRisk =
            showDevelopment &&
            (synapse.pruningStatus === "atRisk" || synapse.pruningRisk >= 0.55);
          const monitoring =
            showDevelopment && synapse.pruningStatus === "monitoring" && !atRisk;
          const justBorn = bornSynapseIds.includes(synapse.id);
          const pruningOut = pruningSynapseIds.includes(synapse.id);
          const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };

          return (
            <g
              key={synapse.id}
              className={`tissue-axon-group ${selected ? "is-selected" : ""} ${strengthClass} ${
                atRisk ? "is-pruning-risk" : ""
              } ${monitoring ? "is-pruning-monitor" : ""} ${
                justBorn && !reducedMotion ? "is-synapse-born" : ""
              } ${pruningOut && !reducedMotion ? "is-synapse-pruning" : ""}`}
              data-testid={`tissue-synapse-${synapse.id}`}
              data-pruning-status={synapse.pruningStatus}
              data-born={justBorn ? "true" : "false"}
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
              {atRisk ? (
                <>
                  <path
                    d={d}
                    className="tissue-axon-risk-overlay"
                    strokeWidth={strokeWidth + 1.1}
                    fill="none"
                    strokeDasharray="1.2 1.2"
                    pointerEvents="none"
                    data-testid={`pruning-risk-marker-${synapse.id}`}
                  />
                  <g
                    className="pruning-risk-badge"
                    transform={`translate(${mid.x} ${mid.y - 2.2})`}
                    pointerEvents="none"
                    data-testid={`pruning-risk-badge-${synapse.id}`}
                  >
                    <rect x="-2.2" y="-2.2" width="4.4" height="4.4" rx="0.6" />
                    <text y="1.1" textAnchor="middle">
                      !
                    </text>
                  </g>
                </>
              ) : null}
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

        {showDevelopment
          ? growthCandidates.map((candidate) => {
              const source = byId.get(candidate.sourceNeuronId);
              const target = byId.get(candidate.targetNeuronId);
              const from = positions.get(candidate.sourceNeuronId);
              const to = positions.get(candidate.targetNeuronId);
              if (!source || !target || !from || !to) return null;
              const d = axonPath(
                from,
                to,
                source.somaRadius * WIDTH,
                target.somaRadius * WIDTH,
              );
              const selected = selectedCandidateId === candidate.id;
              const opacity = 0.25 + candidate.readiness * 0.7;
              const strokeWidth = 0.35 + candidate.readiness * 1.2;
              const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };

              return (
                <g
                  key={candidate.id}
                  className={`tissue-candidate-group ${selected ? "is-selected" : ""}`}
                  data-testid={`tissue-candidate-${candidate.id}`}
                  data-candidate="true"
                >
                  <path
                    d={d}
                    className="tissue-candidate-hit"
                    strokeWidth={Math.max(3.5, strokeWidth + 2.2)}
                    fill="none"
                    role="button"
                    tabIndex={0}
                    aria-label={`Inspect growth candidate ${candidate.id}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectCandidate?.(candidate.id);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onSelectCandidate?.(candidate.id);
                      }
                    }}
                  />
                  <path
                    d={d}
                    className="tissue-candidate-path"
                    strokeWidth={strokeWidth}
                    strokeOpacity={opacity}
                    strokeDasharray="2.2 1.6"
                    fill="none"
                    pointerEvents="none"
                  />
                  <text
                    x={mid.x}
                    y={mid.y - 1.5}
                    className="tissue-candidate-label"
                    pointerEvents="none"
                  >
                    candidate
                  </text>
                </g>
              );
            })
          : null}

        {neurons.map((neuron) => {
          const point = positions.get(neuron.id)!;
          const soma = neuron.somaRadius * WIDTH;
          const dendrite = neuron.dendriteRadius * WIDTH;
          const selected = selectedNeuronId === neuron.id;
          const pressing = activePressId === neuron.id;
          const flashed = flashedNeuronId === neuron.id;
          const state = electricalState(neuron);
          const inhibitory = neuron.cellType === "inhibitory";
          const axonReach = neuron.axonLength * WIDTH;
          const developing = showDevViz && neuronIsDeveloping(neuron);
          const lifecycle = neuron.lifecycle;

          return (
            <g
              key={neuron.id}
              className={`tissue-cell ${inhibitory ? "is-inhibitory" : "is-excitatory"} ${
                selected ? "is-selected" : ""
              } ${pressing ? "is-pressing" : ""} ${flashed ? "is-flashed" : ""} state-${state.toLowerCase()} ${
                developing ? `is-developing ${lifecycleClass(lifecycle)}` : ""
              }`}
              data-testid={`tissue-cell-${neuron.id}`}
              data-cell-type={neuron.cellType}
              data-lifecycle={lifecycle}
              data-developing={developing ? "true" : "false"}
              data-pos-x={neuron.position.x}
              data-pos-y={neuron.position.y}
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
              {emphasizeMorphology && !developing ? (
                <circle
                  r={axonReach}
                  className="tissue-axon-reach"
                  pointerEvents="none"
                />
              ) : null}
              {developing && lifecycle === "maturing" ? (
                <>
                  <circle
                    r={soma + 2.2}
                    className="tissue-lifecycle-ring tissue-maturing-ring"
                    pointerEvents="none"
                    data-testid={`tissue-maturing-ring-${neuron.id}`}
                  />
                  <circle
                    r={Math.max(1.2, soma * 0.55)}
                    className="tissue-maturing-seed"
                    pointerEvents="none"
                    data-testid={`tissue-maturing-seed-${neuron.id}`}
                  />
                </>
              ) : null}
              {developing && lifecycle === "settling" ? (
                <circle
                  r={soma + 2.4}
                  className="tissue-lifecycle-ring tissue-settling-ring"
                  pointerEvents="none"
                  data-testid={`tissue-settling-ring-${neuron.id}`}
                />
              ) : null}
              {developing && lifecycle === "migrating" ? (
                <circle
                  r={soma + 1.8}
                  className="tissue-lifecycle-ring tissue-migrating-ring"
                  pointerEvents="none"
                />
              ) : null}
              {!(developing && lifecycle === "maturing") ? (
                <>
                  <circle r={dendrite} className="tissue-dendrite" pointerEvents="none" />
                  <circle r={soma} className="tissue-soma" pointerEvents="none" />
                </>
              ) : null}
              {developing && lifecycle === "differentiating" ? (
                <text
                  y={-(soma + 3.2)}
                  className="tissue-type-badge"
                  pointerEvents="none"
                  data-testid={`tissue-type-badge-${neuron.id}`}
                >
                  {neuron.cellTypeAssigned ?? "…"}
                </text>
              ) : null}
              <text y={soma + 3.5} className="tissue-label" pointerEvents="none">
                {shortNeuronId(neuron.id)}
              </text>
              <text y={soma + 6.2} className="tissue-sublabel" pointerEvents="none">
                {developing
                  ? lifecycle
                  : `${inhibitory ? "Inh" : "Exc"} · ${neuron.membranePotentialMv.toFixed(0)} mV`}
              </text>
            </g>
          );
        })}
      </svg>

      {showDevelopment ? (
        <>
          {topology ? (
            <dl className="topology-summary" data-testid="topology-summary">
              <div>
                <dt>Cells</dt>
                <dd>{topology.cellCount}</dd>
              </div>
              <div>
                <dt>Synapses</dt>
                <dd data-testid="topology-synapse-count">{topology.synapseCount}</dd>
              </div>
              <div>
                <dt>Candidates</dt>
                <dd>{topology.candidateCount}</dd>
              </div>
              <div>
                <dt>At risk</dt>
                <dd>{topology.atRiskSynapseCount}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd data-testid="topology-created-count">{topology.createdThisSession}</dd>
              </div>
              <div>
                <dt>Pruned</dt>
                <dd data-testid="topology-pruned-count">{topology.prunedThisSession}</dd>
              </div>
              <div>
                <dt>Capacity</dt>
                <dd>
                  {topology.synapseCount}/{topology.maxSynapseCapacity}
                </dd>
              </div>
            </dl>
          ) : null}
          <ul className="tissue-dev-legend" data-testid="tissue-development-legend">
            <li>
              <span className="legend-swatch legend-solid" /> Solid path: existing synapse
            </li>
            <li>
              <span className="legend-swatch legend-dashed" /> Dashed path: growth candidate
            </li>
            <li>
              <span className="legend-swatch legend-warning">!</span> Warning marker: pruning risk
            </li>
            {showDevViz ? (
              <li>
                <span className="legend-swatch legend-zone" /> Simplified Progenitor Zone (backend)
              </li>
            ) : null}
            <li>
              Topology and development change only after confirmed backend ticks (0.7)
            </li>
          </ul>
        </>
      ) : null}
    </div>
  );
}
