import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { neuralApi } from "./services/neuralApi";

const POSITIONS: Record<string, { x: number; y: number }> = {
  "NEURON-001": { x: 0.12, y: 0.5 },
  "NEURON-002": { x: 0.32, y: 0.5 },
  "NEURON-003": { x: 0.6, y: 0.28 },
  "NEURON-004": { x: 0.6, y: 0.72 },
  "NEURON-005": { x: 0.88, y: 0.5 },
};

function makeNeuron(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    restingPotentialMv: -70,
    membranePotentialMv: id === "NEURON-003" ? -61 : -70,
    thresholdMv: -55,
    energy: 100,
    fatigue: 0,
    refractoryTicks: 0,
    fired: false,
    tick: 0,
    position: POSITIONS[id],
    region: "Observatory Cortex",
    layer: id === "NEURON-005" ? 3 : id === "NEURON-003" || id === "NEURON-004" ? 2 : 1,
    cellType: id === "NEURON-004" ? ("inhibitory" as const) : ("excitatory" as const),
    dnaId: id.replace("NEURON-", "DNA-"),
    somaRadius: 0.035,
    dendriteRadius: 0.09,
    axonLength: 0.22,
    ...overrides,
  };
}

const snapshot = {
  tick: 6,
  tissue: {
    label: "Artificial Neural Tissue",
    region: "Observatory Cortex",
    alive: true,
    cellCount: 5,
    synapseCount: 5,
    ageSeconds: 12,
  },
  neurons: [
    "NEURON-001",
    "NEURON-002",
    "NEURON-003",
    "NEURON-004",
    "NEURON-005",
  ].map((id) => makeNeuron(id)),
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
      connectionType: "inhibitory" as const,
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
      getHealth: vi.fn(async () => ({ status: "ok", version: "0.6A", ageSeconds: 12 })),
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
    vi.clearAllMocks();
    vi.mocked(neuralApi.hasConfiguredBackend).mockReturnValue(true);
    vi.mocked(neuralApi.getHealth).mockResolvedValue({
      status: "ok",
      version: "0.6A",
      ageSeconds: 12,
    });
    vi.mocked(neuralApi.getNetwork).mockResolvedValue(snapshot);
    vi.mocked(neuralApi.getEvents).mockResolvedValue([]);
    vi.mocked(neuralApi.injectSignal).mockImplementation(async (id: string, amountMv: number) => ({
      ...snapshot,
      neurons: snapshot.neurons.map((neuron) =>
        neuron.id === id ? { ...neuron, membranePotentialMv: -70 + amountMv } : neuron,
      ),
    }));
    vi.mocked(neuralApi.stepNetwork).mockResolvedValue(stepTrace);
    vi.mocked(neuralApi.resetNetwork).mockResolvedValue(snapshot);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders MissionControl as the sole app layout", async () => {
    await renderConnectedApp();
    expect(screen.getByTestId("mission-control")).toHaveAttribute("data-page", "mission-control");
    expect(screen.getByTestId("layout-revision-marker")).toHaveTextContent(
      "Mission Control UI · Layout Revision 1",
    );
    expect(screen.queryByText("Network Summary")).not.toBeInTheDocument();
    expect(screen.queryByText("How to read this screen")).not.toBeInTheDocument();
  });

  it("keeps the one-screen shell regions visible without page scrolling", async () => {
    await renderConnectedApp();
    const root = screen.getByTestId("mission-control");
    expect(root).toHaveAttribute("data-layout", "viewport-locked");
    expect(screen.getByTestId("mission-control-header")).toBeVisible();
    expect(screen.getByTestId("network-viewport")).toBeVisible();
    expect(screen.getByTestId("selected-neuron-strip")).toBeVisible();
    expect(screen.getByTestId("quick-action-bar")).toBeVisible();
    expect(screen.getByTestId("bottom-navigation")).toBeVisible();
    expect(root).toHaveAttribute("data-layout", "viewport-locked");
  });

  it("shows Artificial Neural Tissue header stats", async () => {
    await renderConnectedApp();
    expect(screen.getByTestId("tissue-label")).toHaveTextContent("Artificial Neural Tissue");
    const stats = screen.getByTestId("tissue-stats");
    expect(stats).toHaveTextContent("Alive");
    expect(stats).toHaveTextContent("Cells 5");
    expect(stats).toHaveTextContent("Synapses 5");
    expect(stats).toHaveTextContent("Observatory Cortex");
    expect(stats).toHaveTextContent("Age");
    expect(within(screen.getByTestId("mission-control-header")).getByText("0.6A")).toBeInTheDocument();
  });

  it("opens Node, Timeline, and Controls sheets from bottom navigation", async () => {
    const user = userEvent.setup();
    await renderConnectedApp();

    await user.click(screen.getByRole("button", { name: "Tick timeline" }));
    expect(await screen.findByRole("dialog", { name: "Timeline" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Simulation controls" }));
    expect(await screen.findByRole("dialog", { name: "Controls" })).toBeVisible();
    await user.click(screen.getByRole("tab", { name: "Reset" }));
    expect(screen.getByText("What is Tissue View?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Network view" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("switches to Tissue view with five fixed backend cells", async () => {
    const user = userEvent.setup();
    await renderConnectedApp();

    await user.click(screen.getByRole("button", { name: "Tissue view" }));
    expect(await screen.findByTestId("tissue-view")).toBeVisible();
    expect(screen.getByTestId("network-viewport")).toHaveAttribute("data-main-view", "tissue");
    expect(screen.getByTestId("tissue-cell-NEURON-001")).toBeInTheDocument();
    expect(screen.getByTestId("tissue-cell-NEURON-002")).toBeInTheDocument();
    expect(screen.getByTestId("tissue-cell-NEURON-003")).toBeInTheDocument();
    expect(screen.getByTestId("tissue-cell-NEURON-004")).toHaveAttribute(
      "data-cell-type",
      "inhibitory",
    );
    expect(screen.getByTestId("tissue-cell-NEURON-005")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Network view" }));
    await waitFor(() => {
      expect(screen.queryByTestId("tissue-view")).not.toBeInTheDocument();
    });
    expect(screen.getByTestId("network-viewport")).toHaveAttribute("data-main-view", "network");
  });

  it("shows Biology fields in the Node sheet", async () => {
    const user = userEvent.setup();
    const { container } = await renderConnectedApp();
    const target = neuronTarget(container, "NEURON-004");
    fireEvent.pointerDown(target, { pointerId: 3, button: 0, clientX: 10, clientY: 10 });
    fireEvent.pointerUp(target, { pointerId: 3, button: 0, clientX: 10, clientY: 10 });

    expect(await screen.findByRole("dialog", { name: "Node" })).toBeVisible();
    await user.click(screen.getByRole("tab", { name: "Biology" }));
    expect(screen.getByText("DNA-004")).toBeInTheDocument();
    expect(screen.getByText("inhibitory")).toBeInTheDocument();
    expect(screen.getByText(/x=0\.60, y=0\.72/)).toBeInTheDocument();
  });

  it("keeps body overflow hidden while a sheet scrolls internally", async () => {
    const user = userEvent.setup();
    await renderConnectedApp();
    await user.click(screen.getByRole("button", { name: "Tick timeline" }));
    const dialog = await screen.findByRole("dialog", { name: "Timeline" });
    expect(screen.getByTestId("mission-control")).toHaveAttribute(
      "data-layout",
      "viewport-locked",
    );
    expect(dialog.querySelector(".context-panel-body")).toBeTruthy();
  });

  it("opens Node after a short tap and does not stimulate", async () => {
    const { container } = await renderConnectedApp();
    const target = neuronTarget(container, "NEURON-001");

    fireEvent.pointerDown(target, { pointerId: 1, button: 0, clientX: 10, clientY: 10 });
    fireEvent.pointerUp(target, { pointerId: 1, button: 0, clientX: 10, clientY: 10 });

    expect(await screen.findByRole("dialog", { name: "Node" })).toBeVisible();
    expect(neuralApi.injectSignal).not.toHaveBeenCalled();
  });

  it("long-press stimulates without opening the Node sheet", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<App />);
    await act(async () => {
      await Promise.resolve();
    });
    await waitFor(() => expect(screen.getByText("Connected")).toBeInTheDocument());

    const target = neuronTarget(document.body, "NEURON-002");
    fireEvent.pointerDown(target, { pointerId: 2, button: 0, clientX: 20, clientY: 20 });
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    fireEvent.pointerUp(target, { pointerId: 2, button: 0, clientX: 20, clientY: 20 });
    fireEvent.click(target);

    await waitFor(() => expect(neuralApi.injectSignal).toHaveBeenCalledWith("NEURON-002", 5));
    expect(screen.queryByRole("dialog", { name: "Node" })).not.toBeInTheDocument();
  });

  it("Step calls backend once; Run and Pause toggle sequence; Reset calls backend", async () => {
    const user = userEvent.setup();
    await renderConnectedApp();

    await user.click(screen.getByRole("button", { name: "Step one tick" }));
    await waitFor(() => expect(neuralApi.stepNetwork).toHaveBeenCalledTimes(1));

    await user.click(screen.getByRole("button", { name: "Run sequence" }));
    expect(screen.getByText("Running")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Pause sequence" }));
    expect(screen.getByText("Paused")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reset network" }));
    await waitFor(() => expect(neuralApi.resetNetwork).toHaveBeenCalledTimes(1));
  });

  it("shows unavailable state in the shell without requiring scroll", async () => {
    vi.mocked(neuralApi.getHealth).mockRejectedValue(new Error("offline"));
    vi.mocked(neuralApi.getNetwork).mockRejectedValue(new Error("offline"));
    render(<App />);
    await waitFor(() => expect(screen.getByText("Unavailable")).toBeInTheDocument());
    expect(screen.getByTestId("mission-control")).toHaveAttribute("data-layout", "viewport-locked");
    expect(screen.getByTestId("mission-control-header")).toBeVisible();
    expect(screen.getByRole("button", { name: "Retry backend connection" })).toBeVisible();
  });

  it("keeps network viewport free of horizontal overflow at phone widths", async () => {
    await renderConnectedApp();
    const root = screen.getByTestId("mission-control");
    expect(root.classList.contains("mission-control")).toBe(true);
    for (const width of [375, 390, 430]) {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
      window.dispatchEvent(new Event("resize"));
      const viewport = screen.getByTestId("network-viewport");
      expect(viewport).toBeVisible();
    }
  });

  it("shows connection and tick in the compact header", async () => {
    await renderConnectedApp();
    const header = screen.getByTestId("mission-control-header");
    expect(within(header).getByText("0.6A")).toBeInTheDocument();
    expect(within(header).getByText("Connected")).toBeInTheDocument();
    expect(within(header).getByText("Tick 6")).toBeInTheDocument();
    expect(within(header).getByText("Paused")).toBeInTheDocument();
  });
});
