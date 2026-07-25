import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NetworkView } from "./NetworkView";
import type { ConnectionSnapshot, NeuronSnapshot } from "../../types/neural";

const neurons: NeuronSnapshot[] = [
  {
    id: "NEURON-001",
    restingPotentialMv: -70,
    membranePotentialMv: -70,
    thresholdMv: -55,
    energy: 100,
    fatigue: 0,
    refractoryTicks: 0,
    fired: false,
    tick: 0,
  },
  {
    id: "NEURON-002",
    restingPotentialMv: -70,
    membranePotentialMv: -65,
    thresholdMv: -55,
    energy: 100,
    fatigue: 0,
    refractoryTicks: 0,
    fired: false,
    tick: 0,
  },
  {
    id: "NEURON-003",
    restingPotentialMv: -70,
    membranePotentialMv: -70,
    thresholdMv: -55,
    energy: 100,
    fatigue: 0,
    refractoryTicks: 0,
    fired: false,
    tick: 0,
  },
];

const connections: ConnectionSnapshot[] = [
  {
    id: "CONNECTION-001",
    sourceNeuronId: "NEURON-001",
    targetNeuronId: "NEURON-002",
    weight: 5,
    connectionType: "excitatory",
  },
  {
    id: "CONNECTION-002",
    sourceNeuronId: "NEURON-002",
    targetNeuronId: "NEURON-003",
    weight: 5,
    connectionType: "excitatory",
  },
];

describe("NetworkView", () => {
  it("renders exactly the backend neurons and connections", () => {
    const { container } = render(
      <NetworkView
        neurons={neurons}
        connections={connections}
        selectedNeuronId="NEURON-001"
        events={[]}
        onSelectNeuron={() => undefined}
      />,
    );

    expect(screen.getByLabelText("Select NEURON-001")).toBeInTheDocument();
    expect(screen.getByLabelText("Select NEURON-002")).toBeInTheDocument();
    expect(screen.getByLabelText("Select NEURON-003")).toBeInTheDocument();
    expect(container.querySelectorAll(".network-node")).toHaveLength(3);
    expect(container.querySelectorAll(".network-link")).toHaveLength(2);
  });

  it("does not create extra neurons", () => {
    const { container } = render(
      <NetworkView
        neurons={neurons.slice(0, 2)}
        connections={[connections[0]]}
        selectedNeuronId="NEURON-001"
        events={[]}
        onSelectNeuron={() => undefined}
      />,
    );

    expect(container.querySelectorAll(".network-node")).toHaveLength(2);
    expect(container.querySelectorAll('[aria-label="Select NEURON-003"]')).toHaveLength(0);
  });

  it("notifies when a neuron is selected", () => {
    const onSelect = vi.fn();
    const { container } = render(
      <NetworkView
        neurons={neurons}
        connections={connections}
        selectedNeuronId="NEURON-001"
        events={[]}
        onSelectNeuron={onSelect}
      />,
    );

    const node = container.querySelector('[aria-label="Select NEURON-002"]');
    expect(node).toBeTruthy();
    fireEvent.click(node as Element);
    expect(onSelect).toHaveBeenCalledWith("NEURON-002");
  });
});

