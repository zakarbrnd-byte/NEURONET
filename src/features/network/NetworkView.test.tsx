import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  HIT_TARGET_RADIUS,
  LONG_PRESS_MS,
  MOVE_TOLERANCE_PX,
  NetworkView,
} from "./NetworkView";
import type { NeuronSnapshot, PropagationTrace, SynapseSnapshot } from "../../types/neural";

const neurons: NeuronSnapshot[] = [
  "NEURON-001",
  "NEURON-002",
  "NEURON-003",
  "NEURON-004",
  "NEURON-005",
].map((id) => {
  const cellType = id === "NEURON-004" ? ("inhibitory" as const) : ("excitatory" as const);
  return {
    id,
    restingPotentialMv: -70,
    membranePotentialMv: id === "NEURON-002" ? -54 : -70,
    thresholdMv: -55,
    energy: 100,
    fatigue: 0,
    refractoryTicks: 0,
    fired: false,
    tick: 0,
    position: { x: 0.5, y: 0.5 },
    region: "Observatory Cortex",
    layer: 1,
    cellType,
    dnaId: id.replace("NEURON-", "DNA-"),
    somaRadius: 0.035,
    dendriteRadius: 0.09,
    axonLength: 0.2,
    lifecycle: "settled" as const,
    developmentalAge: 0,
    phaseAge: 0,
    birthTick: 0,
    settledTick: 0,
    targetPosition: null,
    originalTargetPosition: null,
    migrationPath: null,
    migrationProgress: 1,
    migrationDistance: 0,
    morphologyProgress: 1,
    cellTypeAssigned: cellType,
    electricallyEligibleFromTick: 0,
    structurallyEligibleFromTick: 0,
    developmentalOrigin: "initial_tissue",
    matureMorphology: {
      somaRadius: 0.035,
      dendriteRadius: 0.09,
      axonReach: 0.2,
    },
    blockingConditions: [] as string[],
  };
});

const synapses: SynapseSnapshot[] = [
  {
    id: "SYNAPSE-001",
    sourceNeuronId: "NEURON-001",
    targetNeuronId: "NEURON-002",
    weight: 16,
    type: "excitatory",
    usageCount: 0,
    lastActivatedTick: null,
    stability: 0.5,
    health: 0.9,
    age: 0,
    creationTick: 0,
    weightHistory: [{ tick: 0, weight: 16 }],
    lastWeightDelta: 0,
    pruningRisk: 0,
    inactivityTicks: 0,
    lowWeightTicks: 0,
    lowHealthTicks: 0,
    protectedUntilTick: 10,
    pruningStatus: "protected",
    pruningReasons: ["grace_period"],
    structurallyProtected: false,
    protectionReason: null,
    originCandidateId: null,
    eligibleFromTick: 0,
    atRiskEvals: 0,
  },
  {
    id: "SYNAPSE-002",
    sourceNeuronId: "NEURON-002",
    targetNeuronId: "NEURON-003",
    weight: 16,
    type: "excitatory",
    usageCount: 0,
    lastActivatedTick: null,
    stability: 0.5,
    health: 0.9,
    age: 0,
    creationTick: 0,
    weightHistory: [{ tick: 0, weight: 16 }],
    lastWeightDelta: 0,
    pruningRisk: 0,
    inactivityTicks: 0,
    lowWeightTicks: 0,
    lowHealthTicks: 0,
    protectedUntilTick: 10,
    pruningStatus: "protected",
    pruningReasons: ["grace_period"],
    structurallyProtected: false,
    protectionReason: null,
    originCandidateId: null,
    eligibleFromTick: 0,
    atRiskEvals: 0,
  },
  {
    id: "SYNAPSE-003",
    sourceNeuronId: "NEURON-002",
    targetNeuronId: "NEURON-004",
    weight: 16,
    type: "excitatory",
    usageCount: 0,
    lastActivatedTick: null,
    stability: 0.5,
    health: 0.9,
    age: 0,
    creationTick: 0,
    weightHistory: [{ tick: 0, weight: 16 }],
    lastWeightDelta: 0,
    pruningRisk: 0,
    inactivityTicks: 0,
    lowWeightTicks: 0,
    lowHealthTicks: 0,
    protectedUntilTick: 10,
    pruningStatus: "protected",
    pruningReasons: ["grace_period"],
    structurallyProtected: false,
    protectionReason: null,
    originCandidateId: null,
    eligibleFromTick: 0,
    atRiskEvals: 0,
  },
  {
    id: "SYNAPSE-004",
    sourceNeuronId: "NEURON-003",
    targetNeuronId: "NEURON-005",
    weight: 8,
    type: "excitatory",
    usageCount: 0,
    lastActivatedTick: null,
    stability: 0.5,
    health: 0.9,
    age: 0,
    creationTick: 0,
    weightHistory: [{ tick: 0, weight: 8 }],
    lastWeightDelta: 0,
    pruningRisk: 0,
    inactivityTicks: 0,
    lowWeightTicks: 0,
    lowHealthTicks: 0,
    protectedUntilTick: 10,
    pruningStatus: "protected",
    pruningReasons: ["grace_period"],
    structurallyProtected: false,
    protectionReason: null,
    originCandidateId: null,
    eligibleFromTick: 0,
    atRiskEvals: 0,
  },
  {
    id: "SYNAPSE-005",
    sourceNeuronId: "NEURON-004",
    targetNeuronId: "NEURON-005",
    weight: 8,
    type: "inhibitory",
    usageCount: 0,
    lastActivatedTick: null,
    stability: 0.5,
    health: 0.9,
    age: 0,
    creationTick: 0,
    weightHistory: [{ tick: 0, weight: 8 }],
    lastWeightDelta: 0,
    pruningRisk: 0,
    inactivityTicks: 0,
    lowWeightTicks: 0,
    lowHealthTicks: 0,
    protectedUntilTick: 10,
    pruningStatus: "protected",
    pruningReasons: ["grace_period"],
    structurallyProtected: false,
    protectionReason: null,
    originCandidateId: null,
    eligibleFromTick: 0,
    atRiskEvals: 0,
  },
];

