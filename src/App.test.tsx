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
  const cellType = id === "NEURON-004" ? ("inhibitory" as const) : ("excitatory" as const);
  const somaRadius = 0.035;
  const dendriteRadius = 0.09;
  const axonLength = 0.22;
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
    cellType,
    dnaId: id.replace("NEURON-", "DNA-"),
    somaRadius,
    dendriteRadius,
    axonLength,
    lifecycle: "settled" as const,
    developmentalAge: 0,
    phaseAge: 0,
    birthTick: 0,
    settledTick: 0,
    targetPosition: null,
    originalTargetPosition: null,
    migrationPath: null,
    migrationProgress: 1,
    migrationDistance: 0,
    morphologyProgress: 1,
    cellTypeAssigned: cellType,
    electricallyEligibleFromTick: 0,
    structurallyEligibleFromTick: 0,
    developmentalOrigin: "initial_tissue",
    matureMorphology: {
      somaRadius,
      dendriteRadius,
      axonReach: axonLength,
    },
    blockingConditions: [] as string[],
    ...overrides,
  };
}

const defaultDevelopment = {
  enabled: true,
  totalCellCount: 5,
  settledNeuronCount: 5,
  developingCellCount: 0,
  populationCapacity: 8,
  latestBirthTick: null as number | null,
  latestDevelopmentEvaluationTick: 6 as number | null,
  nextBirthEligibilityTick: 30 as number | null,
  currentLifecycleActivity: "idle",
  progenitorZone: {
    id: "progenitor-zone",
    name: "Simplified Progenitor Zone",
    xMin: 0.1,
    xMax: 0.9,
    yMin: 0.82,
    yMax: 0.96,
    description: "Simplified birth band — not anatomical germinal zone.",
  },
  settlementZones: [
    {
      id: "settlement-zone",
      name: "Settlement Zone",
      xMin: 0.08,
      xMax: 0.92,
      yMin: 0.12,
      yMax: 0.78,
      description: "Allowed settlement band for newly developed neurons.",
    },
  ],
  config: {
    maximumTotalNeurons: 8,
    maximumConcurrentDevelopingCells: 1,
    firstBirthTick: 30,
    minimumBirthIntervalTicks: 35,
    maturationDurationTicks: 8,
    differentiationDurationTicks: 4,
    migrationDurationTicks: 16,
    settlingDurationTicks: 4,
    targetExcitatoryRatio: 0.75,
  },
};

