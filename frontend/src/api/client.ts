/**
 * Observatory client boundary.
 *
 * Mission Control talks to the organism through this interface. v0.15 uses REST
 * polling; a WebSocket implementation can replace RestNeuronetClient later
 * without rewriting panels.
 */

import type {
  ActivityEvent,
  CellStatus,
  ControlCommand,
  ControlResponse,
  LogsResponse,
  MessageResponse,
  MetaResponse,
} from "@shared/api-types";

export interface NeuronetClient {
  getMeta(): Promise<MetaResponse>;
  getStatus(): Promise<CellStatus>;
  getLogs(): Promise<ActivityEvent[]>;
  sendMessage(payload: string): Promise<MessageResponse>;
  control(command: ControlCommand): Promise<ControlResponse>;
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) {
        detail = body.error;
      }
    } catch {
      // Keep status text when the body is not JSON.
    }
    throw new Error(`Observatory request failed (${response.status}): ${detail}`);
  }
  return response.json() as Promise<T>;
}

/** REST transport for Mission Control. */
export class RestNeuronetClient implements NeuronetClient {
  constructor(private readonly baseUrl = "/api") {}

  async getMeta(): Promise<MetaResponse> {
    const response = await fetch(`${this.baseUrl}/meta`);
    return readJson<MetaResponse>(response);
  }

  async getStatus(): Promise<CellStatus> {
    const response = await fetch(`${this.baseUrl}/status`);
    return readJson<CellStatus>(response);
  }

  async getLogs(): Promise<ActivityEvent[]> {
    const response = await fetch(`${this.baseUrl}/logs`);
    const body = await readJson<LogsResponse>(response);
    return body.events;
  }

  async sendMessage(payload: string): Promise<MessageResponse> {
    const response = await fetch(`${this.baseUrl}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload }),
    });
    return readJson<MessageResponse>(response);
  }

  async control(command: ControlCommand): Promise<ControlResponse> {
    const response = await fetch(`${this.baseUrl}/control`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command }),
    });
    return readJson<ControlResponse>(response);
  }
}

export const neuronetClient: NeuronetClient = new RestNeuronetClient();
