interface ControlsProps {
  disabled: boolean;
  busy: boolean;
  onWeakSignal: () => void;
  onStrongSignal: () => void;
  onStep: () => void;
  onReset: () => void;
}

export function Controls({
  disabled,
  busy,
  onWeakSignal,
  onStrongSignal,
  onStep,
  onReset,
}: ControlsProps) {
  const locked = disabled || busy;

  return (
    <section className="actions" aria-label="Network controls">
      <button
        type="button"
        className="btn btn-primary"
        disabled={locked}
        onClick={onWeakSignal}
      >
        {busy ? "Working…" : "Weak Signal"}
      </button>
      <button
        type="button"
        className="btn btn-secondary"
        disabled={locked}
        onClick={onStrongSignal}
      >
        Strong Signal
      </button>
      <button type="button" className="btn btn-secondary" disabled={locked} onClick={onStep}>
        Next Network Tick
      </button>
      <button type="button" className="btn btn-secondary" disabled={locked} onClick={onReset}>
        Reset Network
      </button>
    </section>
  );
}
