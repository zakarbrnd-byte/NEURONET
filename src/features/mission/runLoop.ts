/** Version 0.8.1 — explicit run modes and pause reasons (no activity-based auto-pause). */

export type RunMode = "continuous" | "observation";

export type PauseReason =
  | "None"
  | "User paused"
  | "Observation limit reached"
  | "Backend unavailable"
  | "Reset";

export const DEFAULT_OBSERVATION_LIMIT = 100;
export const DEFAULT_STEP_DELAY_MS = 800;

export type RunStopDecision =
  | { stop: false }
  | { stop: true; reason: Exclude<PauseReason, "None"> };

/**
 * Decide whether the autonomous run loop should stop after a completed step.
 * Quiet ticks, empty StepTrace payloads, and absent environment events never stop the run.
 */
export function decideRunContinuation(input: {
  mode: RunMode;
  stepsCompletedThisRun: number;
  observationLimit: number;
  userPaused: boolean;
  resetRequested: boolean;
  unmounted: boolean;
  backendFailed: boolean;
}): RunStopDecision {
  if (input.unmounted) {
    return { stop: true, reason: "User paused" };
  }
  if (input.resetRequested) {
    return { stop: true, reason: "Reset" };
  }
  if (input.userPaused) {
    return { stop: true, reason: "User paused" };
  }
  if (input.backendFailed) {
    return { stop: true, reason: "Backend unavailable" };
  }
  if (
    input.mode === "observation" &&
    input.stepsCompletedThisRun >= input.observationLimit
  ) {
    return { stop: true, reason: "Observation limit reached" };
  }
  return { stop: false };
}

export async function delay(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    return;
  }
  await new Promise<void>((resolve) => {
    const timer = window.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      window.clearTimeout(timer);
      resolve();
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export type StepResult<T> =
  | { ok: true; trace: T }
  | { ok: false; backendFailed: boolean };

export interface RunLoopHooks<T> {
  mode: RunMode;
  observationLimit: number;
  stepDelayMs: number;
  signal: AbortSignal;
  isUserPaused: () => boolean;
  isResetRequested: () => boolean;
  isUnmounted: () => boolean;
  /** Must await the backend and never overlap callers externally. */
  stepOnce: () => Promise<StepResult<T>>;
  onStepComplete?: (trace: T, stepsCompleted: number) => void;
  onStop: (reason: Exclude<PauseReason, "None">) => void;
}

/**
 * Sequential run loop: one awaited backend step at a time.
 * Empty / quiet StepTrace results do not pause.
 */
export async function runAutonomousLoop<T>(hooks: RunLoopHooks<T>): Promise<void> {
  let stepsCompleted = 0;

  while (!hooks.signal.aborted) {
    const pre = decideRunContinuation({
      mode: hooks.mode,
      stepsCompletedThisRun: stepsCompleted,
      observationLimit: hooks.observationLimit,
      userPaused: hooks.isUserPaused(),
      resetRequested: hooks.isResetRequested(),
      unmounted: hooks.isUnmounted(),
      backendFailed: false,
    });
    if (pre.stop) {
      hooks.onStop(pre.reason);
      return;
    }

    const result = await hooks.stepOnce();
    if (!result.ok) {
      const reason = result.backendFailed ? "Backend unavailable" : "User paused";
      hooks.onStop(reason);
      return;
    }

    stepsCompleted += 1;
    hooks.onStepComplete?.(result.trace, stepsCompleted);

    const post = decideRunContinuation({
      mode: hooks.mode,
      stepsCompletedThisRun: stepsCompleted,
      observationLimit: hooks.observationLimit,
      userPaused: hooks.isUserPaused(),
      resetRequested: hooks.isResetRequested(),
      unmounted: hooks.isUnmounted(),
      backendFailed: false,
    });
    if (post.stop) {
      hooks.onStop(post.reason);
      return;
    }

    await delay(hooks.stepDelayMs, hooks.signal);
  }

  if (hooks.isResetRequested()) {
    hooks.onStop("Reset");
  } else if (hooks.isUserPaused() || hooks.isUnmounted()) {
    hooks.onStop("User paused");
  }
}
