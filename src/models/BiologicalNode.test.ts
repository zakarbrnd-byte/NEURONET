import { describe, expect, it } from "vitest";
import {
  BiologicalNode,
  STRONG_SIGNAL,
  WEAK_SIGNAL,
} from "./BiologicalNode";

describe("BiologicalNode", () => {
  it("starts in the initial resting state", () => {
    const neuron = new BiologicalNode();
    const data = neuron.getData();

    expect(data.id).toBe("NEURON-001");
    expect(data.activation).toBe(0);
    expect(data.threshold).toBe(1);
    expect(data.energy).toBe(100);
    expect(data.fatigue).toBe(0);
    expect(data.refractoryTicks).toBe(0);
    expect(data.fired).toBe(false);
    expect(data.tick).toBe(0);
  });

  it("does not fire after a weak signal", () => {
    const neuron = new BiologicalNode();

    neuron.receiveSignal(WEAK_SIGNAL);
    expect(neuron.getData().activation).toBeCloseTo(0.35);

    const result = neuron.step();
    const data = neuron.getData();

    expect(result).toBe("recovery");
    expect(data.fired).toBe(false);
    expect(data.activation).toBeLessThan(0.35);
    expect(data.activation).toBeGreaterThan(0);
    expect(data.energy).toBe(100);
  });

  it("fires after a strong signal", () => {
    const neuron = new BiologicalNode();

    neuron.receiveSignal(STRONG_SIGNAL);
    expect(neuron.getData().activation).toBeCloseTo(1.25);

    const result = neuron.step();
    const data = neuron.getData();

    expect(result).toBe("fired");
    expect(data.fired).toBe(true);
    expect(data.activation).toBe(0);
    expect(data.energy).toBe(99);
    expect(data.fatigue).toBeCloseTo(0.2);
    expect(data.refractoryTicks).toBe(2);
    expect(data.tick).toBe(1);
  });

  it("ignores zero and negative signals", () => {
    const neuron = new BiologicalNode();

    neuron.receiveSignal(0);
    neuron.receiveSignal(-2);
    expect(neuron.getData().activation).toBe(0);
  });

  it("prevents firing while refractory", () => {
    const neuron = new BiologicalNode();

    neuron.receiveSignal(STRONG_SIGNAL);
    neuron.step();
    expect(neuron.getData().refractoryTicks).toBe(2);

    // Strong input again during refractory rest.
    neuron.receiveSignal(STRONG_SIGNAL);
    const result = neuron.step();
    const data = neuron.getData();

    expect(result).toBe("resting");
    expect(data.fired).toBe(false);
    expect(data.refractoryTicks).toBe(1);
    expect(data.energy).toBe(99);
  });

  it("recovers fatigue over resting steps", () => {
    const neuron = new BiologicalNode();

    neuron.receiveSignal(STRONG_SIGNAL);
    neuron.step();
    const fatigueAfterFire = neuron.getData().fatigue;
    expect(fatigueAfterFire).toBeCloseTo(0.2);

    neuron.step(); // resting
    neuron.step(); // resting
    // After refractory ends, another recovery step.
    neuron.step();

    expect(neuron.getData().fatigue).toBeLessThan(fatigueAfterFire);
    expect(neuron.getData().fatigue).toBeGreaterThanOrEqual(0);
  });

  it("decays activation when the neuron does not fire", () => {
    const neuron = new BiologicalNode();

    neuron.receiveSignal(WEAK_SIGNAL);
    const before = neuron.getData().activation;
    neuron.step();
    const after = neuron.getData().activation;

    expect(after).toBeLessThan(before);
    expect(after).toBeGreaterThanOrEqual(0);
  });

  it("never lets energy go below zero", () => {
    const neuron = new BiologicalNode();

    for (let i = 0; i < 120; i += 1) {
      // Wait out refractory if needed, then fire again.
      while (neuron.getData().refractoryTicks > 0) {
        neuron.step();
      }
      neuron.receiveSignal(STRONG_SIGNAL);
      neuron.step();
    }

    expect(neuron.getData().energy).toBe(0);
    expect(neuron.getData().energy).toBeGreaterThanOrEqual(0);
  });

  it("reset restores the initial state", () => {
    const neuron = new BiologicalNode();

    neuron.receiveSignal(STRONG_SIGNAL);
    neuron.step();
    neuron.receiveSignal(WEAK_SIGNAL);
    neuron.step();
    neuron.reset();

    const data = neuron.getData();
    expect(data.id).toBe("NEURON-001");
    expect(data.activation).toBe(0);
    expect(data.threshold).toBe(1);
    expect(data.energy).toBe(100);
    expect(data.fatigue).toBe(0);
    expect(data.refractoryTicks).toBe(0);
    expect(data.fired).toBe(false);
    expect(data.tick).toBe(0);
  });
});
