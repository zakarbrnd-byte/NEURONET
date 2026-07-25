/** Frontend-only Mission Control UI state (not backend simulation state). */

export type MissionPanel =
  | "network"
  | "tissue"
  | "node"
  | "synapse"
  | "timeline"
  | "controls";

export type MainView = "network" | "tissue";

export type NodeCategory = "electrical" | "recovery" | "connections" | "history" | "biology";

export type TimelineFilter = "all" | "fired" | "signals" | "recovery";

export type ControlsCategory = "stimulus" | "time" | "reset";
