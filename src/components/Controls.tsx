interface ControlsProps {
  disabled: boolean;
  busy: boolean;
  running: boolean;
  autoStep: number;
  maxAutoSteps: number;
  onStep: () => void;
  onRun: () => void;
  onPause: () => void;
  onReset: () => void;
}

export function Controls({
  disabled,
  busy,
  running,
  autoStep,
  maxAutoSteps,
  onStep,
  onRun,
  onPause,
  onReset,
}: ControlsProps) {
  const locked = disabled || busy || running;

  return (
    <section className="actions" aria-label="Network controls">
      <p className="hint sequence-meta">
        Stimulate neurons by tapping (inspect) or long-pressing (+5 mV) in the network graph.
      </p>
      <button type="button" className="btn btn-secondary" disabled={locked} onClick={onStep}>
        Step One Tick
      </button>
      <button
        type="button"
        className="btn btn-secondary"
        disabled={disabled || busy || running}
        onClick={onRun}
      >
        Run Sequence
      </button>
      <button
        type="button"
        className="btn btn-secondary"
        disabled={disabled || !running}
        onClick={onPause}
      >
        Pause Sequence
      </button>
      <button
        type="button"
        className="btn btn-secondary"
        disabled={disabled || busy}
        onClick={onReset}
      >
        Reset Network
      </button>
      <p className="hint sequence-meta">
        Automatic sequence: {running ? "running" : "idle"} · step {autoStep}/{maxAutoSteps}
      </p>
    </section>
  );
}
