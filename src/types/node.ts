export type NodeState = "Sleeping" | "Awake";

export interface NodeData {
  id: string;
  state: NodeState;
  energy: number;
  tick: number;
  lastMessage: string;
}
