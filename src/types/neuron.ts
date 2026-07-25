/**
 * Snapshot of one BiologicalNode for the Debug Board.
 * React receives this from getData() and never mutates neuron internals.
 */
export interface NeuronData {
  id: string;
  activation: number;
  threshold: number;
  energy: number;
  fatigue: number;
  refractoryTicks: number;
  fired: boolean;
  tick: number;
}

/** Result label returned by BiologicalNode.step() for activity logging. */
export type StepResult = "fired" | "resting" | "recovery";
