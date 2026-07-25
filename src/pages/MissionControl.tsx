import { useEffect, useRef, useState } from "react";
import { StatusBar } from "../components/StatusBar";
import { BottomNav } from "../components/BottomNav";
import { QuickActions } from "../components/QuickActions";
import { SelectedNeuronStrip } from "../components/SelectedNeuronStrip";
import { ContextPanel } from "../components/ContextPanel";
import { NetworkView } from "../features/network/NetworkView";
import { TissueView } from "../features/network/TissueView";
import { NodePanel } from "../features/mission/NodePanel";
import { SynapsePanel } from "../features/mission/SynapsePanel";
import { GrowthCandidatePanel } from "../features/mission/GrowthCandidatePanel";
import { ReceptorPanel } from "../features/mission/ReceptorPanel";
import { TimelinePanel } from "../features/mission/TimelinePanel";
import { ControlsPanel } from "../features/mission/ControlsPanel";
import { ObserverStatusPanel } from "../features/mission/ObserverStatusPanel";
import {
  DEFAULT_OBSERVATION_LIMIT,
  DEFAULT_STEP_DELAY_MS,
  runAutonomousLoop,
  type PauseReason,
  type RunMode,
} from "../features/mission/runLoop";
import { ApiError, neuralApi } from "../services/neuralApi";
import type {
  ConnectionStatus,
  EnvironmentControlsRequest,
  NetworkEvent,
  NetworkSnapshot,
  NetworkStepTrace,
  PropagationTrace,
  SensoryDeliveryTrace,
  TimelineEntry,
} from "../types/neural";
import {
  countDepolarized,
  isObservatoryEventType,
  neuronIsElectricallyEligible,
  shortNeuronId,
  timelineSummary,
} from "../types/neural";
import type { MainView, MissionPanel, TissueDisplayMode } from "../types/ui";

const WEAK_SIGNAL_MV = 5;
const STRONG_SIGNAL_MV = 20;
const MAX_TIMELINE = 20;
const STIM_FEEDBACK_MS = 1600;

type StimulateOptions = {
  selectNeuron?: boolean;
  openPanel?: boolean;
  showStimFeedback?: boolean;
};

