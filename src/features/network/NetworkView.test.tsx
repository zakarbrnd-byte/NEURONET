import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  HIT_TARGET_RADIUS,
  LONG_PRESS_MS,
  MOVE_TOLERANCE_PX,
  NetworkView,
} from "./NetworkView";
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
  position: { x: 0.5, y: 0.5 },
  region: "Observatory Cortex",
  layer: 1,
  cellType: id === "NEURON-004" ? "inhibitory" : "excitatory",
  dnaId: id.replace("NEURON-", "DNA-"),
  somaRadius: 0.035,
  dendriteRadius: 0.09,
  axonLength: 0.2,
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
    connectionType: "inhibitory",
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

function targetFor(container: HTMLElement, id: string) {
  return container.querySelector(`[aria-label^="Select ${id}"]`) as Element;
}

describe("NetworkView pointer gesture model", () => {
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
    expect(container.querySelectorAll(".neuron-hit-target")).toHaveLength(5);
  });

  it("1. pointer down alone does not select", () => {
    const { container, onSelectNeuron, onLongPressStimulate } = renderView();
    const node = targetFor(container, "NEURON-003");

    fireEvent.pointerDown(node, { pointerId: 1, clientX: 10, clientY: 10 });

    expect(onSelectNeuron).not.toHaveBeenCalled();
    expect(onLongPressStimulate).not.toHaveBeenCalled();
    expect(container.querySelector(".network-hold-ring")).toBeTruthy();
  });

  it("2. holding less than 500ms does not select before pointer up", () => {
    const { container, onSelectNeuron, onLongPressStimulate } = renderView();
    const node = targetFor(container, "NEURON-003");

    fireEvent.pointerDown(node, { pointerId: 1, clientX: 10, clientY: 10 });
    act(() => {
      vi.advanceTimersByTime(LONG_PRESS_MS - 1);
    });

    expect(onSelectNeuron).not.toHaveBeenCalled();
    expect(onLongPressStimulate).not.toHaveBeenCalled();
  });

  it("3. short pointer down + pointer up selects once", () => {
    const { container, onSelectNeuron, onLongPressStimulate } = renderView();
    const node = targetFor(container, "NEURON-003");

    fireEvent.pointerDown(node, { pointerId: 1, clientX: 10, clientY: 10 });
    act(() => {
      vi.advanceTimersByTime(120);
    });
    fireEvent.pointerUp(node, { pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.click(node);

    expect(onSelectNeuron).toHaveBeenCalledTimes(1);
    expect(onSelectNeuron).toHaveBeenCalledWith("NEURON-003");
    expect(onLongPressStimulate).not.toHaveBeenCalled();
  });

  it("4–5. long press stimulates once and never selects", () => {
    const { container, onSelectNeuron, onLongPressStimulate } = renderView();
    const node = targetFor(container, "NEURON-002");

    fireEvent.pointerDown(node, { pointerId: 1, clientX: 10, clientY: 10 });
    act(() => {
      vi.advanceTimersByTime(LONG_PRESS_MS);
    });
    expect(onLongPressStimulate).toHaveBeenCalledTimes(1);
    expect(onSelectNeuron).not.toHaveBeenCalled();

    fireEvent.pointerUp(node, { pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.click(node);

    expect(onLongPressStimulate).toHaveBeenCalledTimes(1);
    expect(onSelectNeuron).not.toHaveBeenCalled();
  });

  it("7. SVG text cannot become the pointer event target", () => {
    const { container } = renderView();
    const texts = container.querySelectorAll(
      ".network-node-id, .network-node-mv, .network-state-mark",
    );
    expect(texts.length).toBeGreaterThan(0);
    texts.forEach((text) => {
      expect(text.getAttribute("pointer-events")).toBe("none");
    });

    const hit = container.querySelector(".network-hit-area") as SVGCircleElement;
    expect(hit).toBeTruthy();
    expect(Number(hit.getAttribute("r"))).toBe(HIT_TARGET_RADIUS);
  });

  it("8. moving beyond tolerance cancels stimulation and selection", () => {
    const { container, onSelectNeuron, onLongPressStimulate } = renderView();
    const node = targetFor(container, "NEURON-001");

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

  it("9. pointer cancel performs no action", () => {
    const { container, onSelectNeuron, onLongPressStimulate } = renderView();
    const node = targetFor(container, "NEURON-002");

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

  it("10. synthetic click after long press is ignored", () => {
    const { container, onSelectNeuron, onLongPressStimulate } = renderView();
    const node = targetFor(container, "NEURON-004");

    fireEvent.pointerDown(node, { pointerId: 1, clientX: 10, clientY: 10 });
    act(() => {
      vi.advanceTimersByTime(LONG_PRESS_MS);
    });
    fireEvent.pointerUp(node, { pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.click(node);
    fireEvent.click(node);

    expect(onLongPressStimulate).toHaveBeenCalledTimes(1);
    expect(onSelectNeuron).not.toHaveBeenCalled();
  });

  it("11. context menu is suppressed on the neuron target", () => {
    const { container } = renderView();
    const node = targetFor(container, "NEURON-001");
    const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
    const prevented = !node.dispatchEvent(event);
    // preventDefault during handler → defaultPrevented
    expect(event.defaultPrevented || prevented).toBe(true);
  });

  it("12. Enter and Space select without stimulating", () => {
    const { container, onSelectNeuron, onLongPressStimulate } = renderView();
    const node = targetFor(container, "NEURON-005");

    fireEvent.keyDown(node, { key: "Enter" });
    fireEvent.keyDown(node, { key: " " });

    expect(onSelectNeuron).toHaveBeenCalledTimes(2);
    expect(onLongPressStimulate).not.toHaveBeenCalled();
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
