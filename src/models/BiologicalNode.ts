import type { NeuronData, StepResult } from "../types/neuron";

const NEURON_ID = "NEURON-001";

/** How much activation fades toward zero each step. */
const ACTIVATION_DECAY = 0.05;

/** How much fatigue recovers toward zero each recovery step. */
const FATIGUE_RECOVERY = 0.05;

/** Fatigue gained when the neuron fires. */
const FIRE_FATIGUE = 0.2;

/** Steps the neuron must rest after firing. */
const REFRACTORY_PERIOD = 2;

/**
 * BiologicalNode — a beginner-friendly educational neuron.
 *
 * It can receive signals, accumulate activation, fire when the
 * threshold is crossed, rest during a refractory period, and recover.
 *
 * This is NOT a full biological simulation. It is a simple model that
 * makes one neuron principle visible in the Debug Board.
 */
export class BiologicalNode {
  private id: string;
  private activation: number;
  private threshold: number;
  private energy: number;
  private fatigue: number;
  private refractoryTicks: number;
  private fired: boolean;
  private tick: number;

  constructor() {
    this.id = NEURON_ID;
    this.activation = 0;
    this.threshold = 1.0;
    this.energy = 100;
    this.fatigue = 0;
    this.refractoryTicks = 0;
    this.fired = false;
    this.tick = 0;
  }

  /**
   * Add input current to activation.
   * Zero and negative amounts are ignored.
   */
  receiveSignal(amount: number): void {
    if (amount <= 0) {
      return;
    }

    this.activation += amount;
    this.clampValues();
  }

  /**
   * Advance the neuron by one tick.
   * Returns a simple result for the activity feed.
   */
  step(): StepResult {
    // Refractory: the neuron is resting and cannot fire yet.
    if (this.refractoryTicks > 0) {
      this.refractoryTicks -= 1;
      this.fired = false;
      this.decayActivation();
      this.recoverFatigue();
      this.clampValues();
      return "resting";
    }

    // Fire when accumulated activation crosses the threshold.
    if (this.activation >= this.threshold) {
      this.fire();
      this.clampValues();
      return "fired";
    }

    // Threshold not reached: rest quietly and recover.
    this.fired = false;
    this.decayActivation();
    this.recoverFatigue();
    this.tick += 1;
    this.clampValues();
    return "recovery";
  }

  reset(): void {
    this.activation = 0;
    this.threshold = 1.0;
    this.energy = 100;
    this.fatigue = 0;
    this.refractoryTicks = 0;
    this.fired = false;
    this.tick = 0;
  }

  /** Plain object for the React Debug Board. */
  getData(): NeuronData {
    return {
      id: this.id,
      activation: this.activation,
      threshold: this.threshold,
      energy: this.energy,
      fatigue: this.fatigue,
      refractoryTicks: this.refractoryTicks,
      fired: this.fired,
      tick: this.tick,
    };
  }

  private fire(): void {
    this.fired = true;
    this.activation = 0;
    this.energy = Math.max(0, this.energy - 1);
    this.fatigue += FIRE_FATIGUE;
    this.refractoryTicks = REFRACTORY_PERIOD;
    this.tick += 1;
  }

  private decayActivation(): void {
    this.activation = Math.max(0, this.activation - ACTIVATION_DECAY);
  }

  private recoverFatigue(): void {
    this.fatigue = Math.max(0, this.fatigue - FATIGUE_RECOVERY);
  }

  private clampValues(): void {
    this.activation = Math.max(0, this.activation);
    this.threshold = Math.max(0, this.threshold);
    this.energy = Math.max(0, Math.min(100, this.energy));
    this.fatigue = Math.max(0, this.fatigue);
    this.refractoryTicks = Math.max(0, Math.floor(this.refractoryTicks));
    this.tick = Math.max(0, this.tick);
  }
}

/** Weak Debug Board signal. */
export const WEAK_SIGNAL = 0.35;

/** Strong Debug Board signal (above threshold). */
export const STRONG_SIGNAL = 1.25;
