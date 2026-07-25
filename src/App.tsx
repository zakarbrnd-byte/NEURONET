import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { ConnectionBanner } from "./components/ConnectionBanner";
import { Controls } from "./components/Controls";
import { ActivityFeed } from "./components/ActivityFeed";
import { NetworkView } from "./features/network/NetworkView";
import { NeuronStatus } from "./features/neuron/NeuronStatus";
import { ApiError, neuralApi } from "./services/neuralApi";
import type {
  ConnectionStatus,
  NetworkEvent,
  NetworkSnapshot,
} from "./types/neural";

const DEFAULT_NEURON = "NEURON-001";
const WEAK_SIGNAL_MV = 5;
const STRONG_SIGNAL_MV = 20;

export default function App() {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [error, setError] = useState<string | null>(null);
  const [network, setNetwork] = useState<NetworkSnapshot | null>(null);
  const [events, setEvents] = useState<NetworkEvent[]>([]);
  const [selectedNeuronId, setSelectedNeuronId] = useState(DEFAULT_NEURON);
  const [busy, setBusy] = useState(false);

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

  async function runMutation(action: () => Promise<NetworkSnapshot>) {
    if (busy || status !== "connected") {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const snapshot = await action();
      const backendEvents = await neuralApi.getEvents();
      setNetwork(snapshot);
      setEvents(backendEvents);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Request failed";
      setError(message);
      if (err instanceof ApiError && err.status === 0) {
        setStatus("unavailable");
      }
    } finally {
      setBusy(false);
    }
  }

  const selectedNeuron =
    network?.neurons.find((neuron) => neuron.id === selectedNeuronId) ??
    network?.neurons[0] ??
    null;

  return (
    <div className="page">
      <Header version="0.4" mode="Backend Neural Core" />
      <ConnectionBanner status={status} error={error} onRetry={() => void loadFromBackend()} />

      <main className="main">
        {network ? (
          <NetworkView
            neurons={network.neurons}
            connections={network.connections}
            selectedNeuronId={selectedNeuron?.id ?? selectedNeuronId}
            events={events}
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

        <NeuronStatus neuron={selectedNeuron} networkTick={network?.tick ?? 0} />
        <ActivityFeed events={events} />

        <Controls
          disabled={status !== "connected"}
          busy={busy}
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
          onStep={() => void runMutation(() => neuralApi.stepNetwork())}
          onReset={() => void runMutation(() => neuralApi.resetNetwork())}
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
