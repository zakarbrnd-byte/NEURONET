import type { ConnectionStatus, TissueInfo } from "../types/neural";
import { formatAge } from "../types/neural";
import type { PauseReason } from "../features/mission/runLoop";

interface StatusBarProps {
  version: string;
  status: ConnectionStatus;
  networkTick: number;
  running: boolean;
  pauseReason?: PauseReason;
  error: string | null;
  tissue: TissueInfo | null;
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
  pauseReason = "None",
  error,
  tissue,
  onRetry,
}: StatusBarProps) {
  return (
    <div className="status-bar" aria-label="Mission status">
      <div className="status-bar-brand">
        <span className="status-bar-title">NEURONET</span>
        <span className="status-bar-version">{version}</span>
      </div>

      <p className="status-bar-tissue-label" data-testid="tissue-label">
        {tissue?.label ?? "Artificial Neural Tissue"}
      </p>

      <div className="status-bar-tissue" data-testid="tissue-stats" aria-label="Tissue summary">
        <span className="status-bar-item">
          {tissue?.alive !== false ? "Alive" : "Offline"}
        </span>
        <span className="status-bar-sep" aria-hidden="true">
          ·
        </span>
        <span className="status-bar-item">Cells {tissue?.cellCount ?? "—"}</span>
        <span className="status-bar-sep" aria-hidden="true">
          ·
        </span>
        <span className="status-bar-item">Synapses {tissue?.synapseCount ?? "—"}</span>
        <span className="status-bar-sep" aria-hidden="true">
          ·
        </span>
        <span className="status-bar-item">{tissue?.region ?? "—"}</span>
        <span className="status-bar-sep" aria-hidden="true">
          ·
        </span>
        <span className="status-bar-item">
          Age {tissue ? formatAge(tissue.ageSeconds) : "—"}
        </span>
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
        {!running ? (
          <>
            <span className="status-bar-sep" aria-hidden="true">
              ·
            </span>
            <span className="status-bar-item" data-testid="status-pause-reason">
              {pauseReason}
            </span>
          </>
        ) : null}
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
    </div>
  );
}
