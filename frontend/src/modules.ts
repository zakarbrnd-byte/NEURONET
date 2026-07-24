import type { MissionModule } from "@shared/api-types";

/**
 * Permanent Mission Control module registry.
 *
 * Future versions activate modules by flipping `enabled`. The sidebar layout
 * never requires redesign.
 */
export const MISSION_MODULES: MissionModule[] = [
  { id: "digital-cell", label: "Digital Cell", enabled: true },
  { id: "network-map", label: "Network Map", enabled: false },
  { id: "experiment-lab", label: "Experiment Lab", enabled: false },
  { id: "memory-explorer", label: "Memory Explorer", enabled: false },
  { id: "evolution-monitor", label: "Evolution Monitor", enabled: false },
  { id: "metrics", label: "Metrics", enabled: false },
  { id: "time-machine", label: "Time Machine", enabled: false },
  { id: "brain-graph", label: "Brain Graph", enabled: false },
  { id: "node-inspector", label: "Node Inspector", enabled: false },
  { id: "settings", label: "Settings", enabled: false },
];
