interface ControlsProps {
  disabled: boolean;
  busy: boolean;
  running: boolean;
  autoStep: number;
  maxAutoSteps: number;
  onWeakSignal: () => void;
  onStrongSignal: () => void;
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
  onWeakSignal,
  onStrongSignal,
  onStep,
  onRun,
  onPause,
  onReset,
}: ControlsProps) {
  const locked = disabled || busy || running;

  return (
    <section className="actions" aria-label="Network controls">
      <button
        type="button"
        className="btn btn-primary"
        disabled={locked}
        onClick={onWeakSignal}
      >
        Inject Weak Signal
      </button>
      <button
        type="button"
        className="btn btn-secondary"
        disabled={locked}
        onClick={onStrongSignal}
      >
        Inject Strong Signal
      </button>
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
