/** Frontend-only Mission Control UI state (not backend simulation state). */

export type MissionPanel = "network" | "node" | "timeline" | "controls";

export type NodeCategory = "electrical" | "recovery" | "connections" | "history";

export type TimelineFilter = "all" | "fired" | "signals" | "recovery";

export type ControlsCategory = "stimulus" | "time" | "reset";
