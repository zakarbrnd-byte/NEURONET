import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NeuronStatus } from "./NeuronStatus";
import {
  METRIC_EXPLANATIONS,
  REQUIRED_METRIC_KEYS,
} from "../../content/metricExplanations";
import type { NeuronSnapshot } from "../../types/neural";

const neuron: NeuronSnapshot = {
  id: "NEURON-002",
  restingPotentialMv: -70,
  membranePotentialMv: -60,
  thresholdMv: -55,
  energy: 100,
  fatigue: 0,
  refractoryTicks: 0,
  fired: false,
  tick: 4,
};

describe("NeuronStatus metric explanations", () => {
  it("provides accessible explanations for every technical metric", () => {
    render(
      <NeuronStatus
        neuron={neuron}
        networkTick={7}
        connections={[
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
        ]}
        events={[
          {
            id: "evt-1",
            timestamp: "2026-07-25T00:00:00.000Z",
            networkTick: 6,
            type: "signal_propagated",
            sourceNeuronId: "NEURON-001",
            targetNeuronId: "NEURON-002",
            amountMv: 16,
            message: "Propagated",
          },
          {
            id: "evt-2",
            timestamp: "2026-07-25T00:00:01.000Z",
            networkTick: 5,
            type: "neuron_fired",
            neuronId: "NEURON-002",
            message: "Fired",
          },
        ]}
      />,
    );

    for (const metric of REQUIRED_METRIC_KEYS) {
      const { label, explanation } = METRIC_EXPLANATIONS[metric];
      expect(screen.getByText(label)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: `Explain ${label}` })).toBeInTheDocument();
      expect(screen.getByRole("tooltip", { name: explanation })).toBeInTheDocument();
    }

    // Exact technical values remain visible.
    expect(screen.getByText("-70.0 mV")).toBeInTheDocument();
    expect(screen.getByText("-60.0 mV")).toBeInTheDocument();
    expect(screen.getByText("-55.0 mV")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("explains that Network Tick is not a real-world second", () => {
    render(
      <NeuronStatus
        neuron={neuron}
        networkTick={2}
        connections={[]}
        events={[]}
      />,
    );

    expect(screen.getByRole("tooltip", { name: METRIC_EXPLANATIONS.networkTick.explanation })).toHaveTextContent(
      /not equal to one real-world second/i,
    );
  });
});
