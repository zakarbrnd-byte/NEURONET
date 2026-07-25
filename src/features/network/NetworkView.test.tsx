import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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

describe("NetworkView", () => {
  it("renders five backend neurons and five connections", () => {
    const { container } = render(
      <NetworkView
        neurons={neurons}
        connections={connections}
        selectedNeuronId="NEURON-001"
        activePropagations={[]}
        reducedMotion={false}
        onSelectNeuron={() => undefined}
      />,
    );

    expect(container.querySelectorAll(".network-node")).toHaveLength(5);
    expect(container.querySelectorAll(".network-link")).toHaveLength(5);
  });

  it("does not create extra neurons", () => {
    const { container } = render(
      <NetworkView
        neurons={neurons.slice(0, 2)}
        connections={[connections[0]]}
        selectedNeuronId="NEURON-001"
        activePropagations={[]}
        reducedMotion={false}
        onSelectNeuron={() => undefined}
      />,
    );
    expect(container.querySelectorAll(".network-node")).toHaveLength(2);
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
    const { container, rerender } = render(
      <NetworkView
        neurons={neurons}
        connections={connections}
        selectedNeuronId="NEURON-001"
        activePropagations={active}
        reducedMotion
        onSelectNeuron={() => undefined}
      />,
    );

    expect(container.querySelectorAll(".network-link-pulse")).toHaveLength(1);
    expect(screen.getByText("+16 mV")).toBeInTheDocument();

    rerender(
      <NetworkView
        neurons={neurons}
        connections={connections}
        selectedNeuronId="NEURON-001"
        activePropagations={[]}
        reducedMotion
        onSelectNeuron={() => undefined}
      />,
    );
    expect(container.querySelectorAll(".network-link-pulse")).toHaveLength(0);
  });

  it("notifies when a neuron is selected", () => {
    const onSelect = vi.fn();
    const { container } = render(
      <NetworkView
        neurons={neurons}
        connections={connections}
        selectedNeuronId="NEURON-001"
        activePropagations={[]}
        reducedMotion={false}
        onSelectNeuron={onSelect}
      />,
    );
    const node = container.querySelector('[aria-label^="Select NEURON-003"]');
    expect(node).toBeTruthy();
    fireEvent.click(node as Element);
    expect(onSelect).toHaveBeenCalledWith("NEURON-003");
  });

  it("keeps the SVG inside a bounded wrapper", () => {
    const { container } = render(
      <NetworkView
        neurons={neurons}
        connections={connections}
        selectedNeuronId="NEURON-001"
        activePropagations={[]}
        reducedMotion={false}
        onSelectNeuron={() => undefined}
      />,
    );
    expect(container.querySelector(".network-svg-wrap")).toBeTruthy();
    expect(container.querySelector(".network-svg")).toBeTruthy();
  });
});
