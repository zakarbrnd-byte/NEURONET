import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_SIMULATION_SPEED,
  ThroughputMeter,
  loadStoredSimulationSpeed,
  persistSimulationSpeed,
  presetForSpeed,
  renderModeLabel,
  shortSpeedLabel,
  shouldShowTravelAnimations,
  SIMULATION_SPEED_PRESETS,
  SPEED_STORAGE_KEY,
  visualRefreshIntervalMs,
} from "./simulationSpeed";

describe("simulationSpeed presets", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("exposes all required presets with expected pacing", () => {
    expect(SIMULATION_SPEED_PRESETS.map((p) => p.id)).toEqual([
      "0.5x",
      "1x",
      "2x",
      "5x",
      "10x",
      "max",
    ]);
    expect(presetForSpeed("0.5x").stepDelayMs).toBe(1600);
    expect(presetForSpeed("1x").stepDelayMs).toBe(800);
    expect(presetForSpeed("2x").stepDelayMs).toBe(400);
    expect(presetForSpeed("5x").stepDelayMs).toBe(160);
    expect(presetForSpeed("10x").stepDelayMs).toBe(80);
    expect(presetForSpeed("max").stepDelayMs).toBe(0);
    expect(DEFAULT_SIMULATION_SPEED).toBe("1x");
  });

  it("maps render modes by speed", () => {
    expect(presetForSpeed("1x").renderMode).toBe("full");
    expect(presetForSpeed("2x").renderMode).toBe("full");
    expect(presetForSpeed("5x").renderMode).toBe("short");
    expect(presetForSpeed("10x").renderMode).toBe("sampled");
    expect(presetForSpeed("max").renderMode).toBe("summary");
    expect(shouldShowTravelAnimations("full")).toBe(true);
    expect(shouldShowTravelAnimations("sampled")).toBe(false);
    expect(shouldShowTravelAnimations("summary")).toBe(false);
    expect(renderModeLabel("sampled")).toBe("Sampled");
    expect(visualRefreshIntervalMs("sampled")).toBeGreaterThan(0);
    expect(visualRefreshIntervalMs("summary")).toBeGreaterThan(0);
    expect(visualRefreshIntervalMs("full")).toBe(0);
  });

  it("persists and restores selected speed; default is 1×", () => {
    expect(loadStoredSimulationSpeed()).toBe("1x");
    persistSimulationSpeed("5x");
    expect(window.localStorage.getItem(SPEED_STORAGE_KEY)).toBe("5x");
    expect(loadStoredSimulationSpeed()).toBe("5x");
    expect(shortSpeedLabel("5x")).toBe("5×");
    expect(shortSpeedLabel("max")).toBe("Max");
  });

  it("ThroughputMeter uses confirmed response timestamps", () => {
    const meter = new ThroughputMeter(2000);
    expect(meter.ticksPerSecond(1000)).toBe(0);
    meter.record(1000);
    meter.record(1500);
    meter.record(2000);
    // 2 intervals over 1000 ms → 2 ticks/s
    expect(meter.ticksPerSecond(2000)).toBeCloseTo(2, 5);
  });
});
