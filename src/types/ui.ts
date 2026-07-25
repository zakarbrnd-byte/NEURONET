/** Frontend-only Mission Control UI state (not backend simulation state). */

export type MissionPanel =
  | "network"
  | "tissue"
  | "node"
  | "synapse"
  | "candidate"
  | "timeline"
  | "controls";

export type MainView = "network" | "tissue";

/** Frontend-only Tissue canvas emphasis (does not mutate backend). */
export type TissueDisplayMode = "activity" | "structure" | "development";

export type NodeCategory = "electrical" | "recovery" | "connections" | "history" | "biology";

export type TimelineFilter =
  | "all"
  | "fired"
  | "signals"
  | "recovery"
  | "candidates"
  | "maturation"
  | "pruning"
  | "birth"
  | "prune"
  | "blocked"
  | "devBirth"
  | "differentiation"
  | "migration"
  | "settlement"
  | "capacity";

export type ControlsCategory = "stimulus" | "time" | "structure" | "reset";
