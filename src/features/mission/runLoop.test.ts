import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_OBSERVATION_LIMIT,
  decideRunContinuation,
  delay,
  runAutonomousLoop,
  type StepResult,
} from "./runLoop";
import type { NetworkStepTrace } from "../../types/neural";

function emptyTrace(tick: number): NetworkStepTrace {
  return {
    tick,
    firedNeuronIds: [],
    propagations: [],
    eventIds: [],
    environmentTrace: {
      eventsGenerated: [],
      receptorsActivated: [],
      sensoryDeliveries: [],
      activePatterns: [],
    },
    network: {
      tick,
      neurons: [],
      synapses: [],
      tissue: {
        label: "t",
        region: "r",
        alive: true,
        cellCount: 0,
        synapseCount: 0,
        ageSeconds: 0,
      },
      structural: {
        config: {
          enabled: true,
          evaluationIntervalTicks: 4,
          maxCandidateDistance: 0.55,
          minimumCoactivationScore: 1,
          candidateMaturationTicks: 2,
          creationReadinessThreshold: 0.65,
          creationHoldEvals: 1,
          pruningWeightThreshold: 5.5,
          pruningHealthThreshold: 0.5,
          pruningInactivityTicks: 28,
          pruningGraceTicks: 48,
          pruningCommitRiskThreshold: 0.78,
          pruningLowWeightDuration: 6,
          pruningLowHealthDuration: 6,
          pruningSustainedAtRiskEvals: 3,
          maxCandidates: 8,
          minTotalSynapses: 3,
          maxTotalSynapses: 12,
          maxOutgoingPerNeuron: 3,
          maxIncomingPerNeuron: 3,
          preserveDemoPath: true,
        },
        growthCandidates: [],
        latestEvaluationTick: null,
        candidateCount: 0,
        atRiskSynapseCount: 0,
        topology: {
          cellCount: 0,
          synapseCount: 0,
          candidateCount: 0,
          atRiskSynapseCount: 0,
          createdThisSession: 0,
          prunedThisSession: 0,
          maxSynapseCapacity: 12,
          minSynapseFloor: 3,
        },
        history: [],
      },
    },
  };
}

describe("decideRunContinuation", () => {
  it("continues through quiet / empty activity conditions", () => {
    expect(
      decideRunContinuation({
        mode: "continuous",
        stepsCompletedThisRun: 50,
        observationLimit: DEFAULT_OBSERVATION_LIMIT,
        userPaused: false,
        resetRequested: false,
        unmounted: false,
        backendFailed: false,
      }),
    ).toEqual({ stop: false });
  });

  it("stops only for user pause, reset, backend failure, or observation limit", () => {
    expect(
      decideRunContinuation({
        mode: "continuous",
        stepsCompletedThisRun: 12,
        observationLimit: 100,
        userPaused: true,
        resetRequested: false,
        unmounted: false,
        backendFailed: false,
      }).stop,
    ).toBe(true);

    expect(
      decideRunContinuation({
        mode: "observation",
        stepsCompletedThisRun: 100,
        observationLimit: 100,
        userPaused: false,
        resetRequested: false,
        unmounted: false,
        backendFailed: false,
      }),
    ).toEqual({ stop: true, reason: "Observation limit reached" });

    expect(
      decideRunContinuation({
        mode: "continuous",
        stepsCompletedThisRun: 1,
        observationLimit: 100,
        userPaused: false,
        resetRequested: true,
        unmounted: false,
        backendFailed: false,
      }),
    ).toEqual({ stop: true, reason: "Reset" });

    expect(
      decideRunContinuation({
        mode: "continuous",
        stepsCompletedThisRun: 1,
        observationLimit: 100,
        userPaused: false,
        resetRequested: false,
        unmounted: false,
        backendFailed: true,
      }),
    ).toEqual({ stop: true, reason: "Backend unavailable" });
  });

  it("does not silently stop continuous mode at 12 steps", () => {
    expect(
      decideRunContinuation({
        mode: "continuous",
        stepsCompletedThisRun: 12,
        observationLimit: 100,
        userPaused: false,
        resetRequested: false,
        unmounted: false,
        backendFailed: false,
      }),
    ).toEqual({ stop: false });
  });
});