const defaultEnvironment = {
  environmentId: "ENV-001",
  name: "Virtual Sensory Environment",
  enabled: true,
  mode: "active",
  preset: "balanced" as const,
  seed: 20260801,
  ageTicks: 6,
  eventCount: 0,
  latestEventTick: null as number | null,
  nextScheduledEventTick: 8 as number | null,
  nextBackgroundTick: 8 as number | null,
  nextPatternATick: 16 as number | null,
  nextPatternBTick: 28 as number | null,
  activePatterns: [] as string[],
  statistics: {
    totalEvents: 0,
    backgroundEvents: 0,
    patternAStarts: 0,
    patternBStarts: 0,
    receptorActivations: 0,
    sensoryDeliveries: 0,
  },
  config: {
    enabled: true,
    deterministicSeed: 20260801,
    preset: "balanced" as const,
    backgroundEnabled: true,
    backgroundIntervalTicks: 8,
    backgroundStrengthMv: 2.0,
    patternAEnabled: true,
    patternBEnabled: true,
    patternAIntervalTicks: 24,
    patternBIntervalTicks: 36,
    patternAFirstTick: 16,
    patternBFirstTick: 28,
    maximumEventsPerTick: 6,
  },
  receptors: [
    {
      id: "RECEPTOR-BG",
      receptorType: "background" as const,
      position: { x: 0.06, y: 0.5 },
      region: "Sensory Margin",
      sensitivity: 1,
      activationThreshold: 0.5,
      currentActivation: 0,
      lastActivatedTick: null as number | null,
      activationCount: 0,
      active: false,
    },
    {
      id: "RECEPTOR-A",
      receptorType: "touch_a" as const,
      position: { x: 0.08, y: 0.32 },
      region: "Sensory Margin",
      sensitivity: 1,
      activationThreshold: 0.5,
      currentActivation: 0,
      lastActivatedTick: null as number | null,
      activationCount: 0,
      active: false,
    },
    {
      id: "RECEPTOR-B",
      receptorType: "touch_b" as const,
      position: { x: 0.08, y: 0.68 },
      region: "Sensory Margin",
      sensitivity: 1,
      activationThreshold: 0.5,
      currentActivation: 0,
      lastActivatedTick: null as number | null,
      activationCount: 0,
      active: false,
    },
  ],
  sensoryConnections: [
    {
      id: "SENSORY-001",
      receptorId: "RECEPTOR-BG",
      targetNeuronId: "NEURON-001",
      weightMv: 2,
      enabled: true,
    },
    {
      id: "SENSORY-002",
      receptorId: "RECEPTOR-A",
      targetNeuronId: "NEURON-001",
      weightMv: 12,
      enabled: true,
    },
    {
      id: "SENSORY-003",
      receptorId: "RECEPTOR-A",
      targetNeuronId: "NEURON-002",
      weightMv: 6,
      enabled: true,
    },
    {
      id: "SENSORY-004",
      receptorId: "RECEPTOR-B",
      targetNeuronId: "NEURON-002",
      weightMv: 12,
      enabled: true,
    },
    {
      id: "SENSORY-005",
      receptorId: "RECEPTOR-B",
      targetNeuronId: "NEURON-003",
      weightMv: 4,
      enabled: true,
    },
  ],
  patterns: [
    {
      id: "PATTERN-A",
      name: "Touch Pattern A",
      steps: [
        { offsetTicks: 0, receptorId: "RECEPTOR-A", magnitudeMv: 12 },
        { offsetTicks: 1, receptorId: "RECEPTOR-B", magnitudeMv: 6 },
      ],
      repetitionIntervalTicks: 24,
      firstTick: 16,
      enabled: true,
      activationCount: 0,
      lastStartedTick: null as number | null,
      active: false,
      activeStartedTick: null as number | null,
    },
    {
      id: "PATTERN-B",
      name: "Touch Pattern B",
      steps: [
        { offsetTicks: 0, receptorId: "RECEPTOR-B", magnitudeMv: 12 },
        { offsetTicks: 2, receptorId: "RECEPTOR-A", magnitudeMv: 4 },
      ],
      repetitionIntervalTicks: 36,
      firstTick: 28,
      enabled: true,
      activationCount: 0,
      lastStartedTick: null as number | null,
      active: false,
      activeStartedTick: null as number | null,
    },
  ],
  recentEvents: [] as Array<{
    eventId: string;
    tick: number;
    kind: string;
    reasonCodes: string[];
    message: string;
  }>,
  sensoryInputCount: 5,
  neuralSynapseCount: 5,
};

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
    structurallyProtected: id === "SYNAPSE-001" || id === "SYNAPSE-002",
    protectionReason:
      id === "SYNAPSE-001"
        ? "backbone_input_pathway"
        : id === "SYNAPSE-002"
          ? "backbone_cascade"
          : null,
    originCandidateId: null,
    eligibleFromTick: 0,
    atRiskEvals: 0,
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
      structurallyProtected: false,
      protectionReason: null,
      originCandidateId: null,
      eligibleFromTick: 0,
      atRiskEvals: 2,
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
      creationReadinessThreshold: 0.9,
      creationHoldEvals: 1,
      pruningWeightThreshold: 6,
      pruningHealthThreshold: 0.55,
      pruningInactivityTicks: 12,
      pruningGraceTicks: 10,
      pruningCommitRiskThreshold: 0.7,
      pruningLowWeightDuration: 4,
      pruningLowHealthDuration: 4,
      pruningSustainedAtRiskEvals: 2,
      maxCandidates: 8,
      minTotalSynapses: 3,
      maxTotalSynapses: 12,
      maxOutgoingPerNeuron: 3,
      maxIncomingPerNeuron: 3,
      preserveDemoPath: true,
    },
    growthCandidates: [
      {
        id: "CANDIDATE-NEURON-002-NEURON-001",
        sourceNeuronId: "NEURON-002",
        targetNeuronId: "NEURON-001",
        proposedConnectionType: "excitatory" as const,
        distance: 0.2,
        coactivationScore: 5.5,
        structuralCompatibility: 0.7,
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
    topology: {
      cellCount: 5,
      synapseCount: 5,
      candidateCount: 1,
      atRiskSynapseCount: 1,
      createdThisSession: 0,
      prunedThisSession: 0,
      maxSynapseCapacity: 12,
      minSynapseFloor: 3,
    },
    history: [],
  },
  development: defaultDevelopment,
  environment: defaultEnvironment,
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
  environmentTrace: {
    eventsGenerated: [] as string[],
    receptorsActivated: [] as string[],
    sensoryDeliveries: [] as Array<{
      receptorId: string;
      targetNeuronId: string;
      magnitudeMv: number;
      connectionId: string;
      eventId: string;
    }>,
    activePatterns: [] as string[],
  },
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
      getHealth: vi.fn(async () => ({ status: "ok", version: "0.8", ageSeconds: 12 })),
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
      updateEnvironmentControls: vi.fn(async () => snapshot),
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
      version: "0.8",
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
    vi.mocked(neuralApi.updateEnvironmentControls).mockResolvedValue(snapshot);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders MissionControl as the sole app layout", async () => {
    await renderConnectedApp();
    expect(screen.getByTestId("mission-control")).toHaveAttribute("data-page", "mission-control");
    expect(screen.getByTestId("layout-revision-marker")).toHaveTextContent(
      "Autonomous Sensory Environment · Version 0.8",
    );
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
    expect(within(header).getByText("0.8")).toBeInTheDocument();
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
      "tissue-candidate-CANDIDATE-NEURON-002-NEURON-001",
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
      screen.getByLabelText("Inspect growth candidate CANDIDATE-NEURON-002-NEURON-001"),
    );
    expect(await screen.findByRole("dialog", { name: "Growth Candidate" })).toBeVisible();
    expect(screen.getByTestId("growth-candidate-panel")).toHaveTextContent("Readiness");
    expect(screen.getByTestId("candidate-readiness")).toHaveTextContent("61%");
    expect(screen.getByTestId("candidate-supporting-reasons")).toHaveTextContent(
      "repeated coactivation",
    );
    expect(screen.getByTestId("candidate-observe-only")).toHaveTextContent(
      "backend alone may birth",
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
    await user.click(screen.getByTestId("tissue-mode-sensory"));
    await user.click(screen.getByTestId("tissue-mode-activity"));
    expect(vi.mocked(neuralApi.stepNetwork).mock.calls.length).toBe(callsBefore.step);
    expect(vi.mocked(neuralApi.resetNetwork).mock.calls.length).toBe(callsBefore.reset);
    expect(vi.mocked(neuralApi.injectSignal).mock.calls.length).toBe(callsBefore.inject);
    expect(vi.mocked(neuralApi.updateEnvironmentControls).mock.calls.length).toBe(0);
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
      screen.queryByTestId("tissue-candidate-CANDIDATE-NEURON-002-NEURON-001"),
    ).not.toBeInTheDocument();
  });


  it("shows Version 0.8 sensory marker and topology counters from backend", async () => {
    const user = userEvent.setup();
    await renderConnectedApp();
    expect(screen.getByTestId("layout-revision-marker")).toHaveTextContent(
      "Autonomous Sensory Environment · Version 0.8",
    );
    await user.click(screen.getByRole("button", { name: "Tissue view" }));
    await user.click(screen.getByTestId("tissue-mode-development"));
    expect(screen.getByTestId("topology-summary")).toBeInTheDocument();
    expect(screen.getByTestId("topology-synapse-count")).toHaveTextContent("5");
    expect(screen.getByTestId("topology-created-count")).toHaveTextContent("0");
    expect(screen.getByTestId("tissue-progenitor-zone")).toHaveTextContent(
      "Simplified Progenitor Zone",
    );
  });

  it("keeps candidates dashed until a confirmed backend birth appears as a real synapse", async () => {
    const user = userEvent.setup();
    await renderConnectedApp();
    await user.click(screen.getByRole("button", { name: "Tissue view" }));
    await user.click(screen.getByTestId("tissue-mode-development"));
    const candidate = screen.getByTestId("tissue-candidate-CANDIDATE-NEURON-002-NEURON-001");
    expect(candidate.querySelector(".tissue-candidate-path")).toHaveAttribute("stroke-dasharray");
    expect(screen.queryByTestId("tissue-synapse-SYNAPSE-0006")).not.toBeInTheDocument();

    const bornSnapshot = {
      ...snapshot,
      synapses: [
        ...snapshot.synapses,
        {
          ...makeSynapse("SYNAPSE-0006", "NEURON-002", "NEURON-001", 8, "excitatory"),
          originCandidateId: "CANDIDATE-NEURON-002-NEURON-001",
          eligibleFromTick: 16,
          creationTick: 15,
        },
      ],
      structural: {
        ...snapshot.structural,
        growthCandidates: [],
        candidateCount: 0,
        topology: {
          ...snapshot.structural.topology,
          synapseCount: 6,
          candidateCount: 0,
          createdThisSession: 1,
        },
      },
    };
    vi.mocked(neuralApi.getNetwork).mockResolvedValue(bornSnapshot);
    vi.mocked(neuralApi.stepNetwork).mockResolvedValue({
      ...stepTrace,
      network: bornSnapshot,
      eventIds: ["evt-birth-1"],
    });
    vi.mocked(neuralApi.getEvents).mockResolvedValue([
      {
        id: "evt-birth-1",
        timestamp: "2026-01-01T00:00:00Z",
        networkTick: 15,
        type: "synapse_created",
        synapseId: "SYNAPSE-0006",
        candidateId: "CANDIDATE-NEURON-002-NEURON-001",
        sourceNeuronId: "NEURON-002",
        targetNeuronId: "NEURON-001",
        connectionType: "excitatory",
        reasonCodes: ["maturation_complete"],
        synapseCountBefore: 5,
        synapseCountAfter: 6,
        message: "born",
      },
    ]);
    await user.click(screen.getByRole("button", { name: "Step one tick" }));
    await waitFor(() =>
      expect(screen.getByTestId("tissue-synapse-SYNAPSE-0006")).toBeInTheDocument(),
    );
    expect(screen.getByTestId("topology-created-count")).toHaveTextContent("1");
    expect(
      screen.queryByTestId("tissue-candidate-CANDIDATE-NEURON-002-NEURON-001"),
    ).not.toBeInTheDocument();
  });

  it("handles pruned selected synapse safely and shows structural birth timeline", async () => {
    const user = userEvent.setup();
    vi.mocked(neuralApi.getEvents).mockResolvedValue([
      {
        id: "evt-prune-1",
        timestamp: "2026-01-01T00:00:00Z",
        networkTick: 40,
        type: "synapse_pruned",
        synapseId: "SYNAPSE-005",
        sourceNeuronId: "NEURON-004",
        targetNeuronId: "NEURON-005",
        reasonCodes: ["low_weight", "prolonged_inactivity"],
        synapseCountBefore: 5,
        synapseCountAfter: 4,
        message: "pruned",
      },
      {
        id: "evt-birth-2",
        timestamp: "2026-01-01T00:00:01Z",
        networkTick: 41,
        type: "synapse_created",
        synapseId: "SYNAPSE-0006",
        sourceNeuronId: "NEURON-002",
        targetNeuronId: "NEURON-001",
        reasonCodes: ["maturation_complete"],
        message: "born",
      },
    ]);
    await renderConnectedApp();
    await user.click(screen.getByRole("button", { name: "Tissue view" }));
    await user.click(screen.getByLabelText("Inspect synapse SYNAPSE-005"));
    expect(await screen.findByTestId("synapse-panel")).toBeVisible();

    const prunedNetwork = {
      ...snapshot,
      synapses: snapshot.synapses.filter((s) => s.id !== "SYNAPSE-005"),
      structural: {
        ...snapshot.structural,
        topology: {
          ...snapshot.structural.topology,
          synapseCount: 4,
          prunedThisSession: 1,
        },
      },
    };
    vi.mocked(neuralApi.stepNetwork).mockResolvedValue({
      ...stepTrace,
      network: prunedNetwork,
      eventIds: ["evt-prune-1"],
    });
    await user.click(screen.getByRole("button", { name: "Step one tick" }));
    await waitFor(() =>
      expect(screen.getByTestId("synapse-pruned-notice")).toHaveTextContent("pruned at Tick 40"),
    );

    await user.click(screen.getByRole("button", { name: "Tick timeline" }));
    await user.click(screen.getByTestId("timeline-filter-birth"));
    expect(await screen.findByTestId("timeline-structural-item")).toHaveTextContent("Synapse born");
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

  it("shows Development summary population and activity from backend", async () => {
    const user = userEvent.setup();
    await renderConnectedApp();
    await user.click(screen.getByRole("button", { name: "Simulation controls" }));
    await user.click(screen.getByRole("tab", { name: "Structure" }));
    expect(screen.getByTestId("development-summary-controls")).toBeInTheDocument();
    expect(screen.getByTestId("development-population")).toHaveTextContent("5/8");
    expect(screen.getByTestId("development-developing-count")).toHaveTextContent("0");
    expect(screen.getByTestId("development-settled-count")).toHaveTextContent("5");
    expect(screen.getByTestId("development-next-birth")).toHaveTextContent("Tick 30");
    expect(screen.getByTestId("development-lifecycle-activity")).toHaveTextContent("idle");
  });

  it("renders developing cells distinctly with backend positions and migration paths", async () => {
    const user = userEvent.setup();
    const migrating = makeNeuron("NEURON-006", {
      position: { x: 0.4, y: 0.7 },
      lifecycle: "migrating",
      developmentalAge: 12,
      phaseAge: 4,
      birthTick: 30,
      settledTick: null,
      targetPosition: { x: 0.5, y: 0.35 },
      originalTargetPosition: { x: 0.5, y: 0.35 },
      migrationPath: {
        waypoints: [
          { x: 0.4, y: 0.7 },
          { x: 0.45, y: 0.52 },
          { x: 0.5, y: 0.35 },
        ],
        currentSegment: 1,
      },
      migrationProgress: 0.42,
      migrationDistance: 0.38,
      morphologyProgress: 0.6,
      cellTypeAssigned: "excitatory",
      electricallyEligibleFromTick: null,
      structurallyEligibleFromTick: null,
      developmentalOrigin: "neural_progenitor",
    });
    const maturing = makeNeuron("NEURON-007", {
      position: { x: 0.55, y: 0.88 },
      lifecycle: "maturing",
      developmentalAge: 3,
      phaseAge: 3,
      birthTick: 40,
      settledTick: null,
      migrationProgress: 0,
      morphologyProgress: 0.2,
      cellTypeAssigned: null,
      electricallyEligibleFromTick: null,
      structurallyEligibleFromTick: null,
      developmentalOrigin: "neural_progenitor",
      somaRadius: 0.018,
      dendriteRadius: 0.03,
    });
    vi.mocked(neuralApi.getNetwork).mockResolvedValue({
      ...snapshot,
      neurons: [...snapshot.neurons, migrating, maturing],
      tissue: { ...snapshot.tissue, cellCount: 7 },
      development: {
        ...defaultDevelopment,
        totalCellCount: 7,
        settledNeuronCount: 5,
        developingCellCount: 2,
        latestBirthTick: 40,
        nextBirthEligibilityTick: 75,
        currentLifecycleActivity: "NEURON-006:Migrating, NEURON-007:Maturing",
      },
    });
    await renderConnectedApp();
    await user.click(screen.getByRole("button", { name: "Tissue view" }));
    await user.click(screen.getByTestId("tissue-mode-development"));

    const migratingCell = screen.getByTestId("tissue-cell-NEURON-006");
    expect(migratingCell).toHaveAttribute("data-developing", "true");
    expect(migratingCell).toHaveAttribute("data-lifecycle", "migrating");
    expect(migratingCell).toHaveAttribute("data-pos-x", "0.4");
    expect(migratingCell).toHaveAttribute("data-pos-y", "0.7");
    expect(screen.getByTestId("tissue-migration-path-NEURON-006")).toBeInTheDocument();
    expect(screen.getByTestId("tissue-migration-progress-NEURON-006")).toHaveTextContent("42%");
    expect(screen.getByTestId("tissue-maturing-seed-NEURON-007")).toBeInTheDocument();
    expect(screen.getByTestId("tissue-maturing-ring-NEURON-007")).toBeInTheDocument();
  });

  it("hides progenitor zone and developing markers when development data is absent", async () => {
    const user = userEvent.setup();
    vi.mocked(neuralApi.getNetwork).mockResolvedValue({
      ...snapshot,
      development: null,
      neurons: [
        ...snapshot.neurons,
        makeNeuron("NEURON-006", {
          position: { x: 0.5, y: 0.9 },
          lifecycle: "maturing",
          electricallyEligibleFromTick: null,
          settledTick: null,
          developmentalOrigin: "neural_progenitor",
        }),
      ],
    });
    await renderConnectedApp();
    await user.click(screen.getByRole("button", { name: "Tissue view" }));
    await user.click(screen.getByTestId("tissue-mode-development"));
    expect(screen.getByTestId("tissue-view")).toHaveAttribute("data-has-development", "false");
    expect(screen.queryByTestId("tissue-progenitor-zone")).not.toBeInTheDocument();
    expect(screen.getByTestId("tissue-cell-NEURON-006")).toHaveAttribute(
      "data-developing",
      "false",
    );
  });

  it("shows lifecycle inspector without stimulation for developing cells", async () => {
    const user = userEvent.setup();
    vi.mocked(neuralApi.getNetwork).mockResolvedValue({
      ...snapshot,
      neurons: [
        ...snapshot.neurons,
        makeNeuron("NEURON-006", {
          position: { x: 0.5, y: 0.88 },
          lifecycle: "differentiating",
          birthTick: 30,
          settledTick: null,
          cellTypeAssigned: "inhibitory",
          electricallyEligibleFromTick: null,
          developmentalOrigin: "neural_progenitor",
          migrationProgress: 0,
        }),
      ],
      development: {
        ...defaultDevelopment,
        totalCellCount: 6,
        developingCellCount: 1,
        settledNeuronCount: 5,
      },
    });
    const { container } = await renderConnectedApp();
    const target = neuronTarget(container, "NEURON-006");
    fireEvent.pointerDown(target, { pointerId: 9, button: 0, clientX: 5, clientY: 5 });
    fireEvent.pointerUp(target, { pointerId: 9, button: 0, clientX: 5, clientY: 5 });
    expect(await screen.findByTestId("lifecycle-inspector")).toBeVisible();
    expect(screen.getByTestId("lifecycle-state")).toHaveTextContent("differentiating");
    expect(screen.getByTestId("lifecycle-no-stim-note")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Weak Signal/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Simulation controls" }));
    expect(screen.getByRole("button", { name: "Weak Signal +5 mV" })).toBeDisabled();
  });

  it("uses structured development timeline filters for birth and migration events", async () => {
    const user = userEvent.setup();
    vi.mocked(neuralApi.getEvents).mockResolvedValue([
      {
        id: "evt-dev-1",
        timestamp: "2026-01-01T00:00:00Z",
        networkTick: 30,
        type: "progenitor_born",
        neuronId: "NEURON-006",
        entityId: "NEURON-006",
        newStatus: "maturing",
        reasonCodes: ["BirthEligible"],
        message: "born",
      },
      {
        id: "evt-dev-2",
        timestamp: "2026-01-01T00:00:01Z",
        networkTick: 42,
        type: "migration_started",
        neuronId: "NEURON-006",
        entityId: "NEURON-006",
        previousStatus: "differentiating",
        newStatus: "migrating",
        reasonCodes: [],
        message: "migrating",
      },
      {
        id: "evt-dev-3",
        timestamp: "2026-01-01T00:00:02Z",
        networkTick: 60,
        type: "population_capacity_reached",
        reasonCodes: ["PopulationCapacity"],
        message: "Population capacity reached (8/8).",
      },
    ]);
    await renderConnectedApp();
    await user.click(screen.getByRole("button", { name: "Tick timeline" }));
    await user.click(screen.getByTestId("timeline-filter-devBirth"));
    expect(await screen.findByTestId("timeline-development-item")).toHaveTextContent(
      "Simplified Progenitor Zone",
    );
    await user.click(screen.getByTestId("timeline-filter-migration"));
    expect(await screen.findByTestId("timeline-development-item")).toHaveTextContent(
      "began migration",
    );
    await user.click(screen.getByTestId("timeline-filter-capacity"));
    expect(await screen.findByTestId("timeline-development-item")).toHaveTextContent(
      "Population capacity reached",
    );
  });

  it("pause keeps sequence paused so development does not advance without ticks", async () => {
    const user = userEvent.setup();
    await renderConnectedApp();
    await user.click(screen.getByRole("button", { name: "Run sequence" }));
    expect(screen.getByText("Running")).toBeInTheDocument();
    const stepsWhileRunning = vi.mocked(neuralApi.stepNetwork).mock.calls.length;
    await user.click(screen.getByRole("button", { name: "Pause sequence" }));
    expect(screen.getByText("Paused")).toBeInTheDocument();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(vi.mocked(neuralApi.stepNetwork).mock.calls.length).toBe(stepsWhileRunning);
  });

  it("exposes Sensory display mode with backend receptors and distinct sensory paths", async () => {
    const user = userEvent.setup();
    await renderConnectedApp();
    await user.click(screen.getByRole("button", { name: "Tissue view" }));
    await user.click(screen.getByTestId("tissue-mode-sensory"));
    expect(screen.getByTestId("tissue-view")).toHaveAttribute("data-display-mode", "sensory");
    expect(screen.getByTestId("tissue-view")).toHaveAttribute("data-has-environment", "true");
    expect(screen.getByTestId("tissue-receptor-RECEPTOR-A")).toBeInTheDocument();
    expect(screen.getByTestId("tissue-receptor-RECEPTOR-B")).toBeInTheDocument();
    expect(screen.getByTestId("tissue-receptor-RECEPTOR-BG")).toBeInTheDocument();
    expect(screen.getByTestId("tissue-sensory-SENSORY-002")).toHaveAttribute(
      "data-sensory-connection",
      "true",
    );
    expect(
      screen.getByTestId("tissue-sensory-SENSORY-002").querySelector(".tissue-sensory-path-inner"),
    ).toHaveAttribute("stroke-dasharray");
    expect(screen.getByTestId("tissue-sensory-legend")).toHaveTextContent(
      "Double / dotted: sensory input path",
    );
    expect(screen.getByTestId("sensory-receptor-count")).toHaveTextContent("3");
    expect(screen.getByTestId("sensory-input-count")).toHaveTextContent("5");
    expect(screen.getByTestId("sensory-neural-synapse-count")).toHaveTextContent("5");
  });

  it("does not invent receptors or sensory paths when environment is absent", async () => {
    const user = userEvent.setup();
    vi.mocked(neuralApi.getNetwork).mockResolvedValue({
      ...snapshot,
      environment: null,
    });
    await renderConnectedApp();
    await user.click(screen.getByRole("button", { name: "Tissue view" }));
    await user.click(screen.getByTestId("tissue-mode-sensory"));
    expect(screen.getByTestId("tissue-view")).toHaveAttribute("data-has-environment", "false");
    expect(screen.queryByTestId("tissue-receptor-RECEPTOR-A")).not.toBeInTheDocument();
    expect(screen.queryByTestId("tissue-sensory-SENSORY-001")).not.toBeInTheDocument();
  });

  it("opens Receptor inspector without neuron firing controls", async () => {
    const user = userEvent.setup();
    await renderConnectedApp();
    await user.click(screen.getByRole("button", { name: "Tissue view" }));
    await user.click(screen.getByTestId("tissue-mode-sensory"));
    await user.click(screen.getByLabelText("Inspect receptor RECEPTOR-A"));
    expect(await screen.findByRole("dialog", { name: "Receptor" })).toBeVisible();
    expect(screen.getByTestId("receptor-panel")).toBeInTheDocument();
    expect(screen.getByTestId("receptor-id")).toHaveTextContent("RECEPTOR-A");
    expect(screen.getByTestId("receptor-type")).toHaveTextContent("Touch A");
    expect(screen.getByTestId("receptor-region")).toHaveTextContent("Sensory Margin");
    expect(screen.getByTestId("receptor-no-stim-note")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Weak Signal/i })).not.toBeInTheDocument();
    expect(screen.getByTestId("receptor-connection-SENSORY-002")).toHaveTextContent("N-001");
  });

  it("shows Environment controls panel and forwards toggles to the API", async () => {
    const user = userEvent.setup();
    vi.mocked(neuralApi.updateEnvironmentControls).mockImplementation(async (controls) => ({
      ...snapshot,
      environment: {
        ...defaultEnvironment,
        enabled: controls.enabled ?? defaultEnvironment.enabled,
        mode: (controls.enabled ?? defaultEnvironment.enabled) ? "active" : "paused",
        preset: controls.preset ?? defaultEnvironment.preset,
        config: {
          ...defaultEnvironment.config,
          enabled: controls.enabled ?? defaultEnvironment.config.enabled,
          backgroundEnabled:
            controls.backgroundEnabled ?? defaultEnvironment.config.backgroundEnabled,
          patternAEnabled:
            controls.patternAEnabled ?? defaultEnvironment.config.patternAEnabled,
          patternBEnabled:
            controls.patternBEnabled ?? defaultEnvironment.config.patternBEnabled,
          preset: controls.preset ?? defaultEnvironment.config.preset,
        },
      },
    }));
    await renderConnectedApp();
    await user.click(screen.getByRole("button", { name: "Simulation controls" }));
    await user.click(screen.getByRole("tab", { name: "Environment" }));
    expect(screen.getByTestId("environment-controls")).toBeInTheDocument();
    expect(screen.getByTestId("environment-limitations-note")).toHaveTextContent(
      "deterministic virtual sensory schedule",
    );
    expect(screen.getByTestId("env-neural-synapse-count")).toHaveTextContent("5");
    expect(screen.getByTestId("env-sensory-input-count")).toHaveTextContent("5");
    await user.click(screen.getByTestId("env-toggle-pattern-a"));
    await waitFor(() =>
      expect(neuralApi.updateEnvironmentControls).toHaveBeenCalledWith({
        patternAEnabled: false,
      }),
    );
    await user.click(screen.getByTestId("env-preset-quiet"));
    await waitFor(() =>
      expect(neuralApi.updateEnvironmentControls).toHaveBeenCalledWith({ preset: "quiet" }),
    );
    await user.click(screen.getByTestId("env-toggle-enabled"));
    await waitFor(() =>
      expect(neuralApi.updateEnvironmentControls).toHaveBeenCalledWith({ enabled: false }),
    );
  });

  it("labels manual stimulation as Laboratory Electrode", async () => {
    const user = userEvent.setup();
    await renderConnectedApp();
    await user.click(screen.getByRole("button", { name: "Simulation controls" }));
    expect(screen.getByTestId("laboratory-electrode-label")).toHaveTextContent(
      "Laboratory Electrode",
    );
    expect(screen.getByText(/Hold: Laboratory Electrode/i)).toBeInTheDocument();
  });

  it("uses structured environment and receptor timeline filters without inventing events", async () => {
    const user = userEvent.setup();
    vi.mocked(neuralApi.getEvents).mockResolvedValue([
      {
        id: "evt-env-1",
        timestamp: "2026-01-01T00:00:00Z",
        networkTick: 8,
        type: "environment_event_started",
        sourceNeuronId: "RECEPTOR-BG",
        targetNeuronId: "NEURON-001",
        amountMv: 2,
        reasonCodes: ["background_pulse"],
        message: "Background pulse +2.0 mV via RECEPTOR-BG.",
      },
      {
        id: "evt-rec-1",
        timestamp: "2026-01-01T00:00:01Z",
        networkTick: 8,
        type: "receptor_activated",
        sourceNeuronId: "RECEPTOR-BG",
        entityId: "RECEPTOR-BG",
        amountMv: 2,
        reasonCodes: ["receptor_channel"],
        message: "RECEPTOR-BG activated (2.0 mV).",
      },
      {
        id: "evt-pat-1",
        timestamp: "2026-01-01T00:00:02Z",
        networkTick: 16,
        type: "sensory_pattern_started",
        entityId: "PATTERN-A",
        reasonCodes: ["pattern_schedule"],
        message: "PATTERN-A started.",
      },
      {
        id: "evt-lab-1",
        timestamp: "2026-01-01T00:00:03Z",
        networkTick: 17,
        type: "laboratory_stimulus",
        neuronId: "NEURON-001",
        targetNeuronId: "NEURON-001",
        amountMv: 5,
        reasonCodes: [],
        message: "Laboratory electrode +5 mV to NEURON-001.",
      },
    ]);
    await renderConnectedApp();
    await user.click(screen.getByRole("button", { name: "Tick timeline" }));
    await user.click(screen.getByTestId("timeline-filter-environment"));
    expect(await screen.findByTestId("timeline-environment-item")).toHaveTextContent(
      "Background pulse +2.0 mV via RECEPTOR-BG.",
    );
    await user.click(screen.getByTestId("timeline-filter-receptors"));
    expect(await screen.findByTestId("timeline-environment-item")).toHaveTextContent(
      "RECEPTOR-BG activated",
    );
    await user.click(screen.getByTestId("timeline-filter-patterns"));
    expect(await screen.findByTestId("timeline-environment-item")).toHaveTextContent(
      "PATTERN-A started.",
    );
    await user.click(screen.getByTestId("timeline-filter-laboratory"));
    expect(await screen.findByTestId("timeline-environment-item")).toHaveTextContent(
      "Laboratory electrode",
    );
  });

  it("animates sensory deliveries from step environmentTrace only", async () => {
    const user = userEvent.setup();
    vi.mocked(neuralApi.stepNetwork).mockResolvedValue({
      ...stepTrace,
      environmentTrace: {
        eventsGenerated: ["env-del-1"],
        receptorsActivated: ["RECEPTOR-A"],
        sensoryDeliveries: [
          {
            receptorId: "RECEPTOR-A",
            targetNeuronId: "NEURON-001",
            magnitudeMv: 12,
            connectionId: "SENSORY-002",
            eventId: "env-del-1",
          },
        ],
        activePatterns: ["PATTERN-A"],
      },
      network: {
        ...snapshot,
        tick: 16,
        environment: {
          ...defaultEnvironment,
          ageTicks: 16,
          activePatterns: ["PATTERN-A"],
          receptors: defaultEnvironment.receptors.map((r) =>
            r.id === "RECEPTOR-A"
              ? { ...r, active: true, currentActivation: 12, activationCount: 1 }
              : r,
          ),
        },
      },
    });
    await renderConnectedApp();
    await user.click(screen.getByRole("button", { name: "Tissue view" }));
    await user.click(screen.getByTestId("tissue-mode-sensory"));
    await user.click(screen.getByRole("button", { name: "Step one tick" }));
    await waitFor(() =>
      expect(screen.getByTestId("tissue-sensory-SENSORY-002")).toHaveClass("is-pulse"),
    );
    expect(screen.getByTestId("tissue-receptor-RECEPTOR-A")).toHaveAttribute(
      "data-receptor-active",
      "true",
    );
    expect(screen.getByTestId("sensory-active-patterns")).toHaveTextContent("PATTERN-A");
  });

  it("keeps development mode working alongside sensory mode", async () => {
    const user = userEvent.setup();
    await renderConnectedApp();
    await user.click(screen.getByRole("button", { name: "Tissue view" }));
    await user.click(screen.getByTestId("tissue-mode-development"));
    expect(screen.getByTestId("tissue-candidate-CANDIDATE-NEURON-002-NEURON-001")).toBeInTheDocument();
    await user.click(screen.getByTestId("tissue-mode-sensory"));
    expect(screen.getByTestId("tissue-receptor-RECEPTOR-A")).toBeInTheDocument();
    await user.click(screen.getByTestId("tissue-mode-development"));
    expect(screen.getByTestId("tissue-progenitor-zone")).toBeInTheDocument();
  });
});
