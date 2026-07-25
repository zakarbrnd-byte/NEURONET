import { useState } from "react";
import { shortNeuronId } from "../../types/neural";
import type { ControlsCategory } from "../../types/ui";

interface ControlsPanelProps {
  selectedNeuronId: string | null;
  disabled: boolean;
  busy: boolean;
  running: boolean;
  autoStep: number;
  maxAutoSteps: number;
  onStimulateWeak: () => void;
  onStimulateStrong: () => void;
  onStep: () => void;
  onRun: () => void;
  onPause: () => void;
  onReset: () => void;
}

const CATEGORIES: Array<{ id: ControlsCategory; label: string }> = [
  { id: "stimulus", label: "Stimulus" },
  { id: "time", label: "Time" },
  { id: "reset", label: "Reset" },
];

export function ControlsPanel({
  selectedNeuronId,
  disabled,
  busy,
  running,
  autoStep,
  maxAutoSteps,
  onStimulateWeak,
  onStimulateStrong,
  onStep,
  onRun,
  onPause,
  onReset,
}: ControlsPanelProps) {
  const [category, setCategory] = useState<ControlsCategory>("stimulus");
  const noNeuron = !selectedNeuronId;
  const stimLocked = disabled || busy || running || noNeuron;
  const stepLocked = disabled || busy || running;
  const runLocked = disabled || busy || running;
  const pauseLocked = disabled || !running;
  const resetLocked = disabled || busy;

  return (
    <div className="controls-panel">
      <p className="controls-target">
        Target:{" "}
        <strong>
          {selectedNeuronId ? shortNeuronId(selectedNeuronId) : "None selected"}
        </strong>
      </p>
      <p className="hint">
        Long-press a neuron on the graph for quick +5 mV. Sequence:{" "}
        {running ? "running" : "paused"} · {autoStep}/{maxAutoSteps}
      </p>

      <div className="segmented" role="tablist" aria-label="Control categories">
        {CATEGORIES.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={category === item.id}
            className={`segmented-item ${category === item.id ? "is-active" : ""}`}
            onClick={() => setCategory(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="controls-actions">
        {category === "stimulus" ? (
          <>
            <button
              type="button"
              className="btn btn-primary"
              disabled={stimLocked}
              onClick={onStimulateWeak}
            >
              Weak Signal +5 mV
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={stimLocked}
              onClick={onStimulateStrong}
            >
              Strong Signal +20 mV
            </button>
          </>
        ) : null}

        {category === "time" ? (
          <>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={stepLocked}
              onClick={onStep}
            >
              Step One Tick
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={runLocked}
              onClick={onRun}
            >
              Run Sequence
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={pauseLocked}
              onClick={onPause}
            >
              Pause Sequence
            </button>
          </>
        ) : null}

        {category === "reset" ? (
          <>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={resetLocked}
              onClick={onReset}
            >
              Reset Network
            </button>
            <p className="hint">
              Help: Tap a neuron to inspect. Hold ~0.5s to stimulate +5 mV. A tick is one backend
              simulation step, not a real-world second.
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