describe("runAutonomousLoop", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("continues through zero firing, zero propagation, and no environment event", async () => {
    const controller = new AbortController();
    let steps = 0;
    const inFlight = { value: 0, max: 0 };

    const stopPromise = new Promise<string>((resolve) => {
      void runAutonomousLoop({
        mode: "continuous",
        observationLimit: 100,
        stepDelayMs: 0,
        signal: controller.signal,
        isUserPaused: () => steps >= 5,
        isResetRequested: () => false,
        isUnmounted: () => false,
        stepOnce: async () => {
          inFlight.value += 1;
          inFlight.max = Math.max(inFlight.max, inFlight.value);
          await Promise.resolve();
          inFlight.value -= 1;
          steps += 1;
          const trace = emptyTrace(steps);
          // Explicit quiet empty StepTrace
          expect(trace.firedNeuronIds).toHaveLength(0);
          expect(trace.propagations).toHaveLength(0);
          expect(trace.environmentTrace?.eventsGenerated ?? []).toHaveLength(0);
          return { ok: true, trace } satisfies StepResult<NetworkStepTrace>;
        },
        onStop: (reason) => resolve(reason),
      });
    });

    await expect(stopPromise).resolves.toBe("User paused");
    expect(steps).toBe(5);
    expect(inFlight.max).toBe(1);
  });

  it("observation mode stops only at configured limit", async () => {
    const controller = new AbortController();
    let steps = 0;
    const reason = await new Promise<string>((resolve) => {
      void runAutonomousLoop({
        mode: "observation",
        observationLimit: 7,
        stepDelayMs: 0,
        signal: controller.signal,
        isUserPaused: () => false,
        isResetRequested: () => false,
        isUnmounted: () => false,
        stepOnce: async () => {
          steps += 1;
          return { ok: true, trace: emptyTrace(steps) };
        },
        onStop: (r) => resolve(r),
      });
    });
    expect(reason).toBe("Observation limit reached");
    expect(steps).toBe(7);
  });

  it("backend failure pauses with explicit error reason", async () => {
    const controller = new AbortController();
    const reason = await new Promise<string>((resolve) => {
      void runAutonomousLoop({
        mode: "continuous",
        observationLimit: 100,
        stepDelayMs: 0,
        signal: controller.signal,
        isUserPaused: () => false,
        isResetRequested: () => false,
        isUnmounted: () => false,
        stepOnce: async () => ({ ok: false, backendFailed: true }),
        onStop: (r) => resolve(r),
      });
    });
    expect(reason).toBe("Backend unavailable");
  });

  it("reset stops the active run loop", async () => {
    const controller = new AbortController();
    let steps = 0;
    let reset = false;
    const reason = await new Promise<string>((resolve) => {
      void runAutonomousLoop({
        mode: "continuous",
        observationLimit: 100,
        stepDelayMs: 0,
        signal: controller.signal,
        isUserPaused: () => false,
        isResetRequested: () => reset,
        isUnmounted: () => false,
        stepOnce: async () => {
          steps += 1;
          if (steps === 2) {
            reset = true;
            controller.abort();
          }
          return { ok: true, trace: emptyTrace(steps) };
        },
        onStop: (r) => resolve(r),
      });
    });
    expect(reason).toBe("Reset");
    expect(steps).toBeGreaterThanOrEqual(2);
  });

  it("component unmount cancels the loop", async () => {
    const controller = new AbortController();
    let unmounted = false;
    let steps = 0;
    const reason = await new Promise<string>((resolve) => {
      void runAutonomousLoop({
        mode: "continuous",
        observationLimit: 100,
        stepDelayMs: 0,
        signal: controller.signal,
        isUserPaused: () => false,
        isResetRequested: () => false,
        isUnmounted: () => unmounted,
        stepOnce: async () => {
          steps += 1;
          if (steps === 1) {
            unmounted = true;
            controller.abort();
          }
          return { ok: true, trace: emptyTrace(steps) };
        },
        onStop: (r) => resolve(r),
      });
    });
    expect(reason).toBe("User paused");
  });

  it("requests never overlap", async () => {
    const controller = new AbortController();
    let concurrent = 0;
    let maxConcurrent = 0;
    let steps = 0;
    await new Promise<void>((resolve) => {
      void runAutonomousLoop({
        mode: "observation",
        observationLimit: 4,
        stepDelayMs: 1,
        signal: controller.signal,
        isUserPaused: () => false,
        isResetRequested: () => false,
        isUnmounted: () => false,
        stepOnce: async () => {
          concurrent += 1;
          maxConcurrent = Math.max(maxConcurrent, concurrent);
          await delay(5);
          concurrent -= 1;
          steps += 1;
          return { ok: true, trace: emptyTrace(steps) };
        },
        onStop: () => resolve(),
      });
    });
    expect(maxConcurrent).toBe(1);
    expect(steps).toBe(4);
  });

  it("empty StepTrace does not pause continuous mode", async () => {
    const controller = new AbortController();
    let steps = 0;
    await new Promise<void>((resolve) => {
      void runAutonomousLoop({
        mode: "observation",
        observationLimit: 3,
        stepDelayMs: 0,
        signal: controller.signal,
        isUserPaused: () => false,
        isResetRequested: () => false,
        isUnmounted: () => false,
        stepOnce: async () => {
          steps += 1;
          return { ok: true, trace: emptyTrace(steps) };
        },
        onStop: () => resolve(),
      });
    });
    expect(steps).toBe(3);
  });

  it("continuous mode does not silently stop at 12 steps", async () => {
    const controller = new AbortController();
    let steps = 0;
    const reason = await new Promise<string>((resolve) => {
      void runAutonomousLoop({
        mode: "continuous",
        observationLimit: 100,
        stepDelayMs: 0,
        signal: controller.signal,
        isUserPaused: () => steps >= 15,
        isResetRequested: () => false,
        isUnmounted: () => false,
        stepOnce: async () => {
          steps += 1;
          return { ok: true, trace: emptyTrace(steps) };
        },
        onStop: (r) => resolve(r),
      });
    });
    expect(steps).toBe(15);
    expect(reason).toBe("User paused");
  });
});
