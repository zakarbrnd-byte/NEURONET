import type { NodeData } from "../types/node";

export const INITIAL_NODE: NodeData = {
  id: "NODE-001",
  state: "Sleeping",
  energy: 100,
  tick: 0,
  lastMessage: "None",
};

export const INITIAL_ACTIVITY: string[] = [
  "Debug Board started",
  "Mock node created",
  "Waiting for input",
];
