import { NeuronStatus } from "./NeuronStatus";
import type {
  NetworkEvent,
  NeuronSnapshot,
  SynapseSnapshot,
} from "../../types/neural";

interface NeuronInspectorProps {
  open: boolean;
  neuron: NeuronSnapshot | null;
  networkTick: number;
  connections: SynapseSnapshot[];
  events: NetworkEvent[];
  busy: boolean;
  stimulateDisabled: boolean;
  onStimulateWeak: () => void;
  onStimulateStrong: () => void;
  onClose: () => void;
}

export function NeuronInspector({
  open,
  neuron,
  networkTick,
  connections,
  events,
  busy,
  stimulateDisabled,
  onStimulateWeak,
  onStimulateStrong,
  onClose,
}: NeuronInspectorProps) {
  if (!open || !neuron) {
    return null;
  }

  const locked = busy || stimulateDisabled;

  return (
    <div className="inspector-root" role="dialog" aria-modal="true" aria-labelledby="inspector-title">
      <button type="button" className="inspector-backdrop" aria-label="Close inspector" onClick={onClose} />
      <aside className="inspector-panel">
        <div className="inspector-handle" aria-hidden="true" />
        <div className="inspector-header">
          <h2 id="inspector-title" className="card-title">
            Neuron Inspector
          </h2>
          <button type="button" className="btn btn-secondary inspector-close" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="electrode-callout">
          <strong>Direct electrode-style stimulation</strong>
          <p>
            This interaction directly injects current into the selected simulated neuron. Future
            versions will route touch through sensory receptor nodes.
          </p>
        </div>

        <NeuronStatus
          neuron={neuron}
          networkTick={networkTick}
          connections={connections}
          events={events}
          embedded
        />

        <div className="inspector-actions">
          <button
            type="button"
            className="btn btn-primary"
            disabled={locked}
            onClick={onStimulateWeak}
          >
            Stimulate +5 mV
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={locked}
            onClick={onStimulateStrong}
          >
            Strong Stimulus +20 mV
          </button>
        </div>
      </aside>
    </div>
  );
}
