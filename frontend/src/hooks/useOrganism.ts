import { useCallback, useEffect, useRef, useState } from "react";
import type { ActivityEvent, CellStatus, ControlCommand } from "@shared/api-types";
import { neuronetClient } from "../api/client";

const POLL_INTERVAL_MS = 1000;

export interface OrganismViewModel {
  status: CellStatus | null;
  events: ActivityEvent[];
  version: string;
  online: boolean;
  error: string | null;
  busy: boolean;
  refresh: () => Promise<void>;
  wake: () => Promise<void>;
  sleep: () => Promise<void>;
  stepTick: () => Promise<void>;
  injectMessage: (payload: string) => Promise<void>;
}

export function useOrganism(): OrganismViewModel {
  const [status, setStatus] = useState<CellStatus | null>(null);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [version, setVersion] = useState("0.15");
  const [online, setOnline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const [nextStatus, nextEvents] = await Promise.all([
        neuronetClient.getStatus(),
        neuronetClient.getLogs(),
      ]);
      if (!mounted.current) {
        return;
      }
      setStatus(nextStatus);
      setEvents(nextEvents);
      setOnline(true);
      setError(null);
    } catch (err) {
      if (!mounted.current) {
        return;
      }
      setOnline(false);
      setError(err instanceof Error ? err.message : "Observatory unreachable");
    }
  }, []);

  const runCommand = useCallback(
    async (command: ControlCommand) => {
      setBusy(true);
      try {
        await neuronetClient.control(command);
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Control command failed");
      } finally {
        setBusy(false);
      }
    },
    [refresh],
  );

  const injectMessage = useCallback(
    async (payload: string) => {
      setBusy(true);
      try {
        await neuronetClient.sendMessage(payload);
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Message injection failed");
      } finally {
        setBusy(false);
      }
    },
    [refresh],
  );

  useEffect(() => {
    mounted.current = true;
    void neuronetClient
      .getMeta()
      .then((meta) => {
        if (mounted.current) {
          setVersion(meta.version);
        }
      })
      .catch(() => {
        // Meta is optional for first paint; status polling will surface errors.
      });

    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, POLL_INTERVAL_MS);

    return () => {
      mounted.current = false;
      window.clearInterval(timer);
    };
  }, [refresh]);

  return {
    status,
    events,
    version,
    online,
    error,
    busy,
    refresh,
    wake: () => runCommand("wake"),
    sleep: () => runCommand("sleep"),
    stepTick: () => runCommand("tick"),
    injectMessage,
  };
}
