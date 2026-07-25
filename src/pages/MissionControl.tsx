import { useEffect, useRef, useState } from "react";
import { StatusBar } from "../components/StatusBar";
import { BottomNav } from "../components/BottomNav";
import { QuickActions } from "../components/QuickActions";
import { SelectedNeuronStrip } from "../components/SelectedNeuronStrip";
import { ContextPanel } from "../components/ContextPanel";
import { NetworkView } from "../features/network/NetworkView";
import { TissueView } from "../features/network/TissueView";
import { NodePanel } from "../features/mission/NodePanel";
import { TimelinePanel } from "../features/mission/TimelinePanel";
import { ControlsPanel } from "../features/mission/ControlsPanel";
import { ApiError, neuralApi } from "../services/neuralApi";
import type {
  ConnectionStatus,
  NetworkEvent,
  NetworkSnapshot,
  NetworkStepTrace,
  PropagationTrace,
  TimelineEntry,
} from "../types/neural";
import {
  countDepolarized,
  networkIsQuiet,
  shortNeuronId,
  timelineSummary,
} from "../types/neural";
import type { MainView, MissionPanel } from "../types/ui";

const WEAK_SIGNAL_MV = 5;
const STRONG_SIGNAL_MV = 20;
const MAX_AUTO_STEPS = 12;
const STEP_DELAY_MS = 800;
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
  const [activePanel, setActivePanel] = useState<MissionPanel>("network");
  const [mainView, setMainView] = useState<MainView>("network");
  const [pressingNeuronId, setPressingNeuronId] = useState<string | null>(null);
  const [flashedNeuronId, setFlashedNeuronId] = useState<string | null>(null);
  const [stimToast, setStimToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [running, setRunning] = useState(false);
  const [autoStep, setAutoStep] = useState(0);
  const [lastTrace, setLastTrace] = useState<NetworkStepTrace | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [activePropagations, setActivePropagations] = useState<PropagationTrace[]>([]);
  const [seenEventIds, setSeenEventIds] = useState<Set<string>>(new Set());
  const [reducedMotion, setReducedMotion] = useState(false);

  const busyRef = useRef(false);
  const runningRef = useRef(false);
  const autoStepRef = useRef(0);
  const networkRef = useRef<NetworkSnapshot | null>(null);
  const lastTraceRef = useRef<NetworkStepTrace | null>(null);
  const stimInFlightRef = useRef(false);
  const stimFeedbackTimerRef = useRef<number | null>(null);

  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);

  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  useEffect(() => {
    autoStepRef.current = autoStep;
  }, [autoStep]);

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
    return () => {
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
    setStimToast(`${shortNeuronId(neuronId)} stimulated +${amountMv} mV`);
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
    setSeenEventIds((current) => {
      const next = new Set(current);
      for (const propagation of freshPropagations) {
        next.add(propagation.eventId);
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
      setRunning(false);
      runningRef.current = false;
      return null;
    } finally {
      setBusy(false);
      busyRef.current = false;
    }
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

    setRunning(false);
    runningRef.current = false;
    setBusy(true);
    busyRef.current = true;
    setError(null);

    try {
      const snapshot = await neuralApi.resetNetwork();
      setNetwork(snapshot);
      setLastTrace(null);
      setTimeline([]);
      setActivePropagations([]);
      setSeenEventIds(new Set());
      setAutoStep(0);
      autoStepRef.current = 0;
      await refreshEvents();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Request failed";
      setError(message);
    } finally {
      setBusy(false);
      busyRef.current = false;
    }
  }

  async function runSequenceLoop() {
    while (runningRef.current) {
      if (autoStepRef.current >= MAX_AUTO_STEPS) {
        setRunning(false);
        runningRef.current = false;
        break;
      }

      const currentNetwork = networkRef.current;
      const currentTrace = lastTraceRef.current;
      if (
        autoStepRef.current > 0 &&
        currentNetwork &&
        networkIsQuiet(currentNetwork, currentTrace)
      ) {
        setRunning(false);
        runningRef.current = false;
        break;
      }

      const trace = await runStepRequest();
      if (!trace) {
        break;
      }

      const next = autoStepRef.current + 1;
      autoStepRef.current = next;
      setAutoStep(next);

      if (!runningRef.current) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, STEP_DELAY_MS));
    }
  }

  function handleRunSequence() {
    if (status !== "connected" || busyRef.current || runningRef.current) {
      return;
    }
    setRunning(true);
    runningRef.current = true;
    setAutoStep(0);
    autoStepRef.current = 0;
    void runSequenceLoop();
  }

  function handlePauseSequence() {
    setRunning(false);
    runningRef.current = false;
  }

  function handleSelectNeuron(neuronId: string) {
    setSelectedNeuronId(neuronId);
    setActivePanel("node");
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
    activePanel === "node" || activePanel === "timeline" || activePanel === "controls";
  const panelTitle =
    activePanel === "node"
      ? "Node"
      : activePanel === "timeline"
        ? "Timeline"
        : activePanel === "controls"
          ? "Controls"
          : mainView === "tissue"
            ? "Tissue"
            : "Network";
  const navActive =
    activePanel === "timeline" || activePanel === "controls" ? activePanel : mainView;

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
          version="0.6A"
          status={status}
          networkTick={network?.tick ?? 0}
          running={running}
          error={error}
          tissue={network?.tissue ?? null}
          onRetry={() => void loadFromBackend()}
        />
        <p className="layout-revision-marker" data-testid="layout-revision-marker">
          Mission Control UI · Layout Revision 1 · Tissue 0.6A
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
            <p className="network-gesture-hint">Tap: Inspect · Hold: Stimulate +5 mV</p>
          ) : null}
          {network ? (
            mainView === "tissue" ? (
              <TissueView
                neurons={network.neurons}
                connections={network.connections}
                selectedNeuronId={selectedNeuronId}
                activePropagations={activePropagations}
                reducedMotion={reducedMotion}
                interactionDisabled={status !== "connected" || busy || running}
                pressingNeuronId={pressingNeuronId}
                flashedNeuronId={flashedNeuronId}
                onSelectNeuron={handleSelectNeuron}
                onLongPressStimulate={handleLongPressStimulate}
                onPressVisualChange={setPressingNeuronId}
              />
            ) : (
              <NetworkView
                compact
                neurons={network.neurons}
                connections={network.connections}
                selectedNeuronId={selectedNeuronId}
                activePropagations={activePropagations}
                reducedMotion={reducedMotion}
                interactionDisabled={status !== "connected" || busy || running}
                pressingNeuronId={pressingNeuronId}
                flashedNeuronId={flashedNeuronId}
                onSelectNeuron={handleSelectNeuron}
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
              connections={network?.connections ?? []}
              events={events}
            />
          ) : null}
          {activePanel === "timeline" ? <TimelinePanel entries={timeline} /> : null}
          {activePanel === "controls" ? (
            <ControlsPanel
              selectedNeuronId={selectedNeuronId}
              disabled={status !== "connected"}
              busy={busy}
              running={running}
              autoStep={autoStep}
              maxAutoSteps={MAX_AUTO_STEPS}
              onStimulateWeak={() => {
                if (selectedNeuronId) {
                  void stimulateNeuron(selectedNeuronId, WEAK_SIGNAL_MV, {
                    selectNeuron: false,
                    openPanel: false,
                  });
                }
              }}
              onStimulateStrong={() => {
                if (selectedNeuronId) {
                  void stimulateNeuron(selectedNeuronId, STRONG_SIGNAL_MV, {
                    selectNeuron: false,
                    openPanel: false,
                  });
                }
              }}
              onStep={() => void runStepRequest()}
              onRun={handleRunSequence}
              onPause={handlePauseSequence}
              onReset={() => void handleReset()}
            />
          ) : null}
        </ContextPanel>
      </div>
    </div>
  );
}