export function MissionControl() {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [error, setError] = useState<string | null>(null);
  const [network, setNetwork] = useState<NetworkSnapshot | null>(null);
  const [events, setEvents] = useState<NetworkEvent[]>([]);
  const [selectedNeuronId, setSelectedNeuronId] = useState<string | null>(null);
  const [selectedSynapseId, setSelectedSynapseId] = useState<string | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [selectedReceptorId, setSelectedReceptorId] = useState<string | null>(null);
  const [tissueDisplayMode, setTissueDisplayMode] =
    useState<TissueDisplayMode>("activity");
  const [bornSynapseIds, setBornSynapseIds] = useState<string[]>([]);
  const [pruningSynapseIds, setPruningSynapseIds] = useState<string[]>([]);
  const [prunedNotice, setPrunedNotice] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<MissionPanel>("network");
  const [mainView, setMainView] = useState<MainView>("network");
  const [pressingNeuronId, setPressingNeuronId] = useState<string | null>(null);
  const [flashedNeuronId, setFlashedNeuronId] = useState<string | null>(null);
  const [stimToast, setStimToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [running, setRunning] = useState(false);
  const [autoStep, setAutoStep] = useState(0);
  const [runMode, setRunMode] = useState<RunMode>("continuous");
  const [pauseReason, setPauseReason] = useState<PauseReason>("None");
  const [observationLimit, setObservationLimit] = useState(DEFAULT_OBSERVATION_LIMIT);
  const [lastTrace, setLastTrace] = useState<NetworkStepTrace | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [activePropagations, setActivePropagations] = useState<PropagationTrace[]>([]);
  const [activeSensoryDeliveries, setActiveSensoryDeliveries] = useState<
    SensoryDeliveryTrace[]
  >([]);
  const [seenEventIds, setSeenEventIds] = useState<Set<string>>(new Set());
  const [reducedMotion, setReducedMotion] = useState(false);

  const busyRef = useRef(false);
  const runningRef = useRef(false);
  const statusRef = useRef<ConnectionStatus>("connecting");
  const userPausedRef = useRef(false);
  const resetRequestedRef = useRef(false);
  const unmountedRef = useRef(false);
  const networkRef = useRef<NetworkSnapshot | null>(null);
  const lastTraceRef = useRef<NetworkStepTrace | null>(null);
  const stimInFlightRef = useRef(false);
  const stimFeedbackTimerRef = useRef<number | null>(null);
  const runAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);

  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    networkRef.current = network;
  }, [network]);

  useEffect(() => {
    lastTraceRef.current = lastTrace;
  }, [lastTrace]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      runAbortRef.current?.abort();
      runAbortRef.current = null;
      runningRef.current = false;
      if (stimFeedbackTimerRef.current !== null) {
        window.clearTimeout(stimFeedbackTimerRef.current);
      }
    };
  }, []);

  function showStimulationFeedback(neuronId: string, amountMv: number) {
    if (stimFeedbackTimerRef.current !== null) {
      window.clearTimeout(stimFeedbackTimerRef.current);
    }
    setFlashedNeuronId(neuronId);
    setStimToast(
      `Laboratory Electrode → ${shortNeuronId(neuronId)} +${amountMv} mV`,
    );
    stimFeedbackTimerRef.current = window.setTimeout(() => {
      setFlashedNeuronId(null);
      setStimToast(null);
      stimFeedbackTimerRef.current = null;
    }, STIM_FEEDBACK_MS);
  }

  async function loadFromBackend() {
    if (!neuralApi.hasConfiguredBackend()) {
      setStatus("unavailable");
      setError(
        "No VITE_API_BASE_URL is configured. GitHub Pages can host this UI, but cannot run the Rust backend.",
      );
      setNetwork(null);
      setEvents([]);
      return;
    }

    setStatus("connecting");
    setError(null);

    try {
      await neuralApi.getHealth();
      const [snapshot, backendEvents] = await Promise.all([
        neuralApi.getNetwork(),
        neuralApi.getEvents(),
      ]);
      setNetwork(snapshot);
      setEvents(backendEvents);
      setStatus("connected");

      if (selectedNeuronId && !snapshot.neurons.some((neuron) => neuron.id === selectedNeuronId)) {
        setSelectedNeuronId(snapshot.neurons[0]?.id ?? null);
      }
    } catch (err) {
      setStatus("unavailable");
      setNetwork(null);
      setEvents([]);
      setError(err instanceof Error ? err.message : "Backend unavailable");
    }
  }

  useEffect(() => {
    void loadFromBackend();
  }, []);

  function applyTrace(trace: NetworkStepTrace) {
    setNetwork(trace.network);
    setLastTrace(trace);

    const freshPropagations = trace.propagations.filter(
      (propagation) => !seenEventIds.has(propagation.eventId),
    );
    setActivePropagations(freshPropagations);

    const sensoryDeliveries = trace.environmentTrace?.sensoryDeliveries ?? [];
    const freshSensory = sensoryDeliveries.filter(
      (delivery) => !seenEventIds.has(delivery.eventId),
    );
    setActiveSensoryDeliveries(freshSensory);

    setSeenEventIds((current) => {
      const next = new Set(current);
      for (const propagation of freshPropagations) {
        next.add(propagation.eventId);
      }
      for (const delivery of freshSensory) {
        next.add(delivery.eventId);
      }
      for (const eventId of trace.eventIds) {
        next.add(eventId);
      }
      return next;
    });

    const entry: TimelineEntry = {
      tick: trace.tick,
      firedNeuronIds: trace.firedNeuronIds,
      propagations: trace.propagations,
      depolarizedCount: countDepolarized(trace.network.neurons),
      summary: timelineSummary(trace),
    };
    setTimeline((current) => [entry, ...current].slice(0, MAX_TIMELINE));
  }

  useEffect(() => {
    if (!network) return;
    const created = events
      .filter((event) => event.type === "synapse_created" && event.synapseId)
      .map((event) => event.synapseId!)
      .filter((id) => network.synapses.some((synapse) => synapse.id === id));
    if (created.length > 0) {
      setBornSynapseIds((current) => Array.from(new Set([...created, ...current])).slice(0, 8));
    }

    if (
      selectedSynapseId &&
      !network.synapses.some((synapse) => synapse.id === selectedSynapseId)
    ) {
      const pruneEvent = events.find(
        (event) => event.type === "synapse_pruned" && event.synapseId === selectedSynapseId,
      );
      setPrunedNotice(
        pruneEvent
          ? `This synapse was pruned at Tick ${pruneEvent.networkTick}`
          : "This synapse is no longer present in the tissue.",
      );
      setPruningSynapseIds((current) =>
        Array.from(new Set([selectedSynapseId, ...current])).slice(0, 8),
      );
      setSelectedSynapseId(null);
    }
  }, [network, events, selectedSynapseId]);

  // Keep selected structural entities valid after reset/snapshot refresh.
  useEffect(() => {
    if (!network) return;
    if (
      selectedCandidateId &&
      !network.structural.growthCandidates.some(
        (candidate) => candidate.id === selectedCandidateId,
      )
    ) {
      setSelectedCandidateId(null);
      if (activePanel === "candidate") {
        setActivePanel(mainView);
      }
    }
    if (
      selectedReceptorId &&
      !(network.environment?.receptors.some((receptor) => receptor.id === selectedReceptorId) ??
        false)
    ) {
      setSelectedReceptorId(null);
      if (activePanel === "receptor") {
        setActivePanel(mainView);
      }
    }
  }, [network, selectedCandidateId, selectedReceptorId, activePanel, mainView]);

  async function refreshEvents() {
    const backendEvents = await neuralApi.getEvents();
    setEvents(backendEvents);
  }

  async function runStepRequest(): Promise<NetworkStepTrace | null> {
    if (busyRef.current || status !== "connected") {
      return null;
    }

    setBusy(true);
    busyRef.current = true;
    setError(null);

    try {
      const trace = await neuralApi.stepNetwork();
      applyTrace(trace);
      await refreshEvents();
      return trace;
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Request failed";
      setError(message);
      if (err instanceof ApiError && err.status === 0) {
        setStatus("unavailable");
      }
      stopRun("Backend unavailable");
      return null;
    } finally {
      setBusy(false);
      busyRef.current = false;
    }
  }

  function stopRun(reason: PauseReason) {
    runAbortRef.current?.abort();
    runAbortRef.current = null;
    setRunning(false);
    runningRef.current = false;
    setPauseReason(reason);
  }

  async function stimulateNeuron(
    neuronId: string,
    amountMv: number,
    options: StimulateOptions = {},
  ) {
    const selectNeuron = options.selectNeuron !== false;
    const openPanel = options.openPanel !== false;
    const showStimFeedback = options.showStimFeedback === true;

    if (
      busyRef.current ||
      runningRef.current ||
      stimInFlightRef.current ||
      status !== "connected"
    ) {
      return;
    }

    const target = networkRef.current?.neurons.find((n) => n.id === neuronId);
    const tick = networkRef.current?.tick ?? 0;
    if (target && !neuronIsElectricallyEligible(target, tick)) {
      if (selectNeuron) setSelectedNeuronId(neuronId);
      if (openPanel) setActivePanel("node");
      return;
    }

    stimInFlightRef.current = true;
    setBusy(true);
    busyRef.current = true;
    setError(null);

    if (selectNeuron) {
      setSelectedNeuronId(neuronId);
    }
    if (openPanel) {
      setActivePanel("node");
    }

    try {
      const snapshot = await neuralApi.injectSignal(neuronId, amountMv);
      setNetwork(snapshot);
      setActivePropagations([]);
      setActiveSensoryDeliveries([]);
      await refreshEvents();
      if (showStimFeedback) {
        showStimulationFeedback(neuronId, amountMv);
      }
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Request failed";
      setError(message);
      if (err instanceof ApiError && err.status === 0) {
        setStatus("unavailable");
      }
    } finally {
      stimInFlightRef.current = false;
      setBusy(false);
      busyRef.current = false;
      setPressingNeuronId(null);
    }
  }

  function handleLongPressStimulate(neuronId: string) {
    const neuron = networkRef.current?.neurons.find((n) => n.id === neuronId);
    const tick = networkRef.current?.tick ?? 0;
    if (!neuron || !neuronIsElectricallyEligible(neuron, tick)) {
      setSelectedNeuronId(neuronId);
      setActivePanel("node");
      return;
    }
    void stimulateNeuron(neuronId, WEAK_SIGNAL_MV, {
      selectNeuron: false,
      openPanel: false,
      showStimFeedback: true,
    });
  }

  async function handleReset() {
    if (busyRef.current || status !== "connected") {
      return;
    }

    resetRequestedRef.current = true;
    userPausedRef.current = false;
    stopRun("Reset");
    setBusy(true);
    busyRef.current = true;
    setError(null);

    try {
      const snapshot = await neuralApi.resetNetwork();
      setNetwork(snapshot);
      setLastTrace(null);
      setTimeline([]);
      setActivePropagations([]);
      setActiveSensoryDeliveries([]);
      setSeenEventIds(new Set());
      setAutoStep(0);
      setSelectedReceptorId(null);
      setBornSynapseIds([]);
      setPruningSynapseIds([]);
      setPrunedNotice(null);
      await refreshEvents();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Request failed";
      setError(message);
    } finally {
      resetRequestedRef.current = false;
      setBusy(false);
      busyRef.current = false;
    }
  }

  function startRun(mode: RunMode) {
    if (status !== "connected" || busyRef.current || runningRef.current) {
      return;
    }

    runAbortRef.current?.abort();
    const controller = new AbortController();
    runAbortRef.current = controller;

    userPausedRef.current = false;
    resetRequestedRef.current = false;
    setRunMode(mode);
    setPauseReason("None");
    setRunning(true);
    runningRef.current = true;
    setAutoStep(0);

    void runAutonomousLoop({
      mode,
      observationLimit,
      stepDelayMs: DEFAULT_STEP_DELAY_MS,
      signal: controller.signal,
      isUserPaused: () => userPausedRef.current,
      isResetRequested: () => resetRequestedRef.current,
      isUnmounted: () => unmountedRef.current,
      stepOnce: async () => {
        if (controller.signal.aborted || resetRequestedRef.current || userPausedRef.current) {
          return { ok: false, backendFailed: false };
        }
        try {
          const trace = await runStepRequest();
          if (!trace) {
            const failed = statusRef.current !== "connected";
            return { ok: false, backendFailed: failed };
          }
          // Empty / quiet StepTrace is valid — continue.
          return { ok: true, trace };
        } catch {
          return { ok: false, backendFailed: true };
        }
      },
      onStepComplete: (_trace, stepsCompleted) => {
        setAutoStep(stepsCompleted);
      },
      onStop: (reason) => {
        if (unmountedRef.current) {
          return;
        }
        setRunning(false);
        runningRef.current = false;
        setPauseReason(reason);
        if (runAbortRef.current === controller) {
          runAbortRef.current = null;
        }
      },
    });
  }

  function handleRunSequence() {
    startRun("continuous");
  }

  function handleObservationRun() {
    startRun("observation");
  }

  function handlePauseSequence() {
    userPausedRef.current = true;
    stopRun("User paused");
  }

  function handleSelectNeuron(neuronId: string) {
    setSelectedNeuronId(neuronId);
    setSelectedSynapseId(null);
    setSelectedCandidateId(null);
    setSelectedReceptorId(null);
    setActivePanel("node");
  }

  function handleSelectSynapse(synapseId: string) {
    setSelectedSynapseId(synapseId);
    setSelectedCandidateId(null);
    setSelectedReceptorId(null);
    setPrunedNotice(null);
    setActivePanel("synapse");
  }

  function handleSelectCandidate(candidateId: string) {
    setSelectedCandidateId(candidateId);
    setSelectedSynapseId(null);
    setSelectedReceptorId(null);
    setActivePanel("candidate");
  }

  function handleSelectReceptor(receptorId: string) {
    setSelectedReceptorId(receptorId);
    setSelectedNeuronId(null);
    setSelectedSynapseId(null);
    setSelectedCandidateId(null);
    setActivePanel("receptor");
  }

  async function handleEnvironmentControls(controls: EnvironmentControlsRequest) {
    if (busyRef.current || status !== "connected") {
      return;
    }
    setBusy(true);
    busyRef.current = true;
    setError(null);
    try {
      const snapshot = await neuralApi.updateEnvironmentControls(controls);
      setNetwork(snapshot);
      await refreshEvents();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Request failed";
      setError(message);
      if (err instanceof ApiError && err.status === 0) {
        setStatus("unavailable");
      }
    } finally {
      setBusy(false);
      busyRef.current = false;
    }
  }

  function handleTissueDisplayModeChange(mode: TissueDisplayMode) {
    // Frontend-only UI state — never mutates backend.
    setTissueDisplayMode(mode);
  }

  function handleNavChange(panel: "network" | "tissue" | "timeline" | "controls") {
    if (panel === "network" || panel === "tissue") {
      setMainView(panel);
      setActivePanel(panel);
      return;
    }
    setActivePanel(panel);
  }

  function closeOverlay() {
    setActivePanel(mainView);
  }

  const selectedNeuron =
    (selectedNeuronId
      ? network?.neurons.find((neuron) => neuron.id === selectedNeuronId)
      : null) ?? null;

  const panelOpen =
    activePanel === "node" ||
    activePanel === "synapse" ||
    activePanel === "candidate" ||
    activePanel === "receptor" ||
    activePanel === "timeline" ||
    activePanel === "controls";
  const panelTitle =
    activePanel === "node"
      ? "Node"
      : activePanel === "synapse"
        ? "Synapse"
        : activePanel === "candidate"
          ? "Growth Candidate"
          : activePanel === "receptor"
            ? "Receptor"
            : activePanel === "timeline"
              ? "Timeline"
              : activePanel === "controls"
                ? "Controls"
                : mainView === "tissue"
                  ? "Tissue"
                  : "Network";
  const navActive =
    activePanel === "timeline" || activePanel === "controls" ? activePanel : mainView;

  const selectedSynapse =
    (selectedSynapseId
      ? network?.synapses.find((synapse) => synapse.id === selectedSynapseId)
      : null) ?? null;

  const selectedCandidate =
    (selectedCandidateId
      ? network?.structural.growthCandidates.find(
          (candidate) => candidate.id === selectedCandidateId,
        )
      : null) ?? null;

  const selectedReceptor =
    (selectedReceptorId
      ? network?.environment?.receptors.find((receptor) => receptor.id === selectedReceptorId)
      : null) ?? null;

  const uiRevision =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("ui") === "mission-control-1";

  return (
    <div
      className="mission-control"
      data-testid="mission-control"
      data-page="mission-control"
      data-panel={activePanel}
      data-layout="viewport-locked"
      data-safe-area="true"
      data-ui-revision="1"
      data-ui-query={uiRevision ? "mission-control-1" : "default"}
    >
      <header className="mission-control-header" data-testid="mission-control-header">
        <StatusBar
          version="0.8.1"
          status={status}
          networkTick={network?.tick ?? 0}
          running={running}
          pauseReason={pauseReason}
          error={error}
          tissue={network?.tissue ?? null}
          onRetry={() => void loadFromBackend()}
        />
        <p className="layout-revision-marker" data-testid="layout-revision-marker">
          Autonomous Observation Stabilization · Version 0.8.1
        </p>
      </header>

      <div className="mission-control-main" data-testid="mission-control-main">
        <section
          className="network-viewport"
          data-testid="network-viewport"
          data-main-view={mainView}
          aria-label={mainView === "tissue" ? "Tissue view" : "Network graph"}
        >
          {mainView === "network" ? (
            <p className="network-gesture-hint">
              Tap: Inspect · Hold: Laboratory Electrode +5 mV
            </p>
          ) : null}
          {network ? (
            mainView === "tissue" ? (
              <TissueView
                neurons={network.neurons}
                synapses={network.synapses}
                growthCandidates={network.structural.growthCandidates}
                selectedNeuronId={selectedNeuronId}
                selectedSynapseId={selectedSynapseId}
                selectedCandidateId={selectedCandidateId}
                selectedReceptorId={selectedReceptorId}
                displayMode={tissueDisplayMode}
                onDisplayModeChange={handleTissueDisplayModeChange}
                activePropagations={activePropagations}
                activeSensoryDeliveries={activeSensoryDeliveries}
                reducedMotion={reducedMotion}
                interactionDisabled={status !== "connected" || busy || running}
                pressingNeuronId={pressingNeuronId}
                flashedNeuronId={flashedNeuronId}
                bornSynapseIds={bornSynapseIds}
                pruningSynapseIds={pruningSynapseIds}
                topology={network.structural.topology}
                development={network.development ?? null}
                environment={network.environment ?? null}
                onSelectNeuron={handleSelectNeuron}
                onSelectSynapse={handleSelectSynapse}
                onSelectCandidate={handleSelectCandidate}
                onSelectReceptor={handleSelectReceptor}
                onLongPressStimulate={handleLongPressStimulate}
                onPressVisualChange={setPressingNeuronId}
              />
            ) : (
              <NetworkView
                compact
                neurons={network.neurons}
                synapses={network.synapses}
                selectedNeuronId={selectedNeuronId}
                selectedSynapseId={selectedSynapseId}
                activePropagations={activePropagations}
                reducedMotion={reducedMotion}
                interactionDisabled={status !== "connected" || busy || running}
                pressingNeuronId={pressingNeuronId}
                flashedNeuronId={flashedNeuronId}
                onSelectNeuron={handleSelectNeuron}
                onSelectSynapse={handleSelectSynapse}
                onLongPressStimulate={handleLongPressStimulate}
                onPressVisualChange={setPressingNeuronId}
              />
            )
          ) : (
            <div className="network-canvas network-canvas-empty" role="status">
              <p>
                {status === "unavailable"
                  ? "Backend unavailable. Core status stays visible here — retry from the top bar."
                  : "Waiting for a backend network snapshot."}
              </p>
            </div>
          )}
        </section>

        {stimToast ? (
          <p className="stim-toast" role="status" aria-live="polite">
            {stimToast}
          </p>
        ) : null}

        {error && status === "connected" ? (
          <p className="inline-error mission-inline-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="selected-neuron-strip-wrap" data-testid="selected-neuron-strip">
          <SelectedNeuronStrip
            neuron={selectedNeuron}
            onOpenNode={() => setActivePanel("node")}
          />
        </div>
      </div>

      <div className="quick-action-bar" data-testid="quick-action-bar">
        <QuickActions
          disabled={status !== "connected"}
          busy={busy}
          running={running}
          onStep={() => void runStepRequest()}
          onRun={handleRunSequence}
          onPause={handlePauseSequence}
          onReset={() => void handleReset()}
        />
      </div>

      <div className="bottom-navigation" data-testid="bottom-navigation">
        <BottomNav active={navActive} onChange={handleNavChange} />
      </div>

      <div className="overlay-panel-layer" data-testid="overlay-panel-layer">
        <ContextPanel open={panelOpen} title={panelTitle} onClose={closeOverlay}>
          {activePanel === "node" ? (
            <NodePanel
              neuron={selectedNeuron}
              networkTick={network?.tick ?? 0}
              synapses={network?.synapses ?? []}
              events={events}
            />
          ) : null}
          {activePanel === "synapse" ? (
            <SynapsePanel
              synapse={selectedSynapse}
              prunedNotice={prunedNotice}
              maturationTicksRequired={
                network?.structural.config.candidateMaturationTicks ?? 3
              }
            />
          ) : null}
          {activePanel === "candidate" ? (
            <GrowthCandidatePanel
              candidate={selectedCandidate}
              maturationTicksRequired={
                network?.structural.config.candidateMaturationTicks ?? 2
              }
              creationThreshold={
                network?.structural.config.creationReadinessThreshold ?? 0.65
              }
            />
          ) : null}
          {activePanel === "receptor" ? (
            <ReceptorPanel
              receptor={selectedReceptor}
              connections={network?.environment?.sensoryConnections ?? []}
            />
          ) : null}
          {activePanel === "timeline" ? (
            <TimelinePanel
              entries={timeline}
              events={events.filter((event) => isObservatoryEventType(event.type))}
            />
          ) : null}
          {activePanel === "controls" ? (
            <>
              <ObserverStatusPanel
                running={running}
                pauseReason={pauseReason}
                tick={network?.tick ?? 0}
                runMode={runMode}
                observationLimit={observationLimit}
                stepsThisRun={autoStep}
                environment={network?.environment ?? null}
                structural={network?.structural ?? null}
              />
              <ControlsPanel
                selectedNeuronId={selectedNeuronId}
                disabled={status !== "connected"}
                busy={busy}
                running={running}
                autoStep={autoStep}
                runMode={runMode}
                pauseReason={pauseReason}
                observationLimit={observationLimit}
                onObservationLimitChange={setObservationLimit}
                structural={network?.structural ?? null}
                development={network?.development ?? null}
                environment={network?.environment ?? null}
                stimulateDisabled={
                  selectedNeuron
                    ? !neuronIsElectricallyEligible(selectedNeuron, network?.tick ?? 0)
                    : false
                }
                onStimulateWeak={() => {
                  if (
                    selectedNeuronId &&
                    selectedNeuron &&
                    neuronIsElectricallyEligible(selectedNeuron, network?.tick ?? 0)
                  ) {
                    void stimulateNeuron(selectedNeuronId, WEAK_SIGNAL_MV, {
                      selectNeuron: false,
                      openPanel: false,
                    });
                  }
                }}
                onStimulateStrong={() => {
                  if (
                    selectedNeuronId &&
                    selectedNeuron &&
                    neuronIsElectricallyEligible(selectedNeuron, network?.tick ?? 0)
                  ) {
                    void stimulateNeuron(selectedNeuronId, STRONG_SIGNAL_MV, {
                      selectNeuron: false,
                      openPanel: false,
                    });
                  }
                }}
                onStep={() => void runStepRequest()}
                onContinuousRun={handleRunSequence}
                onObservationRun={handleObservationRun}
                onPause={handlePauseSequence}
                onReset={() => void handleReset()}
                onEnvironmentControls={(controls) => void handleEnvironmentControls(controls)}
              />
            </>
          ) : null}
        </ContextPanel>
      </div>
    </div>
  );
}