function renderView(
  overrides: Partial<{
    onSelectNeuron: (id: string) => void;
    onSelectSynapse: (id: string) => void;
    onLongPressStimulate: (id: string) => void;
    onPressVisualChange: (id: string | null) => void;
    selectedNeuronId: string | null;
    activePropagations: PropagationTrace[];
    reducedMotion: boolean;
    flashedNeuronId: string | null;
  }> = {},
) {
  const onSelectNeuron = overrides.onSelectNeuron ?? vi.fn();
  const onSelectSynapse = overrides.onSelectSynapse ?? vi.fn();
  const onLongPressStimulate = overrides.onLongPressStimulate ?? vi.fn();
  const onPressVisualChange = overrides.onPressVisualChange ?? vi.fn();

  const view = render(
    <NetworkView
      neurons={neurons}
      synapses={synapses}
      selectedNeuronId={overrides.selectedNeuronId ?? null}
      activePropagations={overrides.activePropagations ?? []}
      reducedMotion={overrides.reducedMotion ?? false}
      interactionDisabled={false}
      pressingNeuronId={null}
      flashedNeuronId={overrides.flashedNeuronId ?? null}
      onSelectNeuron={onSelectNeuron}
      onSelectSynapse={onSelectSynapse}
      onLongPressStimulate={onLongPressStimulate}
      onPressVisualChange={onPressVisualChange}
    />,
  );

  return { ...view, onSelectNeuron, onSelectSynapse, onLongPressStimulate, onPressVisualChange };
}

function targetFor(id: string) {
  return screen.getByLabelText(new RegExp(`Select ${id}`));
}

describe("NetworkView gestures", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders five backend neurons and five synapses", () => {
    renderView();
    expect(screen.getAllByRole("button", { name: /Select NEURON-/ })).toHaveLength(5);
    expect(screen.getByTestId("network-synapse-SYNAPSE-001")).toBeInTheDocument();
    expect(screen.getByLabelText("Inspect synapse SYNAPSE-005")).toBeInTheDocument();
  });

  it("selects a synapse when its hit target is activated", () => {
    const { onSelectSynapse } = renderView();
    fireEvent.click(screen.getByLabelText("Inspect synapse SYNAPSE-001"));
    expect(onSelectSynapse).toHaveBeenCalledWith("SYNAPSE-001");
  });

  it("short tap selects neuron after pointer release without stimulating", () => {
    const { onSelectNeuron, onLongPressStimulate } = renderView();
    const target = targetFor("NEURON-001");
    fireEvent.pointerDown(target, { pointerId: 1, button: 0, clientX: 10, clientY: 10 });
    fireEvent.pointerUp(target, { pointerId: 1, button: 0, clientX: 10, clientY: 10 });
    expect(onSelectNeuron).toHaveBeenCalledWith("NEURON-001");
    expect(onLongPressStimulate).not.toHaveBeenCalled();
  });

  it("long press stimulates and suppresses synthetic click selection", () => {
    const { onSelectNeuron, onLongPressStimulate } = renderView();
    const target = targetFor("NEURON-002");
    fireEvent.pointerDown(target, { pointerId: 2, button: 0, clientX: 20, clientY: 20 });
    act(() => {
      vi.advanceTimersByTime(LONG_PRESS_MS);
    });
    fireEvent.pointerUp(target, { pointerId: 2, button: 0, clientX: 20, clientY: 20 });
    fireEvent.click(target);
    expect(onLongPressStimulate).toHaveBeenCalledWith("NEURON-002");
    expect(onSelectNeuron).not.toHaveBeenCalled();
  });

  it("cancels long press when the pointer moves beyond tolerance", () => {
    const { onSelectNeuron, onLongPressStimulate } = renderView();
    const target = targetFor("NEURON-003");
    fireEvent.pointerDown(target, { pointerId: 3, button: 0, clientX: 30, clientY: 30 });
    fireEvent.pointerMove(target, {
      pointerId: 3,
      clientX: 30 + MOVE_TOLERANCE_PX + 1,
      clientY: 30,
    });
    act(() => {
      vi.advanceTimersByTime(LONG_PRESS_MS);
    });
    fireEvent.pointerUp(target, { pointerId: 3, button: 0, clientX: 40, clientY: 30 });
    expect(onLongPressStimulate).not.toHaveBeenCalled();
    expect(onSelectNeuron).not.toHaveBeenCalled();
  });

  it("uses a hit target radius of at least 22 SVG units", () => {
    expect(HIT_TARGET_RADIUS).toBeGreaterThanOrEqual(22);
  });

  it("marks SVG text as non-interactive", () => {
    const { container } = renderView();
    for (const text of container.querySelectorAll("text")) {
      expect(text).toHaveAttribute("pointer-events", "none");
    }
  });

  it("pulses only matching synapse propagations", () => {
    const { container } = renderView({
      activePropagations: [
        {
          eventId: "e1",
          synapseId: "SYNAPSE-001",
          sourceNeuronId: "NEURON-001",
          targetNeuronId: "NEURON-002",
          amountMv: 16,
        },
      ],
    });
    expect(container.querySelector(".network-link-pulse")).toBeTruthy();
  });
});
