import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LONG_PRESS_MS, MOVE_TOLERANCE_PX, NetworkView } from "./NetworkView";
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
    selectedNeuronId: string | null;
    activePropagations: PropagationTrace[];
    reducedMotion: boolean;
    flashedNeuronId: string | null;
  }> = {},
) {
  const onSelectNeuron = overrides.onSelectNeuron ?? vi.fn();
  const onLongPressStimulate = overrides.onLongPressStimulate ?? vi.fn();
  const onPressVisualChange = overrides.onPressVisualChange ?? vi.fn();

  const result = render(
    <NetworkView
      neurons={neurons}
      connections={connections}
      selectedNeuronId={overrides.selectedNeuronId ?? "NEURON-001"}
      activePropagations={overrides.activePropagations ?? []}
      reducedMotion={overrides.reducedMotion ?? false}
      interactionDisabled={false}
      pressingNeuronId={null}
      flashedNeuronId={overrides.flashedNeuronId ?? null}
      onSelectNeuron={onSelectNeuron}
      onLongPressStimulate={onLongPressStimulate}
      onPressVisualChange={onPressVisualChange}
    />,
  );

  return { ...result, onSelectNeuron, onLongPressStimulate, onPressVisualChange };
}

function nodeFor(container: HTMLElement, id: string) {
  return container.querySelector(`[aria-label^="Select ${id}"]`) as Element;
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
    const node = nodeFor(container, "NEURON-003");

    fireEvent.pointerDown(node, { pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.pointerUp(node, { pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.click(node);

    expect(onSelectNeuron).toHaveBeenCalledTimes(1);
    expect(onSelectNeuron).toHaveBeenCalledWith("NEURON-003");
    expect(onLongPressStimulate).not.toHaveBeenCalled();
  });

  it("stimulates exactly once on completed long press and does not select", () => {
    const { container, onSelectNeuron, onLongPressStimulate } = renderView();
    const node = nodeFor(container, "NEURON-002");

    fireEvent.pointerDown(node, { pointerId: 1, clientX: 10, clientY: 10 });
    act(() => {
      vi.advanceTimersByTime(LONG_PRESS_MS);
    });
    fireEvent.pointerUp(node, { pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.click(node);

    expect(onLongPressStimulate).toHaveBeenCalledTimes(1);
    expect(onLongPressStimulate).toHaveBeenCalledWith("NEURON-002");
    expect(onSelectNeuron).not.toHaveBeenCalled();
  });

  it("releasing after a long press does not trigger selection", () => {
    const { container, onSelectNeuron, onLongPressStimulate } = renderView();
    const node = nodeFor(container, "NEURON-004");

    fireEvent.pointerDown(node, { pointerId: 1, clientX: 10, clientY: 10 });
    act(() => {
      vi.advanceTimersByTime(LONG_PRESS_MS);
    });
    expect(onLongPressStimulate).toHaveBeenCalledTimes(1);

    fireEvent.pointerUp(node, { pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.click(node);

    expect(onSelectNeuron).not.toHaveBeenCalled();
  });

  it("cancels long press when pointer movement exceeds tolerance", () => {
    const { container, onSelectNeuron, onLongPressStimulate } = renderView();
    const node = nodeFor(container, "NEURON-001");

    fireEvent.pointerDown(node, { pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(node, {
      pointerId: 1,
      clientX: 10 + MOVE_TOLERANCE_PX + 1,
      clientY: 10,
    });
    act(() => {
      vi.advanceTimersByTime(LONG_PRESS_MS);
    });
    fireEvent.pointerUp(node, {
      pointerId: 1,
      clientX: 10 + MOVE_TOLERANCE_PX + 1,
      clientY: 10,
    });
    fireEvent.click(node);

    expect(onLongPressStimulate).not.toHaveBeenCalled();
    expect(onSelectNeuron).not.toHaveBeenCalled();
  });

  it("small movement within tolerance still allows a normal tap", () => {
    const { container, onSelectNeuron, onLongPressStimulate } = renderView();
    const node = nodeFor(container, "NEURON-003");

    fireEvent.pointerDown(node, { pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(node, {
      pointerId: 1,
      clientX: 10 + MOVE_TOLERANCE_PX - 1,
      clientY: 10,
    });
    fireEvent.pointerUp(node, {
      pointerId: 1,
      clientX: 10 + MOVE_TOLERANCE_PX - 1,
      clientY: 10,
    });

    expect(onLongPressStimulate).not.toHaveBeenCalled();
    expect(onSelectNeuron).toHaveBeenCalledWith("NEURON-003");
  });

  it("pointer cancel clears the pending long-press timer", () => {
    const { container, onSelectNeuron, onLongPressStimulate } = renderView();
    const node = nodeFor(container, "NEURON-002");

    fireEvent.pointerDown(node, { pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.pointerCancel(node, { pointerId: 1, clientX: 10, clientY: 10 });
    act(() => {
      vi.advanceTimersByTime(LONG_PRESS_MS);
    });
    fireEvent.pointerUp(node, { pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.click(node);

    expect(onLongPressStimulate).not.toHaveBeenCalled();
    expect(onSelectNeuron).not.toHaveBeenCalled();
  });

  it("Enter and Space select without stimulating", () => {
    const { container, onSelectNeuron, onLongPressStimulate } = renderView();
    const node = nodeFor(container, "NEURON-005");

    fireEvent.keyDown(node, { key: "Enter" });
    fireEvent.keyDown(node, { key: " " });

    expect(onSelectNeuron).toHaveBeenCalledTimes(2);
    expect(onSelectNeuron).toHaveBeenNthCalledWith(1, "NEURON-005");
    expect(onSelectNeuron).toHaveBeenNthCalledWith(2, "NEURON-005");
    expect(onLongPressStimulate).not.toHaveBeenCalled();
  });

  it("shows a hold ring while pressing", () => {
    const { container } = renderView();
    const node = nodeFor(container, "NEURON-001");

    fireEvent.pointerDown(node, { pointerId: 1, clientX: 10, clientY: 10 });
    expect(container.querySelector(".network-hold-ring")).toBeTruthy();

    fireEvent.pointerUp(node, { pointerId: 1, clientX: 10, clientY: 10 });
    expect(container.querySelector(".network-hold-ring")).toBeNull();
  });

  it("marks flashed neurons for visual confirmation", () => {
    const { container } = renderView({ flashedNeuronId: "NEURON-003" });
    const node = nodeFor(container, "NEURON-003");
    expect(node.classList.contains("flashed")).toBe(true);
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
