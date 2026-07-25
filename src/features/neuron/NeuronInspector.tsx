import { NeuronStatus } from "./NeuronStatus";
import type {
  NetworkEvent,
  NeuronSnapshot,
  SynapseSnapshot,
} from "../../types/neural";
import {
  neuronIsDeveloping,
  neuronIsElectricallyEligible,
  shortNeuronId,
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

function formatPos(pos: { x: number; y: number } | null | undefined): string {
  if (!pos) return "—";
  return `x=${pos.x.toFixed(2)}, y=${pos.y.toFixed(2)}`;
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

  const developing = neuronIsDeveloping(neuron);
  const eligible = neuronIsElectricallyEligible(neuron, networkTick);
  const showLifecycle = developing || !eligible;
  const locked = busy || stimulateDisabled || showLifecycle;

  if (showLifecycle) {
    return (
      <div
        className="inspector-root"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inspector-title"
        data-testid="lifecycle-inspector-dialog"
      >
        <button
          type="button"
          className="inspector-backdrop"
          aria-label="Close inspector"
          onClick={onClose}
        />
        <aside className="inspector-panel">
          <div className="inspector-handle" aria-hidden="true" />
          <div className="inspector-header">
            <h2 id="inspector-title" className="card-title">
              Lifecycle Inspector
            </h2>
            <button type="button" className="btn btn-secondary inspector-close" onClick={onClose}>
              Close
            </button>
          </div>
          <p className="hint" data-testid="lifecycle-no-stim-note">
            {shortNeuronId(neuron.id)} is not electrically eligible. No stimulation controls.
          </p>
          <dl className="status-list">
            <div className="status-row">
              <dt>Lifecycle</dt>
              <dd data-testid="lifecycle-state">{neuron.lifecycle}</dd>
            </div>
            <div className="status-row">
              <dt>Developmental age</dt>
              <dd>{neuron.developmentalAge}</dd>
            </div>
            <div className="status-row">
              <dt>Phase age</dt>
              <dd>{neuron.phaseAge}</dd>
            </div>
            <div className="status-row">
              <dt>Birth tick</dt>
              <dd>{neuron.birthTick}</dd>
            </div>
            <div className="status-row">
              <dt>Origin</dt>
              <dd>{neuron.developmentalOrigin}</dd>
            </div>
            <div className="status-row">
              <dt>Migration progress</dt>
              <dd>{(neuron.migrationProgress * 100).toFixed(0)}%</dd>
            </div>
            <div className="status-row">
              <dt>Target</dt>
              <dd>{formatPos(neuron.targetPosition)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    );
  }

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

        <dl className="status-list" data-testid="settled-development-fields">
          <div className="status-row">
            <dt>Birth tick</dt>
            <dd>{neuron.birthTick}</dd>
          </div>
          {neuron.settledTick != null ? (
            <div className="status-row">
              <dt>Settled tick</dt>
              <dd>{neuron.settledTick}</dd>
            </div>
          ) : null}
          <div className="status-row">
            <dt>Developmental origin</dt>
            <dd>{neuron.developmentalOrigin}</dd>
          </div>
          {neuron.migrationDistance > 0 ? (
            <div className="status-row">
              <dt>Migration distance</dt>
              <dd>{neuron.migrationDistance.toFixed(3)}</dd>
            </div>
          ) : null}
          {neuron.originalTargetPosition ? (
            <div className="status-row">
              <dt>Original target</dt>
              <dd>{formatPos(neuron.originalTargetPosition)}</dd>
            </div>
          ) : null}
        </dl>

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
