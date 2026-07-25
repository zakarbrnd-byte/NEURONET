import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { neuralApi } from "./services/neuralApi";
import type { SynapseSnapshot } from "./types/neural";

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

function makeSynapse(
  id: string,
  sourceNeuronId: string,
  targetNeuronId: string,
  weight: number,
  type: "excitatory" | "inhibitory",
): SynapseSnapshot {
  return {
    id,
    sourceNeuronId,
    targetNeuronId,
    weight,
    type,
    usageCount: id === "SYNAPSE-001" ? 3 : 0,
    lastActivatedTick: id === "SYNAPSE-001" ? 4 : null,
    stability: 0.56,
    health: 0.93,
    age: 6,
    creationTick: 0,
    weightHistory: [
      { tick: 0, weight },
      ...(id === "SYNAPSE-001"
        ? [
            { tick: 2, weight: weight + 0.1 },
            { tick: 4, weight: weight + 0.2 },
          ]
        : []),
    ],
    lastWeightDelta: id === "SYNAPSE-001" ? 0.1 : 0,
    pruningRisk: 0,
    inactivityTicks: 0,
    lowWeightTicks: 0,
    lowHealthTicks: 0,
    protectedUntilTick: 10,
    pruningStatus: "protected" as const,
    pruningReasons: ["grace_period"],
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
  synapses: [
    makeSynapse("SYNAPSE-001", "NEURON-001", "NEURON-002", 16.2, "excitatory"),
    makeSynapse("SYNAPSE-002", "NEURON-002", "NEURON-003", 16, "excitatory"),
    makeSynapse("SYNAPSE-003", "NEURON-002", "NEURON-004", 16, "excitatory"),
    {
      ...makeSynapse("SYNAPSE-004", "NEURON-003", "NEURON-005", 8, "excitatory"),
      pruningStatus: "atRisk" as const,
      pruningRisk: 0.72,
      inactivityTicks: 20,
      lowWeightTicks: 4,
      lowHealthTicks: 3,
      protectedUntilTick: 10,
      pruningReasons: ["low_weight", "prolonged_inactivity"],
    },
    makeSynapse("SYNAPSE-005", "NEURON-004", "NEURON-005", 8, "inhibitory"),
  ],
  structural: {
    config: {
      enabled: true,
      evaluationIntervalTicks: 5,
      maxCandidateDistance: 0.55,
      minimumCoactivationScore: 2,
      candidateMaturationTicks: 3,
      pruningWeightThreshold: 6,
      pruningHealthThreshold: 0.55,
      pruningInactivityTicks: 12,
      pruningGraceTicks: 10,
      maxCandidates: 8,
    },
    growthCandidates: [
      {
        id: "CANDIDATE-NEURON-001-NEURON-005",
        sourceNeuronId: "NEURON-001",
        targetNeuronId: "NEURON-005",
        proposedConnectionType: "excitatory" as const,
        distance: 0.76,
        coactivationScore: 3.5,
        structuralCompatibility: 0.42,
        readiness: 0.61,
        status: "eligible" as const,
        createdTick: 10,
        lastEvaluatedTick: 15,
        maturationTicks: 1,
        supportingReasons: ["repeated_coactivation", "within_structural_reach"],
        blockingReasons: [],
      },
    ],
    latestEvaluationTick: 15,
    candidateCount: 1,
    atRiskSynapseCount: 1,
  },
};

const stepTrace = {
  tick: 7,
  firedNeuronIds: ["NEURON-001"],
  propagations: [
    {
      eventId: "evt-prop-1",
      synapseId: "SYNAPSE-001",
      sourceNeuronId: "NEURON-001",
      targetNeuronId: "NEURON-002",
      amountMv: 16.2,
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
    synapses: snapshot.synapses.map((synapse) =>
      synapse.id === "SYNAPSE-001"
        ? {
            ...synapse,
            usageCount: synapse.usageCount + 1,
            lastActivatedTick: 7,
            age: 7,
          }
        : { ...synapse, age: 7 },
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
      getHealth: vi.fn(async () => ({ status: "ok", version: "0.6C", ageSeconds: 12 })),
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
      version: "0.6C",
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
    expect(screen.getByTestId("layout-revision-marker")).toHaveTextContent("Version 0.6C");
  });

  it("opens Synapse Inspector when a connection is selected", async () => {
    const user = userEvent.setup();
    await renderConnectedApp();
    await user.click(screen.getByLabelText("Inspect synapse SYNAPSE-001"));
    expect(await screen.findByRole("dialog", { name: "Synapse" })).toBeVisible();
    expect(screen.getByTestId("synapse-panel")).toHaveTextContent("16.20 mV");
    expect(screen.getByTestId("synapse-panel")).toHaveTextContent("Usage");
    expect(screen.getByTestId("synapse-panel")).toHaveTextContent("3");
    expect(screen.getByTestId("synapse-panel")).toHaveTextContent("Health");
    expect(screen.getByTestId("synapse-panel")).toHaveTextContent("Last Used");
    expect(screen.getByText("Weight history")).toBeInTheDocument();
  });

  it("keeps Network and Tissue tabs working with synapses", async () => {
    const user = userEvent.setup();
    await renderConnectedApp();
    expect(screen.getByTestId("network-synapse-SYNAPSE-001")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tissue view" }));
    expect(await screen.findByTestId("tissue-view")).toBeVisible();
    expect(screen.getByTestId("tissue-synapse-SYNAPSE-005")).toBeInTheDocument();
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

  it("shows connection and tick in the compact header", async () => {
    await renderConnectedApp();
    const header = screen.getByTestId("mission-control-header");
    expect(within(header).getByText("0.6C")).toBeInTheDocument();
    expect(within(header).getByText("Connected")).toBeInTheDocument();
    expect(within(header).getByText("Tick 6")).toBeInTheDocument();
  });

  it("exposes Development display mode with distinct candidate paths from backend data", async () => {
    const user = userEvent.setup();
    await renderConnectedApp();
    await user.click(screen.getByRole("button", { name: "Tissue view" }));
    expect(screen.getByTestId("tissue-display-mode")).toBeInTheDocument();
    await user.click(screen.getByTestId("tissue-mode-development"));
    expect(screen.getByTestId("tissue-view")).toHaveAttribute(
      "data-display-mode",
      "development",
    );
    const candidate = screen.getByTestId(
      "tissue-candidate-CANDIDATE-NEURON-001-NEURON-005",
    );
    expect(candidate).toBeInTheDocument();
    expect(candidate.querySelector(".tissue-candidate-path")).toHaveAttribute(
      "stroke-dasharray",
    );
    expect(screen.getByTestId("tissue-synapse-SYNAPSE-001")).toBeInTheDocument();
    expect(screen.getByTestId("tissue-development-legend")).toHaveTextContent(
      "Dashed path: growth candidate",
    );
  });

  it("opens Growth Candidate inspector without a create button", async () => {
    const user = userEvent.setup();
    await renderConnectedApp();
    await user.click(screen.getByRole("button", { name: "Tissue view" }));
    await user.click(screen.getByTestId("tissue-mode-development"));
    await user.click(
      screen.getByLabelText("Inspect growth candidate CANDIDATE-NEURON-001-NEURON-005"),
    );
    expect(await screen.findByRole("dialog", { name: "Growth Candidate" })).toBeVisible();
    expect(screen.getByTestId("growth-candidate-panel")).toHaveTextContent("Readiness");
    expect(screen.getByTestId("candidate-readiness")).toHaveTextContent("61%");
    expect(screen.getByTestId("candidate-supporting-reasons")).toHaveTextContent(
      "repeated coactivation",
    );
    expect(screen.getByTestId("candidate-observe-only")).toHaveTextContent(
      "does not create synapses",
    );
    expect(screen.queryByRole("button", { name: /create synapse/i })).not.toBeInTheDocument();
  });

  it("keeps at-risk synapses visible with a non-color-only risk marker", async () => {
    const user = userEvent.setup();
    await renderConnectedApp();
    await user.click(screen.getByRole("button", { name: "Tissue view" }));
    await user.click(screen.getByTestId("tissue-mode-development"));
    expect(screen.getByTestId("tissue-synapse-SYNAPSE-004")).toBeInTheDocument();
    expect(screen.getByTestId("pruning-risk-badge-SYNAPSE-004")).toHaveTextContent("!");
    expect(screen.getByTestId("pruning-risk-marker-SYNAPSE-004")).toBeInTheDocument();
  });

  it("shows pruning state in the Synapse inspector Development section", async () => {
    const user = userEvent.setup();
    await renderConnectedApp();
    await user.click(screen.getByRole("button", { name: "Tissue view" }));
    await user.click(screen.getByLabelText("Inspect synapse SYNAPSE-004"));
    expect(await screen.findByTestId("synapse-development-section")).toBeVisible();
    expect(screen.getByTestId("synapse-pruning-status")).toHaveTextContent("atRisk");
    expect(screen.getByTestId("synapse-pruning-risk")).toHaveTextContent("72%");
    expect(screen.getByTestId("synapse-pruning-reasons")).toHaveTextContent("low weight");
  });

  it("uses structured backend events for Development timeline filters", async () => {
    const user = userEvent.setup();
    vi.mocked(neuralApi.getEvents).mockResolvedValue([
      {
        id: "evt-struct-1",
        timestamp: "2026-01-01T00:00:00Z",
        networkTick: 40,
        type: "growth_candidate_maturing",
        sourceNeuronId: "NEURON-001",
        targetNeuronId: "NEURON-003",
        entityId: "CANDIDATE-NEURON-001-NEURON-003",
        previousStatus: "eligible",
        newStatus: "maturing",
        readinessOrRisk: 0.8,
        reasonCodes: ["repeated_coactivation", "within_structural_reach"],
        message: "maturing",
      },
    ]);
    await renderConnectedApp();
    await user.click(screen.getByRole("button", { name: "Tick timeline" }));
    await user.click(screen.getByTestId("timeline-filter-maturation"));
    expect(await screen.findByTestId("timeline-structural-item")).toHaveTextContent(
      "entered maturation",
    );
    expect(screen.getByTestId("timeline-structural-item")).toHaveTextContent(
      "repeated_coactivation",
    );
  });

  it("switching tissue display modes does not call backend mutate endpoints", async () => {
    const user = userEvent.setup();
    await renderConnectedApp();
    await user.click(screen.getByRole("button", { name: "Tissue view" }));
    const callsBefore = {
      step: vi.mocked(neuralApi.stepNetwork).mock.calls.length,
      reset: vi.mocked(neuralApi.resetNetwork).mock.calls.length,
      inject: vi.mocked(neuralApi.injectSignal).mock.calls.length,
    };
    await user.click(screen.getByTestId("tissue-mode-structure"));
    await user.click(screen.getByTestId("tissue-mode-development"));
    await user.click(screen.getByTestId("tissue-mode-activity"));
    expect(vi.mocked(neuralApi.stepNetwork).mock.calls.length).toBe(callsBefore.step);
    expect(vi.mocked(neuralApi.resetNetwork).mock.calls.length).toBe(callsBefore.reset);
    expect(vi.mocked(neuralApi.injectSignal).mock.calls.length).toBe(callsBefore.inject);
  });

  it("renders no candidate paths when backend sends none", async () => {
    const user = userEvent.setup();
    vi.mocked(neuralApi.getNetwork).mockResolvedValue({
      ...snapshot,
      structural: {
        ...snapshot.structural,
        growthCandidates: [],
        candidateCount: 0,
      },
    });
    await renderConnectedApp();
    await user.click(screen.getByRole("button", { name: "Tissue view" }));
    await user.click(screen.getByTestId("tissue-mode-development"));
    expect(
      screen.queryByTestId("tissue-candidate-CANDIDATE-NEURON-001-NEURON-005"),
    ).not.toBeInTheDocument();
  });

  it("keeps the mission shell inside 100dvh and shows backend unavailable clearly", async () => {
    await renderConnectedApp();
    expect(screen.getByTestId("mission-control")).toHaveAttribute(
      "data-layout",
      "viewport-locked",
    );
    vi.mocked(neuralApi.hasConfiguredBackend).mockReturnValue(false);
    const { unmount } = render(<App />);
    await waitFor(() =>
      expect(
        screen.getAllByText(/Backend unavailable|No VITE_API_BASE_URL/i).length,
      ).toBeGreaterThan(0),
    );
    unmount();
  });
});
