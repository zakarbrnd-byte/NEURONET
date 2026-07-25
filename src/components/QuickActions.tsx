interface QuickActionsProps {
  disabled: boolean;
  busy: boolean;
  running: boolean;
  onStep: () => void;
  onRun: () => void;
  onPause: () => void;
}

export function QuickActions({
  disabled,
  busy,
  running,
  onStep,
  onRun,
  onPause,
}: QuickActionsProps) {
  return (
    <div className="quick-actions" aria-label="Quick simulation actions">
      <button
        type="button"
        className="quick-action-btn"
        disabled={disabled || busy || running}
        onClick={onStep}
        aria-label="Step one tick"
      >
        Step
      </button>
      {running ? (
        <button
          type="button"
          className="quick-action-btn quick-action-primary"
          disabled={disabled}
          onClick={onPause}
          aria-label="Pause sequence"
        >
          Pause
        </button>
      ) : (
        <button
          type="button"
          className="quick-action-btn quick-action-primary"
          disabled={disabled || busy}
          onClick={onRun}
          aria-label="Run sequence"
        >
          Run
        </button>
      )}
    </div>
  );
}
