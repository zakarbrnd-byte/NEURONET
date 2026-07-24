import type { CellStatus } from "@shared/api-types";
import { EnergyBar } from "./EnergyBar";

interface DigitalCellPanelProps {
  status: CellStatus | null;
}

function formatTimestamp(value: string | undefined): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

function formatUptime(seconds: number | undefined): string {
  if (seconds === undefined) {
    return "—";
  }
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs}s`;
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

export function DigitalCellPanel({ status }: DigitalCellPanelProps) {
  return (
    <section className="panel cell-panel" aria-labelledby="cell-panel-title">
      <div className="panel__header">
        <h2 id="cell-panel-title">Digital Cell</h2>
        <p>Live organism telemetry</p>
      </div>

      <EnergyBar energy={status?.energy ?? 0} />

      <dl className="metrics">
        <div>
          <dt>Status</dt>
          <dd className="metrics__state">{status?.state ?? "—"}</dd>
        </div>
        <div>
          <dt>Tick</dt>
          <dd>{status?.tick ?? "—"}</dd>
        </div>
        <div>
          <dt>Energy</dt>
          <dd>{status ? `${status.energy}%` : "—"}</dd>
        </div>
        <div>
          <dt>State</dt>
          <dd>{status?.state ?? "—"}</dd>
        </div>
        <div>
          <dt>Memory Count</dt>
          <dd>{status?.memoryCount ?? "—"}</dd>
        </div>
        <div>
          <dt>Message Queue</dt>
          <dd>{status?.messageQueue ?? "—"}</dd>
        </div>
        <div className="metrics__wide">
          <dt>Creation Time</dt>
          <dd>{formatTimestamp(status?.createdAt)}</dd>
        </div>
        <div>
          <dt>Uptime</dt>
          <dd>{formatUptime(status?.uptimeSeconds)}</dd>
        </div>
        <div className="metrics__wide">
          <dt>Cell ID</dt>
          <dd className="metrics__mono">{status?.id ?? "—"}</dd>
        </div>
      </dl>
    </section>
  );
}
