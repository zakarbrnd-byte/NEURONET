import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const snapshot = {
  tick: 0,
  neurons: ["NEURON-001", "NEURON-002", "NEURON-003", "NEURON-004", "NEURON-005"].map((id) => ({
    id,
    restingPotentialMv: -70,
    membranePotentialMv: -70,
    thresholdMv: -55,
    energy: 100,
    fatigue: 0,
    refractoryTicks: 0,
    fired: false,
    tick: 0,
  })),
  connections: [
    {
      id: "CONNECTION-001",
      sourceNeuronId: "NEURON-001",
      targetNeuronId: "NEURON-002",
      weight: 16,
      connectionType: "excitatory" as const,
    },
    {
      id: "CONNECTION-002",
      sourceNeuronId: "NEURON-002",
      targetNeuronId: "NEURON-003",
      weight: 16,
      connectionType: "excitatory" as const,
    },
    {
      id: "CONNECTION-003",
      sourceNeuronId: "NEURON-002",
      targetNeuronId: "NEURON-004",
      weight: 16,
      connectionType: "excitatory" as const,
    },
    {
      id: "CONNECTION-004",
      sourceNeuronId: "NEURON-003",
      targetNeuronId: "NEURON-005",
      weight: 8,
      connectionType: "excitatory" as const,
    },
    {
      id: "CONNECTION-005",
      sourceNeuronId: "NEURON-004",
      targetNeuronId: "NEURON-005",
      weight: 8,
      connectionType: "excitatory" as const,
    },
  ],
};

const stepTrace = {
  tick: 1,
  firedNeuronIds: ["NEURON-001"],
  propagations: [
    {
      eventId: "evt-prop-1",
      sourceNeuronId: "NEURON-001",
      targetNeuronId: "NEURON-002",
      amountMv: 16,
    },
  ],
  eventIds: ["evt-fire-1", "evt-prop-1"],
  network: {
    ...snapshot,
    tick: 1,
    neurons: snapshot.neurons.map((neuron) =>
      neuron.id === "NEURON-001"
        ? { ...neuron, fired: true, refractoryTicks: 2, tick: 1 }
        : neuron.id === "NEURON-002"
          ? { ...neuron, membranePotentialMv: -54, tick: 1 }
          : { ...neuron, tick: 1 },
    ),
  },
};

vi.mock("./services/neuralApi", () => {
  return {
    ApiError: class ApiError extends Error {
      status: number;
      constructor(message: string, status: number) {
        super(message);
        this.status = status;
      }
    },
    neuralApi: {
      hasConfiguredBackend: vi.fn(() => true),
      getHealth: vi.fn(async () => ({ status: "ok", version: "0.5" })),
      getNetwork: vi.fn(async () => snapshot),
      getEvents: vi.fn(async () => []),
      injectSignal: vi.fn(async () => snapshot),
      stepNetwork: vi.fn(async () => stepTrace),
      resetNetwork: vi.fn(async () => snapshot),
    },
  };
});

import { neuralApi } from "./services/neuralApi";

