import { useEffect, useRef, useState } from "react";
import { Header } from "./components/Header";
import { ConnectionBanner } from "./components/ConnectionBanner";
import { Controls } from "./components/Controls";
import { ActivityFeed } from "./components/ActivityFeed";
import { NetworkView } from "./features/network/NetworkView";
import { Timeline } from "./features/network/Timeline";
import { CausalPanel } from "./features/network/CausalPanel";
import { NetworkSummary } from "./features/network/NetworkSummary";
import { NeuronStatus } from "./features/neuron/NeuronStatus";
import { ApiError, neuralApi } from "./services/neuralApi";
import type {
  ConnectionStatus,
  NetworkEvent,
  NetworkSnapshot,
  NetworkStepTrace,
  PropagationTrace,
  TimelineEntry,
} from "./types/neural";
import {
  countDepolarized,
  networkIsQuiet,
  timelineSummary,
} from "./types/neural";

const DEFAULT_NEURON = "NEURON-001";
const WEAK_SIGNAL_MV = 5;
const STRONG_SIGNAL_MV = 20;
const MAX_AUTO_STEPS = 12;
const STEP_DELAY_MS = 800;
const MAX_TIMELINE = 20;

export default function App() {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [error, setError] = useState<string | null>(null);
  const [network, setNetwork] = useState<NetworkSnapshot | null>(null);
  const [events, setEvents] = useState<NetworkEvent[]>([]);
  const [selectedNeuronId, setSelectedNeuronId] = useState(DEFAULT_NEURON);
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

      if (!snapshot.neurons.some((neuron) => neuron.id === selectedNeuronId)) {
        setSelectedNeuronId(snapshot.neurons[0]?.id ?? DEFAULT_NEURON);
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

  async function runMutation(action: () => Promise<NetworkSnapshot>) {
    if (busyRef.current || runningRef.current || status !== "connected") {
      return;
    }

    setBusy(true);
    busyRef.current = true;
    setError(null);

    try {
      const snapshot = await action();
      setNetwork(snapshot);
      setActivePropagations([]);
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

  const selectedNeuron =
    network?.neurons.find((neuron) => neuron.id === selectedNeuronId) ??
    network?.neurons[0] ??
    null;

  const sequenceStatus = running
    ? `running (${autoStep}/${MAX_AUTO_STEPS})`
    : autoStep > 0
      ? `paused/stopped at ${autoStep}/${MAX_AUTO_STEPS}`
      : "idle";

  return (
    <div className="page">
      <Header version="0.5" mode="Network Dynamics Observatory" />
      <ConnectionBanner status={status} error={error} onRetry={() => void loadFromBackend()} />

      <main className="main">
        {network ? (
          <NetworkView
            neurons={network.neurons}
            connections={network.connections}
            selectedNeuronId={selectedNeuron?.id ?? selectedNeuronId}
            activePropagations={activePropagations}
            reducedMotion={reducedMotion}
            onSelectNeuron={setSelectedNeuronId}
          />
        ) : (
          <section className="card">
            <h2 className="card-title">Network View</h2>
            <p className="hint">
              Waiting for a backend network snapshot. The UI will not invent neurons or connections.
            </p>
          </section>
        )}

        <NetworkSummary
          network={network}
          lastTrace={lastTrace}
          status={status}
          sequenceStatus={sequenceStatus}
        />

        <CausalPanel lastTrace={lastTrace} />
        <Timeline entries={timeline} />

        <NeuronStatus
          neuron={selectedNeuron}
          networkTick={network?.tick ?? 0}
          connections={network?.connections ?? []}
          events={events}
        />

        <ActivityFeed events={events} />

        <Controls
          disabled={status !== "connected"}
          busy={busy}
          running={running}
          autoStep={autoStep}
          maxAutoSteps={MAX_AUTO_STEPS}
          onWeakSignal={() =>
            void runMutation(() =>
              neuralApi.injectSignal(selectedNeuron?.id ?? selectedNeuronId, WEAK_SIGNAL_MV),
            )
          }
          onStrongSignal={() =>
            void runMutation(() =>
              neuralApi.injectSignal(selectedNeuron?.id ?? selectedNeuronId, STRONG_SIGNAL_MV),
            )
          }
          onStep={() => void runStepRequest()}
          onRun={handleRunSequence}
          onPause={handlePauseSequence}
          onReset={() => void handleReset()}
        />

        {error && status === "connected" ? (
          <p className="inline-error" role="alert">
            {error}
          </p>
        ) : null}
      </main>
    </div>
  );
}
