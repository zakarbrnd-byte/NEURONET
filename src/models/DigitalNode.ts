import type { NodeData, NodeState } from "../types/node";

const NODE_ID = "NODE-001";

/**
 * DigitalNode owns the node's data and behavior.
 * The React UI reads snapshots through getData() and never
 * changes energy, state, tick, or messages on its own.
 */
export class DigitalNode {
  private id: string;
  private state: NodeState;
  private energy: number;
  private tick: number;
  private lastMessage: string;

  constructor() {
    this.id = NODE_ID;
    this.state = "Sleeping";
    this.energy = 100;
    this.tick = 0;
    this.lastMessage = "None";
  }

  receiveMessage(message: string): void {
    if (message.trim() === "") {
      return;
    }

    this.state = "Awake";
    this.energy = Math.max(0, this.energy - 1);
    this.tick += 1;
    this.lastMessage = message;
  }

  sleep(): void {
    this.state = "Sleeping";
    this.tick += 1;
  }

  wake(): void {
    this.state = "Awake";
    this.tick += 1;
  }

  reset(): void {
    this.state = "Sleeping";
    this.energy = 100;
    this.tick = 0;
    this.lastMessage = "None";
  }

  getData(): NodeData {
    return {
      id: this.id,
      state: this.state,
      energy: this.energy,
      tick: this.tick,
      lastMessage: this.lastMessage,
    };
  }
}
