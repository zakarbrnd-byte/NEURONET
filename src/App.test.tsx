import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const snapshot = {
  tick: 0,
  neurons: [
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
      membranePotentialMv: -70,
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
  ],
  connections: [
    {
      id: "CONNECTION-001",
      sourceNeuronId: "NEURON-001",
      targetNeuronId: "NEURON-002",
      weight: 5,
      connectionType: "excitatory" as const,
    },
    {
      id: "CONNECTION-002",
      sourceNeuronId: "NEURON-002",
      targetNeuronId: "NEURON-003",
      weight: 5,
      connectionType: "excitatory" as const,
    },
  ],
};

const events = [
  {
    id: "evt-1",
    timestamp: "2026-07-25T00:00:00.000Z",
    networkTick: 0,
    type: "network_ready",
    message: "Deterministic three-neuron network ready",
  },
];

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
      getHealth: vi.fn(async () => ({ status: "ok", version: "0.4" })),
      getNetwork: vi.fn(async () => snapshot),
      getEvents: vi.fn(async () => events),
      injectSignal: vi.fn(async () => ({
        ...snapshot,
        neurons: snapshot.neurons.map((n) =>
          n.id === "NEURON-001" ? { ...n, membranePotentialMv: -65 } : n,
        ),
      })),
      stepNetwork: vi.fn(async () => ({ ...snapshot, tick: 1 })),
      resetNetwork: vi.fn(async () => snapshot),
    },
  };
});

import { neuralApi } from "./services/neuralApi";

describe("App observatory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(neuralApi.hasConfiguredBackend).mockReturnValue(true);
  });

  it("renders three backend neurons and updates selection", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Backend Connected")).toBeInTheDocument();
    });

    expect(screen.getByLabelText("Select NEURON-001")).toBeInTheDocument();
    expect(screen.getByLabelText("Select NEURON-002")).toBeInTheDocument();
    expect(screen.getByLabelText("Select NEURON-003")).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText("Select NEURON-002"));
    expect(screen.getByText("NEURON-002")).toBeInTheDocument();
  });

  it("shows backend unavailable when no API is configured", async () => {
    vi.mocked(neuralApi.hasConfiguredBackend).mockReturnValue(false);
    const { container } = render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Backend Unavailable")).toBeInTheDocument();
    });
    const weak = container.querySelector("button.btn-primary") as HTMLButtonElement | null;
    expect(weak?.textContent).toMatch(/Weak Signal/);
    expect(weak?.disabled).toBe(true);
  });

  it("calls backend APIs from controls", async () => {
    const { container } = render(<App />);
    await waitFor(() => expect(screen.getByText("Backend Connected")).toBeInTheDocument());

    const buttons = Array.from(container.querySelectorAll("button.btn"));
    const weak = buttons.find((button) => button.textContent?.includes("Weak Signal"));
    const step = buttons.find((button) => button.textContent?.includes("Next Network Tick"));
    const reset = buttons.find((button) => button.textContent?.includes("Reset Network"));

    await userEvent.click(weak as HTMLButtonElement);
    await waitFor(() => expect(neuralApi.injectSignal).toHaveBeenCalledWith("NEURON-001", 5));

    await userEvent.click(step as HTMLButtonElement);
    await waitFor(() => expect(neuralApi.stepNetwork).toHaveBeenCalled());

    await userEvent.click(reset as HTMLButtonElement);
    await waitFor(() => expect(neuralApi.resetNetwork).toHaveBeenCalled());
  });

  it("keeps mobile page width without horizontal overflow class issues", async () => {
    const { container } = render(<App />);
    await waitFor(() =>
      expect(container.querySelector(".banner-ok")?.textContent).toContain("Backend Connected"),
    );
    expect(container.querySelector(".page")).toBeTruthy();
    expect(container.querySelector(".network-svg-wrap")).toBeTruthy();
  });
});
