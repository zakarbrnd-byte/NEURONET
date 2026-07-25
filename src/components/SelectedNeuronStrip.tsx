import type { NeuronSnapshot } from "../types/neural";
import {
  distanceToThresholdMv,
  electricalState,
  shortNeuronId,
} from "../types/neural";

interface SelectedNeuronStripProps {
  neuron: NeuronSnapshot | null;
  onOpenNode: () => void;
}

export function SelectedNeuronStrip({ neuron, onOpenNode }: SelectedNeuronStripProps) {
  if (!neuron) {
    return (
      <div className="neuron-strip neuron-strip-empty" aria-live="polite">
        Tap a neuron to select it
      </div>
    );
  }

  const state = electricalState(neuron);
  const distance = distanceToThresholdMv(neuron);
  const distanceText =
    distance > 0 ? `${distance.toFixed(0)} mV to fire` : "at threshold";

  return (
    <button
      type="button"
      className="neuron-strip"
      onClick={onOpenNode}
      aria-label={`Open details for ${neuron.id}`}
    >
      <span className="neuron-strip-id">{shortNeuronId(neuron.id)}</span>
      <span className="neuron-strip-sep" aria-hidden="true">
        ·
      </span>
      <span className={`neuron-strip-state state-text-${state.toLowerCase()}`}>{state}</span>
      <span className="neuron-strip-sep" aria-hidden="true">
        ·
      </span>
      <span>{neuron.membranePotentialMv.toFixed(0)} mV</span>
      <span className="neuron-strip-sep" aria-hidden="true">
        ·
      </span>
      <span>{distanceText}</span>
      <span className="neuron-strip-sep" aria-hidden="true">
        ·
      </span>
      <span>R{neuron.refractoryTicks}</span>
      {neuron.fired ? (
        <>
          <span className="neuron-strip-sep" aria-hidden="true">
            ·
          </span>
          <span className="neuron-strip-fired">Fired</span>
        </>
      ) : null}
    </button>
  );
}
