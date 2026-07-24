interface ControlPanelProps {
  busy: boolean;
  onWake: () => void;
  onSleep: () => void;
  onStepTick: () => void;
  onInject: () => void;
  onRefresh: () => void;
}

export function ControlPanel({
  busy,
  onWake,
  onSleep,
  onStepTick,
  onInject,
  onRefresh,
}: ControlPanelProps) {
  return (
    <section className="panel control-panel" aria-labelledby="control-panel-title">
      <div className="panel__header">
        <h2 id="control-panel-title">Control Panel</h2>
        <p>Experimenter interventions — not cognition</p>
      </div>

      <div className="controls">
        <button type="button" className="controls__btn" disabled={busy} onClick={onWake}>
          Wake
        </button>
        <button type="button" className="controls__btn" disabled={busy} onClick={onSleep}>
          Sleep
        </button>
        <button type="button" className="controls__btn" disabled={busy} onClick={onStepTick}>
          Step One Tick
        </button>
        <button
          type="button"
          className="controls__btn controls__btn--accent"
          disabled={busy}
          onClick={onInject}
        >
          Inject Test Message
        </button>
        <button type="button" className="controls__btn" disabled={busy} onClick={onRefresh}>
          Refresh
        </button>
      </div>
    </section>
  );
}
