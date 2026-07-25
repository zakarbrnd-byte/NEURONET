import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { neuralApi } from "./services/neuralApi";

const snapshot = {
  tick: 6,
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
  tick: 7,
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
    tick: 7,
    neurons: snapshot.neurons.map((neuron) =>
      neuron.id === "NEURON-001"
        ? { ...neuron, fired: true, refractoryTicks: 2, tick: 7 }
        : neuron.id === "NEURON-002"
          ? { ...neuron, membranePotentialMv: -54, tick: 7 }
          : { ...neuron, tick: 7 },
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

describe("Mission Control page", () => {
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

  it("1. App renders MissionControl", async () => {
    await renderConnectedApp();
    expect(screen.getByTestId("mission-control")).toHaveAttribute("data-page", "mission-control");
    expect(screen.getByTestId("layout-revision-marker")).toHaveTextContent(
      "Mission Control UI · Layout Revision 1",
    );
  });

  it("2. old long debug page is no longer rendered", async () => {
    await renderConnectedApp();
    expect(screen.queryByText("Network Summary")).not.toBeInTheDocument();
    expect(screen.queryByText("What Happened This Tick?")).not.toBeInTheDocument();
    expect(screen.queryByText("Tick Timeline")).not.toBeInTheDocument();
    expect(screen.queryByText("Backend Events")).not.toBeInTheDocument();
    expect(document.querySelector(".page")).toBeNull();
  });

  it("3–8. viewport regions are visible without page scroll chrome", async () => {
    await renderConnectedApp();
    const root = screen.getByTestId("mission-control");
    expect(root).toHaveAttribute("data-layout", "viewport-locked");
    expect(screen.getByTestId("mission-control-header")).toBeVisible();
    expect(screen.getByTestId("network-viewport")).toBeVisible();
    expect(screen.getByTestId("selected-neuron-strip")).toBeVisible();
    expect(screen.getByTestId("quick-action-bar")).toBeVisible();
    expect(screen.getByTestId("bottom-navigation")).toBeVisible();
    expect(screen.getByText("Tap: Inspect · Hold: Stimulate +5 mV")).toBeVisible();
  });

  it("9. Node tab opens Node sheet", async () => {
    await renderConnectedApp();
    await userEvent.click(screen.getByRole("button", { name: "Neuron details" }));
    expect(screen.getByRole("dialog", { name: "Node" })).toBeInTheDocument();
  });

  it("10. Timeline tab opens Timeline sheet", async () => {
    await renderConnectedApp();
    await userEvent.click(screen.getByRole("button", { name: "Tick timeline" }));
    expect(screen.getByRole("dialog", { name: "Timeline" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Firing" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Propagation" })).toBeInTheDocument();
  });

  it("11. Controls tab opens Controls sheet", async () => {
    await renderConnectedApp();
    await userEvent.click(screen.getByRole("button", { name: "Simulation controls" }));
    expect(screen.getByRole("dialog", { name: "Controls" })).toBeInTheDocument();
  });

  it("12. Network tab closes detail sheets", async () => {
    await renderConnectedApp();
    await userEvent.click(screen.getByRole("button", { name: "Tick timeline" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Network view" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("13. bottom sheet scrolls internally", async () => {
    await renderConnectedApp();
    await userEvent.click(screen.getByRole("button", { name: "Simulation controls" }));
    const dialog = screen.getByRole("dialog", { name: "Controls" });
    expect(dialog.querySelector('[data-scroll="internal"]')).toBeTruthy();
  });

  it("14. body remains overflow hidden via Mission Control layout contract", async () => {
    await renderConnectedApp();
    expect(screen.getByTestId("mission-control")).toHaveAttribute("data-layout", "viewport-locked");
    expect(screen.getByTestId("mission-control")).toHaveAttribute("data-safe-area", "true");
  });

  it("15. long press does not open Node sheet", async () => {
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
    vi.useRealTimers();
  });

  it("16. short tap opens Node sheet after pointer release", async () => {
    const { container } = await renderConnectedApp();
    const node = neuronTarget(container, "NEURON-004");
    fireEvent.pointerDown(node, { pointerId: 1, clientX: 5, clientY: 5 });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.pointerUp(node, { pointerId: 1, clientX: 5, clientY: 5 });
    expect(await screen.findByRole("dialog", { name: "Node" })).toBeInTheDocument();
    expect(neuralApi.injectSignal).not.toHaveBeenCalled();
  });

  it("17. SVG text cannot receive pointer events", async () => {
    const { container } = await renderConnectedApp();
    const texts = container.querySelectorAll(
      ".network-node-id, .network-node-mv, .network-state-mark",
    );
    expect(texts.length).toBeGreaterThan(0);
    texts.forEach((text) => {
      expect(text.getAttribute("pointer-events")).toBe("none");
    });
  });

  it("18. Step calls backend once", async () => {
    await renderConnectedApp();
    await userEvent.click(screen.getByRole("button", { name: "Step one tick" }));
    await waitFor(() => expect(neuralApi.stepNetwork).toHaveBeenCalledTimes(1));
  });

  it("19. Run and Pause work", async () => {
    await renderConnectedApp();
    await userEvent.click(screen.getByRole("button", { name: "Run sequence" }));
    expect(await screen.findByRole("button", { name: "Pause sequence" })).toBeInTheDocument();
    expect(screen.getByText("Running")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Pause sequence" }));
    expect(screen.getByRole("button", { name: "Run sequence" })).toBeInTheDocument();
    expect(screen.getByText("Paused")).toBeInTheDocument();
  });

  it("20. Reset calls backend", async () => {
    await renderConnectedApp();
    await userEvent.click(screen.getByRole("button", { name: "Reset network" }));
    await waitFor(() => expect(neuralApi.resetNetwork).toHaveBeenCalledTimes(1));
  });

  it("21. backend unavailable state remains visible without page scrolling", async () => {
    vi.mocked(neuralApi.hasConfiguredBackend).mockReturnValue(false);
    render(<App />);
    expect(await screen.findByText("Unavailable")).toBeInTheDocument();
    expect(screen.getByTestId("mission-control-header")).toBeVisible();
    expect(screen.getByTestId("bottom-navigation")).toBeVisible();
    expect(screen.getByTestId("layout-revision-marker")).toBeVisible();
  });

  it("22. no horizontal overflow contract at mobile widths", async () => {
    for (const [width, height] of [
      [375, 667],
      [390, 844],
      [430, 932],
    ] as const) {
      vi.stubGlobal("innerWidth", width);
      vi.stubGlobal("innerHeight", height);
      const { unmount } = await renderConnectedApp();
      const root = screen.getByTestId("mission-control");
      expect(root).toHaveAttribute("data-layout", "viewport-locked");
      expect(root.classList.contains("mission-control")).toBe(true);
      unmount();
    }
  });

  it("selected neuron strip opens Node sheet", async () => {
    const { container } = await renderConnectedApp();
    const node = neuronTarget(container, "NEURON-003");
    fireEvent.pointerDown(node, { pointerId: 1, clientX: 5, clientY: 5 });
    fireEvent.pointerUp(node, { pointerId: 1, clientX: 5, clientY: 5 });
    await screen.findByRole("dialog", { name: "Node" });
    await userEvent.click(screen.getByRole("button", { name: "Close panel" }));
    await userEvent.click(screen.getByRole("button", { name: "Open details for NEURON-003" }));
    expect(screen.getByRole("dialog", { name: "Node" })).toBeInTheDocument();
  });

  it("status bar shows compact mission state", async () => {
    await renderConnectedApp();
    const header = screen.getByTestId("mission-control-header");
    expect(within(header).getByText("NEURONET")).toBeInTheDocument();
    expect(within(header).getByText("0.5")).toBeInTheDocument();
    expect(within(header).getByText("Tick 6")).toBeInTheDocument();
    expect(within(header).getByText("Paused")).toBeInTheDocument();
  });
});
