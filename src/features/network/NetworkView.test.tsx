import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NetworkView } from "./NetworkView";
import type { ConnectionSnapshot, NeuronSnapshot, PropagationTrace } from "../../types/neural";

const neurons: NeuronSnapshot[] = [
  "NEURON-001",
  "NEURON-002",
  "NEURON-003",
  "NEURON-004",
  "NEURON-005",
].map((id) => ({
  id,
  restingPotentialMv: -70,
  membranePotentialMv: id === "NEURON-002" ? -54 : -70,
  thresholdMv: -55,
  energy: 100,
  fatigue: 0,
  refractoryTicks: 0,
  fired: false,
  tick: 0,
}));

const connections: ConnectionSnapshot[] = [
  {
    id: "CONNECTION-001",
    sourceNeuronId: "NEURON-001",
    targetNeuronId: "NEURON-002",
    weight: 16,
    connectionType: "excitatory",
  },
  {
    id: "CONNECTION-002",
    sourceNeuronId: "NEURON-002",
    targetNeuronId: "NEURON-003",
    weight: 16,
    connectionType: "excitatory",
  },
  {
    id: "CONNECTION-003",
    sourceNeuronId: "NEURON-002",
    targetNeuronId: "NEURON-004",
    weight: 16,
    connectionType: "excitatory",
  },
  {
    id: "CONNECTION-004",
    sourceNeuronId: "NEURON-003",
    targetNeuronId: "NEURON-005",
    weight: 8,
    connectionType: "excitatory",
  },
  {
    id: "CONNECTION-005",
    sourceNeuronId: "NEURON-004",
    targetNeuronId: "NEURON-005",
    weight: 8,
    connectionType: "excitatory",
  },
];

function renderView(
  overrides: Partial<{
    onSelectNeuron: (id: string) => void;
    onLongPressStimulate: (id: string) => void;
    onPressVisualChange: (id: string | null) => void;
    activePropagations: PropagationTrace[];
    reducedMotion: boolean;
  }> = {},
) {
  const onSelectNeuron = overrides.onSelectNeuron ?? vi.fn();
  const onLongPressStimulate = overrides.onLongPressStimulate ?? vi.fn();
  const onPressVisualChange = overrides.onPressVisualChange ?? vi.fn();

  const result = render(
    <NetworkView
      neurons={neurons}
      connections={connections}
      selectedNeuronId="NEURON-001"
      activePropagations={overrides.activePropagations ?? []}
      reducedMotion={overrides.reducedMotion ?? false}
      interactionDisabled={false}
      pressingNeuronId={null}
      onSelectNeuron={onSelectNeuron}
      onLongPressStimulate={onLongPressStimulate}
      onPressVisualChange={onPressVisualChange}
    />,
  );

  return { ...result, onSelectNeuron, onLongPressStimulate, onPressVisualChange };
}

describe("NetworkView", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders five backend neurons and five connections", () => {
    const { container } = renderView();
    expect(container.querySelectorAll(".network-node")).toHaveLength(5);
    expect(container.querySelectorAll(".network-link")).toHaveLength(5);
  });

  it("selects on short tap without stimulating", () => {
    const { container, onSelectNeuron, onLongPressStimulate } = renderView();
    const node = container.querySelector('[aria-label^="Select NEURON-003"]') as Element;

    fireEvent.pointerDown(node, { pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.pointerUp(node, { pointerId: 1, clientX: 10, clientY: 10 });

    expect(onSelectNeuron).toHaveBeenCalledWith("NEURON-003");
    expect(onLongPressStimulate).not.toHaveBeenCalled();
  });

  it("stimulates on long press after 500ms", () => {
    const { container, onSelectNeuron, onLongPressStimulate } = renderView();
    const node = container.querySelector('[aria-label^="Select NEURON-002"]') as Element;

    fireEvent.pointerDown(node, { pointerId: 1, clientX: 10, clientY: 10 });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    fireEvent.pointerUp(node, { pointerId: 1, clientX: 10, clientY: 10 });

    expect(onLongPressStimulate).toHaveBeenCalledWith("NEURON-002");
    expect(onSelectNeuron).not.toHaveBeenCalled();
  });

  it("cancels long press when the pointer moves too far", () => {
    const { container, onSelectNeuron, onLongPressStimulate } = renderView();
    const node = container.querySelector('[aria-label^="Select NEURON-001"]') as Element;

    fireEvent.pointerDown(node, { pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(node, { pointerId: 1, clientX: 40, clientY: 10 });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    fireEvent.pointerUp(node, { pointerId: 1, clientX: 40, clientY: 10 });

    expect(onLongPressStimulate).not.toHaveBeenCalled();
    expect(onSelectNeuron).not.toHaveBeenCalled();
  });

  it("animates only a matching real propagation", () => {
    const active: PropagationTrace[] = [
      {
        eventId: "evt-1",
        sourceNeuronId: "NEURON-001",
        targetNeuronId: "NEURON-002",
        amountMv: 16,
      },
    ];
    const { container } = renderView({ activePropagations: active, reducedMotion: true });
    expect(container.querySelectorAll(".network-link-pulse")).toHaveLength(1);
    expect(screen.getByText("+16 mV")).toBeInTheDocument();
  });
});
