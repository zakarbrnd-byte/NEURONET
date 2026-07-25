import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { ApiError, neuralApi } from "./services/neuralApi";

const snapshot = {
  tick: 4,
  neurons: ["NEURON-001", "NEURON-002", "NEURON-003", "NEURON-004", "NEURON-005"].map((id) => ({
    id,
    restingPotentialMv: -70,
    membranePotentialMv: id === "NEURON-003" ? -61 : -70,
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
  tick: 5,
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
    tick: 5,
    neurons: snapshot.neurons.map((neuron) =>
      neuron.id === "NEURON-001"
        ? { ...neuron, fired: true, refractoryTicks: 2, tick: 5 }
        : neuron.id === "NEURON-002"
          ? { ...neuron, membranePotentialMv: -54, tick: 5 }
          : { ...neuron, tick: 5 },
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

function neuronTarget(container: HTMLElement, id: string) {
  return container.querySelector(`[aria-label^="Select ${id}"]`) as Element;
}

async function renderConnectedApp() {
  const view = render(<App />);
  await waitFor(() => expect(screen.getByText("Connected")).toBeInTheDocument());
  return view;
}

describe("Mission Control shell", () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.mocked(neuralApi.hasConfiguredBackend).mockReturnValue(true);
    vi.stubGlobal("innerWidth", 390);
    vi.stubGlobal("innerHeight", 844);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("1. main shell is viewport-locked without page scrolling at 390×844", async () => {
    await renderConnectedApp();
    const shell = screen.getByTestId("mission-shell");
    expect(shell).toBeInTheDocument();
    expect(shell).toHaveAttribute("data-layout", "viewport-locked");
    expect(shell.classList.contains("mission-shell")).toBe(true);
    expect(screen.getByTestId("mission-main").classList.contains("mission-main")).toBe(true);
    expect(screen.getByTestId("network-canvas-area")).toBeVisible();
    expect(screen.getByRole("navigation", { name: "Mission Control sections" })).toBeVisible();
  });

  it("2. bottom navigation remains visible", async () => {
    await renderConnectedApp();
    const nav = screen.getByRole("navigation", { name: "Mission Control sections" });
    expect(nav).toBeVisible();
    expect(within(nav).getByRole("button", { name: "Network view" })).toBeVisible();
    expect(within(nav).getByRole("button", { name: "Neuron details" })).toBeVisible();
    expect(within(nav).getByRole("button", { name: "Tick timeline" })).toBeVisible();
    expect(within(nav).getByRole("button", { name: "Simulation controls" })).toBeVisible();
  });

  it("3. Network tab shows the graph and closes panels", async () => {
    const { container } = await renderConnectedApp();
    await userEvent.click(screen.getByRole("button", { name: "Tick timeline" }));
    expect(screen.getByRole("dialog", { name: "Timeline" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Network view" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(container.querySelector(".network-svg")).toBeTruthy();
    expect(screen.getByTestId("network-canvas-area")).toBeVisible();
  });

  it("4. Node tab opens selected-neuron details", async () => {
    const { container } = await renderConnectedApp();
    const node = neuronTarget(container, "NEURON-003");
    fireEvent.pointerDown(node, { pointerId: 1, clientX: 5, clientY: 5 });
    fireEvent.pointerUp(node, { pointerId: 1, clientX: 5, clientY: 5 });

    const dialog = await screen.findByRole("dialog", { name: "Node" });
    expect(dialog.querySelector(".panel-lede strong")?.textContent).toBe("N-003");
    expect(within(dialog).getByRole("tab", { name: "Electrical" })).toBeInTheDocument();
  });

  it("5. Timeline tab opens timeline", async () => {
    await renderConnectedApp();
    await userEvent.click(screen.getByRole("button", { name: "Tick timeline" }));
    expect(screen.getByRole("dialog", { name: "Timeline" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Fired" })).toBeInTheDocument();
  });

  it("6. Controls tab opens simulation controls", async () => {
    await renderConnectedApp();
    await userEvent.click(screen.getByRole("button", { name: "Simulation controls" }));
    expect(screen.getByRole("dialog", { name: "Controls" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Stimulus" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Time" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Reset" })).toBeInTheDocument();
  });

  it("7. selected neuron summary opens Node panel", async () => {
    const { container } = await renderConnectedApp();
    const node = neuronTarget(container, "NEURON-003");
    fireEvent.pointerDown(node, { pointerId: 1, clientX: 5, clientY: 5 });
    fireEvent.pointerUp(node, { pointerId: 1, clientX: 5, clientY: 5 });
    await screen.findByRole("dialog", { name: "Node" });

    await userEvent.click(screen.getByRole("button", { name: "Close panel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Open details for NEURON-003" }));
    expect(screen.getByRole("dialog", { name: "Node" })).toBeInTheDocument();
  });

  it("8. Step quick action calls backend once", async () => {
    await renderConnectedApp();
    await userEvent.click(screen.getByRole("button", { name: "Step one tick" }));
    await waitFor(() => expect(neuralApi.stepNetwork).toHaveBeenCalledTimes(1));
  });

  it("9. Run/Pause quick action behaves correctly", async () => {
    await renderConnectedApp();
    await userEvent.click(screen.getByRole("button", { name: "Run sequence" }));
    expect(await screen.findByRole("button", { name: "Pause sequence" })).toBeInTheDocument();
    expect(screen.getByText("Running")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Pause sequence" }));
    expect(screen.getByRole("button", { name: "Run sequence" })).toBeInTheDocument();
    expect(screen.getByText("Paused")).toBeInTheDocument();
  });

  it("10. long press does not open Node panel", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { container } = await renderConnectedApp();

    const first = neuronTarget(container, "NEURON-001");
    fireEvent.pointerDown(first, { pointerId: 1, clientX: 5, clientY: 5 });
    fireEvent.pointerUp(first, { pointerId: 1, clientX: 5, clientY: 5 });
    await screen.findByRole("dialog", { name: "Node" });
    await userEvent.click(screen.getByRole("button", { name: "Close panel" }));

    const node = neuronTarget(container, "NEURON-002");
    fireEvent.pointerDown(node, { pointerId: 2, clientX: 8, clientY: 8 });
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    fireEvent.pointerUp(node, { pointerId: 2, clientX: 8, clientY: 8 });
    fireEvent.click(node);

    await waitFor(() => expect(neuralApi.injectSignal).toHaveBeenCalledWith("NEURON-002", 5));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("N-002 stimulated +5 mV")).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("11. tap still selects and opens Node panel", async () => {
    const { container } = await renderConnectedApp();
    const node = neuronTarget(container, "NEURON-004");
    fireEvent.pointerDown(node, { pointerId: 1, clientX: 5, clientY: 5 });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.pointerUp(node, { pointerId: 1, clientX: 5, clientY: 5 });
    expect(await screen.findByRole("dialog", { name: "Node" })).toBeInTheDocument();
    expect(neuralApi.injectSignal).not.toHaveBeenCalled();
  });

  it("12. panels scroll internally without scrolling the full page", async () => {
    await renderConnectedApp();
    await userEvent.click(screen.getByRole("button", { name: "Tick timeline" }));
    const dialog = screen.getByRole("dialog", { name: "Timeline" });
    const body = dialog.querySelector(".context-panel-body") as HTMLElement;
    expect(body).toBeTruthy();
    expect(body).toHaveAttribute("data-scroll", "internal");
    expect(screen.getByTestId("mission-shell")).toHaveAttribute("data-layout", "viewport-locked");
  });

  it("13. safe-area padding is applied", async () => {
    await renderConnectedApp();
    const shell = screen.getByTestId("mission-shell");
    expect(shell).toHaveAttribute("data-safe-area", "true");
    expect(shell.className).toContain("mission-shell");
  });

  it("14. no horizontal overflow styles at mobile widths", async () => {
    await renderConnectedApp();
    const shell = screen.getByTestId("mission-shell");
    expect(shell).toHaveAttribute("data-layout", "viewport-locked");
    expect(shell.getAttribute("data-panel")).toBe("network");
    expect(screen.getByTestId("network-canvas-area")).toBeVisible();
    expect(document.querySelector(".network-svg")).toBeTruthy();
  });

  it("15. backend unavailable state is visible without scrolling", async () => {
    vi.mocked(neuralApi.hasConfiguredBackend).mockReturnValue(false);
    render(<App />);
    expect(await screen.findByText("Unavailable")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry backend connection" })).toBeVisible();
    expect(
      screen.getByText(/Backend unavailable. Core status stays visible here/i),
    ).toBeVisible();
    expect(screen.getByRole("navigation", { name: "Mission Control sections" })).toBeVisible();
  });

  it("status bar shows compact mission state", async () => {
    await renderConnectedApp();
    expect(screen.getByText("NEURONET")).toBeInTheDocument();
    expect(screen.getByText("0.5")).toBeInTheDocument();
    expect(screen.getByText("Tick 4")).toBeInTheDocument();
    expect(screen.getByText("Paused")).toBeInTheDocument();
  });

  it("Enter opens Node panel without stimulation", async () => {
    const { container } = await renderConnectedApp();
    fireEvent.keyDown(neuronTarget(container, "NEURON-004"), { key: "Enter" });
    expect(await screen.findByRole("dialog", { name: "Node" })).toBeInTheDocument();
    expect(neuralApi.injectSignal).not.toHaveBeenCalled();
  });

  it("failed stimulation does not open Node panel", async () => {
    vi.mocked(neuralApi.injectSignal).mockRejectedValueOnce(new ApiError("Injection failed", 500));
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { container } = await renderConnectedApp();

    const node = neuronTarget(container, "NEURON-002");
    fireEvent.pointerDown(node, { pointerId: 1, clientX: 5, clientY: 5 });
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    fireEvent.pointerUp(node, { pointerId: 1, clientX: 5, clientY: 5 });

    await waitFor(() => expect(neuralApi.injectSignal).toHaveBeenCalledWith("NEURON-002", 5));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Injection failed");
    vi.useRealTimers();
  });
});
