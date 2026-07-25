import type {
  HealthResponse,
  NetworkEvent,
  NetworkSnapshot,
  NetworkStepTrace,
} from "../types/neural";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE) {
    throw new ApiError(
      "No backend URL configured. Set VITE_API_BASE_URL to connect the observatory.",
      0,
    );
  }

  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) {
        message = body.error;
      }
    } catch {
      // Keep the default message.
    }
    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}

export const neuralApi = {
  hasConfiguredBackend(): boolean {
    return API_BASE.length > 0;
  },

  getHealth(): Promise<HealthResponse> {
    return request<HealthResponse>("/api/health");
  },

  getNetwork(): Promise<NetworkSnapshot> {
    return request<NetworkSnapshot>("/api/network");
  },

  getEvents(): Promise<NetworkEvent[]> {
    return request<NetworkEvent[]>("/api/events");
  },

  injectSignal(neuronId: string, amountMv: number): Promise<NetworkSnapshot> {
    return request<NetworkSnapshot>(`/api/neurons/${encodeURIComponent(neuronId)}/signals`, {
      method: "POST",
      body: JSON.stringify({ amountMv }),
    });
  },

  stepNetwork(): Promise<NetworkStepTrace> {
    return request<NetworkStepTrace>("/api/network/step", { method: "POST" });
  },

  resetNetwork(): Promise<NetworkSnapshot> {
    return request<NetworkSnapshot>("/api/network/reset", { method: "POST" });
  },
};