describe("App observatory 0.5", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(neuralApi.hasConfiguredBackend).mockReturnValue(true);
  });

  it("renders five backend neurons and updates selection", async () => {
    const { container } = render(<App />);
    await waitFor(() => expect(screen.getByText("Backend Connected")).toBeInTheDocument());
    expect(container.querySelectorAll(".network-node")).toHaveLength(5);
    expect(container.querySelectorAll(".network-link")).toHaveLength(5);

    const node = container.querySelector('[aria-label^="Select NEURON-004"]');
    await userEvent.click(node as Element);
    expect(screen.getByText("NEURON-004")).toBeInTheDocument();
  });

  it("shows unavailable state and disables controls", async () => {
    vi.mocked(neuralApi.hasConfiguredBackend).mockReturnValue(false);
    const { container } = render(<App />);
    await waitFor(() => expect(screen.getByText("Backend Unavailable")).toBeInTheDocument());
    const weak = container.querySelector("button.btn-primary") as HTMLButtonElement;
    expect(weak.disabled).toBe(true);
  });

  it("steps through backend traces and builds timeline", async () => {
    const { container } = render(<App />);
    await waitFor(() => expect(screen.getByText("Backend Connected")).toBeInTheDocument());

    const step = Array.from(container.querySelectorAll("button.btn")).find((button) =>
      button.textContent?.includes("Step One Tick"),
    );
    await userEvent.click(step as HTMLButtonElement);

    await waitFor(() => expect(neuralApi.stepNetwork).toHaveBeenCalledTimes(1));
    expect(screen.getAllByText("Tick 1").length).toBeGreaterThan(0);
    expect(screen.getByText("+16 mV")).toBeInTheDocument();
    expect(container.querySelectorAll(".network-link-pulse")).toHaveLength(1);
  });

  it("does not replay the same propagation event id", async () => {
    const { container } = render(<App />);
    await waitFor(() => expect(screen.getByText("Backend Connected")).toBeInTheDocument());
    const step = Array.from(container.querySelectorAll("button.btn")).find((button) =>
      button.textContent?.includes("Step One Tick"),
    );

    await userEvent.click(step as HTMLButtonElement);
    await waitFor(() => expect(container.querySelectorAll(".network-link-pulse")).toHaveLength(1));

    // Same event id returned again should not stay as a fresh pulse after second apply with empty fresh set.
    vi.mocked(neuralApi.stepNetwork).mockResolvedValueOnce({
      ...stepTrace,
      tick: 2,
      firedNeuronIds: [],
      propagations: [
        {
          eventId: "evt-prop-1",
          sourceNeuronId: "NEURON-001",
          targetNeuronId: "NEURON-002",
          amountMv: 16,
        },
      ],
      network: { ...stepTrace.network, tick: 2 },
    });

    await userEvent.click(step as HTMLButtonElement);
    await waitFor(() => expect(neuralApi.stepNetwork).toHaveBeenCalledTimes(2));
    expect(container.querySelectorAll(".network-link-pulse")).toHaveLength(0);
  });

  it("run sequence never overlaps step requests", async () => {
    let inflight = 0;
    let maxInflight = 0;
    vi.mocked(neuralApi.stepNetwork).mockImplementation(async () => {
      inflight += 1;
      maxInflight = Math.max(maxInflight, inflight);
      await new Promise((resolve) => setTimeout(resolve, 30));
      inflight -= 1;
      return {
        ...stepTrace,
        tick: 1,
        firedNeuronIds: [],
        propagations: [],
        network: {
          ...snapshot,
          tick: 1,
          neurons: snapshot.neurons.map((neuron) => ({ ...neuron, tick: 1 })),
        },
      };
    });

    const { container } = render(<App />);
    await waitFor(() => expect(screen.getByText("Backend Connected")).toBeInTheDocument());
    const run = Array.from(container.querySelectorAll("button.btn")).find((button) =>
      button.textContent?.includes("Run Sequence"),
    );
    await userEvent.click(run as HTMLButtonElement);
    await waitFor(() => expect(neuralApi.stepNetwork).toHaveBeenCalled(), { timeout: 2000 });
    await waitFor(() => expect(inflight).toBe(0), { timeout: 3000 });
    expect(maxInflight).toBe(1);
  });

  it("reset clears timeline only after backend success", async () => {
    const { container } = render(<App />);
    await waitFor(() => expect(screen.getByText("Backend Connected")).toBeInTheDocument());
    const step = Array.from(container.querySelectorAll("button.btn")).find((button) =>
      button.textContent?.includes("Step One Tick"),
    );
    await userEvent.click(step as HTMLButtonElement);
    await waitFor(() => expect(screen.getAllByText("Tick 1").length).toBeGreaterThan(0));

    const reset = Array.from(container.querySelectorAll("button.btn")).find((button) =>
      button.textContent?.includes("Reset Network"),
    );
    await userEvent.click(reset as HTMLButtonElement);
    await waitFor(() => expect(neuralApi.resetNetwork).toHaveBeenCalled());
    expect(screen.queryAllByText("Tick 1")).toHaveLength(0);
  });
});

