/**
 * NEURONET Mission Control shared API contract.
 *
 * REST is the v0.15 transport. A future WebSocket client should emit and
 * consume these same shapes so the UI layer does not need redesign.
 */

export type CellState = "Sleeping" | "Awake" | "Processing";

export type ControlCommand = "wake" | "sleep" | "tick";

export interface CellStatus {
  id: string;
  tick: number;
  state: CellState | string;
  energy: number;
  memoryCount: number;
  messageQueue: number;
  createdAt: string;
  uptimeSeconds: number;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  cellId: string;
  category: string;
  detail: string;
}

export interface LogsResponse {
  events: ActivityEvent[];
}

export interface MessageInjection {
  payload: string;
}

export interface MessageResponse {
  accepted: boolean;
  messageId: string;
}

export interface ControlRequest {
  command: ControlCommand | string;
}

export interface ControlResponse {
  accepted: boolean;
  command: string;
  status: CellStatus;
}

export interface MetaResponse {
  name: string;
  product: string;
  description: string;
  version: string;
  transport: string;
  lifeLoopActive: boolean;
}

/** Stable module registry for the Mission Control sidebar. */
export type MissionModuleId =
  | "digital-cell"
  | "network-map"
  | "experiment-lab"
  | "memory-explorer"
  | "evolution-monitor"
  | "metrics"
  | "time-machine"
  | "brain-graph"
  | "node-inspector"
  | "settings";

export interface MissionModule {
  id: MissionModuleId;
  label: string;
  enabled: boolean;
}
