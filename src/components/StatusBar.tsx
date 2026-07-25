import type { ConnectionStatus } from "../types/neural";

interface StatusBarProps {
  version: string;
  status: ConnectionStatus;
  networkTick: number;
  running: boolean;
  error: string | null;
  onRetry: () => void;
}

function statusLabel(status: ConnectionStatus): string {
  if (status === "connected") return "Connected";
  if (status === "connecting") return "Connecting";
  return "Unavailable";
}

export function StatusBar({
  version,
  status,
  networkTick,
  running,
  error,
  onRetry,
}: StatusBarProps) {
  return (
    <header className="status-bar" aria-label="Mission status">
      <div className="status-bar-brand">
        <span className="status-bar-title">NEURONET</span>
        <span className="status-bar-version">{version}</span>
      </div>
      <div className="status-bar-meta">
        <span className={`status-dot status-dot-${status}`} aria-hidden="true" />
        <span className="status-bar-item">{statusLabel(status)}</span>
        <span className="status-bar-sep" aria-hidden="true">
          ·
        </span>
        <span className="status-bar-item">Tick {networkTick}</span>
        <span className="status-bar-sep" aria-hidden="true">
          ·
        </span>
        <span className="status-bar-item">{running ? "Running" : "Paused"}</span>
        {status === "unavailable" ? (
          <button
            type="button"
            className="status-bar-retry"
            onClick={onRetry}
            aria-label="Retry backend connection"
          >
            Retry
          </button>
        ) : null}
      </div>
      {error && status !== "connected" ? (
        <p className="status-bar-error" role="alert">
          {error}
        </p>
      ) : null}
    </header>
  );
}
