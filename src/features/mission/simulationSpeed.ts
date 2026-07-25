/** Version 0.8.2 — UI simulation pacing (does not alter tick biology). */

export type SimulationSpeedId =
  | "0.5x"
  | "1x"
  | "2x"
  | "5x"
  | "10x"
  | "max";

export type RenderMode = "full" | "short" | "sampled" | "summary";

export interface SimulationSpeedPreset {
  id: SimulationSpeedId;
  label: string;
  /** Intentional delay after each confirmed step before the next request. */
  stepDelayMs: number;
  renderMode: RenderMode;
  /** Optional future batch size; 1 = sequential single-tick requests. */
  batchSize: number;
}

export const SPEED_STORAGE_KEY = "neuronet.simulationSpeed";

export const SIMULATION_SPEED_PRESETS: readonly SimulationSpeedPreset[] = [
  { id: "0.5x", label: "0.5× Observe", stepDelayMs: 1600, renderMode: "full", batchSize: 1 },
  { id: "1x", label: "1× Normal", stepDelayMs: 800, renderMode: "full", batchSize: 1 },
  { id: "2x", label: "2× Fast", stepDelayMs: 400, renderMode: "full", batchSize: 1 },
  { id: "5x", label: "5× Development", stepDelayMs: 160, renderMode: "short", batchSize: 1 },
  { id: "10x", label: "10× Long Run", stepDelayMs: 80, renderMode: "sampled", batchSize: 1 },
  { id: "max", label: "Max", stepDelayMs: 0, renderMode: "summary", batchSize: 1 },
] as const;

export const DEFAULT_SIMULATION_SPEED: SimulationSpeedId = "1x";

export function presetForSpeed(id: SimulationSpeedId): SimulationSpeedPreset {
  return (
    SIMULATION_SPEED_PRESETS.find((preset) => preset.id === id) ??
    SIMULATION_SPEED_PRESETS[1]
  );
}

export function shortSpeedLabel(id: SimulationSpeedId): string {
  if (id === "max") return "Max";
  return id.replace("x", "×");
}

export function renderModeLabel(mode: RenderMode): string {
  switch (mode) {
    case "full":
      return "Full";
    case "short":
      return "Short";
    case "sampled":
      return "Sampled";
    case "summary":
      return "Summary";
  }
}

export function isSimulationSpeedId(value: string): value is SimulationSpeedId {
  return SIMULATION_SPEED_PRESETS.some((preset) => preset.id === value);
}

export function loadStoredSimulationSpeed(): SimulationSpeedId {
  try {
    const raw = window.localStorage.getItem(SPEED_STORAGE_KEY);
    if (raw && isSimulationSpeedId(raw)) {
      return raw;
    }
  } catch {
    // Ignore storage failures — default applies.
  }
  return DEFAULT_SIMULATION_SPEED;
}

export function persistSimulationSpeed(id: SimulationSpeedId): void {
  try {
    window.localStorage.setItem(SPEED_STORAGE_KEY, id);
  } catch {
    // Ignore quota / private-mode failures.
  }
}

/** Visual snapshot refresh cadence for sampled/summary modes (ms). */
export function visualRefreshIntervalMs(mode: RenderMode): number {
  if (mode === "sampled") return 150;
  if (mode === "summary") return 200;
  return 0;
}

export function shouldShowTravelAnimations(mode: RenderMode): boolean {
  return mode === "full" || mode === "short";
}

/**
 * Rolling throughput from confirmed backend step completion timestamps.
 * Window: last ~2 real-world seconds of confirmations.
 */
export class ThroughputMeter {
  private stamps: number[] = [];
  private readonly windowMs: number;

  constructor(windowMs = 2000) {
    this.windowMs = windowMs;
  }

  reset(): void {
    this.stamps = [];
  }

  record(now = performance.now()): void {
    this.stamps.push(now);
    const cutoff = now - this.windowMs;
    while (this.stamps.length > 0 && this.stamps[0]! < cutoff) {
      this.stamps.shift();
    }
  }

  /** Confirmed ticks per real-world second; 0 until two samples exist. */
  ticksPerSecond(now = performance.now()): number {
    const cutoff = now - this.windowMs;
    const recent = this.stamps.filter((t) => t >= cutoff);
    if (recent.length < 2) {
      return 0;
    }
    const spanMs = recent[recent.length - 1]! - recent[0]!;
    if (spanMs <= 0) {
      return 0;
    }
    return ((recent.length - 1) / spanMs) * 1000;
  }
}
