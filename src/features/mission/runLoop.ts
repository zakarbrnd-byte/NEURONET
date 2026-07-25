/** Version 0.8.1/0.8.2 — run modes, pause reasons, adjustable pacing (no activity auto-pause). */

export type RunMode = "continuous" | "observation";

export type PauseReason =
  | "None"
  | "User paused"
  | "Observation limit reached"
  | "Backend unavailable"
  | "Reset";

export const DEFAULT_OBSERVATION_LIMIT = 100;
/** Historical 1× Normal pacing (0.8.1 default). */
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

/**
 * Async delay that always yields to the browser event loop.
 * Max mode (0 ms) still uses setTimeout(0) so Pause/Reset remain responsive.
 */
export async function delay(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    return;
  }
  const wait = Math.max(0, ms);
  await new Promise<void>((resolve) => {
    const timer = window.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, wait);
    const onAbort = () => {
      window.clearTimeout(timer);
      resolve();
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export type StepResult<T> =
  | { ok: true; trace: T; latencyMs: number }
  | { ok: false; backendFailed: boolean };

export interface RunLoopHooks<T> {
  mode: RunMode;
  observationLimit: number;
  /**
   * Read the intentional inter-request delay for the next pacing wait.
   * Called after each confirmed step so speed can change while running.
   */
  getStepDelayMs: () => number;
  signal: AbortSignal;
  isUserPaused: () => boolean;
  isResetRequested: () => boolean;
  isUnmounted: () => boolean;
  /** Must await the backend and never overlap callers externally. */
  stepOnce: () => Promise<StepResult<T>>;
  onStepComplete?: (trace: T, stepsCompleted: number, latencyMs: number) => void;
  onStop: (reason: Exclude<PauseReason, "None">) => void;
}

/**
 * Sequential run loop: one awaited backend step at a time.
 * Empty / quiet StepTrace results do not pause.
 * Max mode yields via delay(0) between requests — never a tight sync loop.
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
    hooks.onStepComplete?.(result.trace, stepsCompleted, result.latencyMs);

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

    // Live speed: read delay after the step so a mid-run change applies next wait.
    const pacingMs = hooks.getStepDelayMs();
    await delay(pacingMs, hooks.signal);
  }

  if (hooks.isResetRequested()) {
    hooks.onStop("Reset");
  } else if (hooks.isUserPaused() || hooks.isUnmounted()) {
    hooks.onStop("User paused");
  }
}
