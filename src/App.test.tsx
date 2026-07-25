import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { ApiError, neuralApi } from "./services/neuralApi";

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
      getEvents: vi.fn(async () => [
        {
          id: "evt-inject",
          timestamp: "2026-07-25T00:00:00.000Z",
          networkTick: 0,
          type: "signal_injected",
          neuronId: "NEURON-002",
          amountMv: 5,
          message: "Injected +5 mV into NEURON-002",
        },
      ]),
      injectSignal: vi.fn(async (id: string, amountMv: number) => ({
        ...snapshot,
        neurons: snapshot.neurons.map((neuron) =>
          neuron.id === id ? { ...neuron, membranePotentialMv: -70 + amountMv } : neuron,
        ),
      })),
      stepNetwork: vi.fn(async () => stepTrace),
      resetNetwork: vi.fn(async () => snapshot),
    },
  };
});

describe("App observatory direct interaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(neuralApi.hasConfiguredBackend).mockReturnValue(true);
    vi.mocked(neuralApi.injectSignal).mockImplementation(async (id: string, amountMv: number) => ({
      ...snapshot,
      neurons: snapshot.neurons.map((neuron) =>
        neuron.id === id ? { ...neuron, membranePotentialMv: -70 + amountMv } : neuron,
      ),
    }));
  });

  it("1. normal tap opens the inspector and does not call injectSignal", async () => {
    const { container } = render(<App />);
    await waitFor(() => expect(screen.getByText("Backend Connected")).toBeInTheDocument());

    const node = container.querySelector('[aria-label^="Select NEURON-004"]') as Element;
    fireEvent.pointerDown(node, { pointerId: 1, clientX: 5, clientY: 5 });
    fireEvent.pointerUp(node, { pointerId: 1, clientX: 5, clientY: 5 });
    fireEvent.click(node);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Direct electrode-style stimulation")).toBeInTheDocument();
    expect(screen.getByText("NEURON-004")).toBeInTheDocument();
    expect(neuralApi.injectSignal).not.toHaveBeenCalled();
  });

  it("2–4. completed long press injects once, does not open inspector, and does not select", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { container } = render(<App />);
    await waitFor(() => expect(screen.getByText("Backend Connected")).toBeInTheDocument());

    // Pre-select another neuron via tap.
    const first = container.querySelector('[aria-label^="Select NEURON-001"]') as Element;
    fireEvent.pointerDown(first, { pointerId: 1, clientX: 5, clientY: 5 });
    fireEvent.pointerUp(first, { pointerId: 1, clientX: 5, clientY: 5 });
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("NEURON-001")).toBeInTheDocument();

    // Close inspector to make "does not open" unambiguous, selection stays NEURON-001.
    await userEvent.click(screen.getByRole("button", { name: "Close inspector" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    const node = container.querySelector('[aria-label^="Select NEURON-002"]') as Element;
    fireEvent.pointerDown(node, { pointerId: 2, clientX: 5, clientY: 5 });
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    fireEvent.pointerUp(node, { pointerId: 2, clientX: 5, clientY: 5 });
    fireEvent.click(node);

    await waitFor(() => expect(neuralApi.injectSignal).toHaveBeenCalledTimes(1));
    expect(neuralApi.injectSignal).toHaveBeenCalledWith("NEURON-002", 5);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("N-002 stimulated +5 mV")).toBeInTheDocument();
    expect(container.querySelector('[aria-label^="Select NEURON-002"]')?.classList.contains("flashed")).toBe(
      true,
    );
    // Previous selection styling remains on NEURON-001.
    expect(container.querySelector('[aria-label^="Select NEURON-001"]')?.classList.contains("selected")).toBe(
      true,
    );
    expect(container.querySelector('[aria-label^="Select NEURON-002"]')?.classList.contains("selected")).toBe(
      false,
    );

    vi.useRealTimers();
  });

  it("9. previously selected neuron remains selected after another neuron is long-pressed", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { container } = render(<App />);
    await waitFor(() => expect(screen.getByText("Backend Connected")).toBeInTheDocument());

    const first = container.querySelector('[aria-label^="Select NEURON-003"]') as Element;
    fireEvent.pointerDown(first, { pointerId: 1, clientX: 5, clientY: 5 });
    fireEvent.pointerUp(first, { pointerId: 1, clientX: 5, clientY: 5 });
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("NEURON-003")).toBeInTheDocument();

    const other = container.querySelector('[aria-label^="Select NEURON-005"]') as Element;
    fireEvent.pointerDown(other, { pointerId: 2, clientX: 8, clientY: 8 });
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    fireEvent.pointerUp(other, { pointerId: 2, clientX: 8, clientY: 8 });
    fireEvent.click(other);

    await waitFor(() => expect(neuralApi.injectSignal).toHaveBeenCalledWith("NEURON-005", 5));
    // Inspector still shows the originally selected neuron.
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("NEURON-003")).toBeInTheDocument();
    expect(screen.queryByText("NEURON-005")).not.toBeInTheDocument();
    expect(container.querySelector('[aria-label^="Select NEURON-003"]')?.classList.contains("selected")).toBe(
      true,
    );

    vi.useRealTimers();
  });

  it("10. failed stimulation does not open the inspector", async () => {
    vi.mocked(neuralApi.injectSignal).mockRejectedValueOnce(
      new ApiError("Injection failed", 500),
    );
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { container } = render(<App />);
    await waitFor(() => expect(screen.getByText("Backend Connected")).toBeInTheDocument());

    const node = container.querySelector('[aria-label^="Select NEURON-002"]') as Element;
    fireEvent.pointerDown(node, { pointerId: 1, clientX: 5, clientY: 5 });
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    fireEvent.pointerUp(node, { pointerId: 1, clientX: 5, clientY: 5 });
    fireEvent.click(node);

    await waitFor(() => expect(neuralApi.injectSignal).toHaveBeenCalledWith("NEURON-002", 5));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Injection failed");
    expect(screen.queryByText(/stimulated/i)).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it("8. Enter and Space open the inspector without stimulation", async () => {
    const { container } = render(<App />);
    await waitFor(() => expect(screen.getByText("Backend Connected")).toBeInTheDocument());

    const node = container.querySelector('[aria-label^="Select NEURON-004"]') as Element;
    fireEvent.keyDown(node, { key: "Enter" });

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("NEURON-004")).toBeInTheDocument();
    expect(neuralApi.injectSignal).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Close inspector" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    fireEvent.keyDown(node, { key: " " });
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(neuralApi.injectSignal).not.toHaveBeenCalled();
  });

  it("inspector strong stimulus calls the API", async () => {
    const { container } = render(<App />);
    await waitFor(() => expect(screen.getByText("Backend Connected")).toBeInTheDocument());

    const node = container.querySelector('[aria-label^="Select NEURON-002"]') as Element;
    fireEvent.pointerDown(node, { pointerId: 1, clientX: 5, clientY: 5 });
    fireEvent.pointerUp(node, { pointerId: 1, clientX: 5, clientY: 5 });

    await screen.findByRole("dialog");
    await userEvent.click(screen.getByRole("button", { name: "Strong Stimulus +20 mV" }));
    await waitFor(() => expect(neuralApi.injectSignal).toHaveBeenCalledWith("NEURON-002", 20));
  });

  it("shows unavailable state and disables step controls", async () => {
    vi.mocked(neuralApi.hasConfiguredBackend).mockReturnValue(false);
    const { container } = render(<App />);
    await waitFor(() => expect(screen.getByText("Backend Unavailable")).toBeInTheDocument());
    const step = Array.from(container.querySelectorAll("button.btn")).find((button) =>
      button.textContent?.includes("Step One Tick"),
    ) as HTMLButtonElement;
    expect(step.disabled).toBe(true);
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
  });
});
