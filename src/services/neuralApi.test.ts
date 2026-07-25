import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("neuralApi", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("reports missing backend configuration", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "");
    const { neuralApi } = await import("./neuralApi");
    expect(neuralApi.hasConfiguredBackend()).toBe(false);
    await expect(neuralApi.getNetwork()).rejects.toThrow(/No backend URL/);
  });

  it("calls inject, step, and reset endpoints", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://127.0.0.1:3000");
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ tick: 0, neurons: [], connections: [] }),
    } as Response);

    const { neuralApi } = await import("./neuralApi");

    await neuralApi.injectSignal("NEURON-001", 5);
    await neuralApi.stepNetwork();
    await neuralApi.resetNetwork();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:3000/api/neurons/NEURON-001/signals",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:3000/api/network/step",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:3000/api/network/reset",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
