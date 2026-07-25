/** Backend network snapshot types. Frontend never invents these values. */

export interface NeuronSnapshot {
  id: string;
  restingPotentialMv: number;
  membranePotentialMv: number;
  thresholdMv: number;
  energy: number;
  fatigue: number;
  refractoryTicks: number;
  fired: boolean;
  tick: number;
}

export interface ConnectionSnapshot {
  id: string;
  sourceNeuronId: string;
  targetNeuronId: string;
  weight: number;
  connectionType: "excitatory";
}

export interface NetworkSnapshot {
  tick: number;
  neurons: NeuronSnapshot[];
  connections: ConnectionSnapshot[];
}

export interface NetworkEvent {
  id: string;
  timestamp: string;
  networkTick: number;
  type: string;
  neuronId?: string;
  sourceNeuronId?: string;
  targetNeuronId?: string;
  message: string;
}

export interface HealthResponse {
  status: string;
  version: string;
}

export type ConnectionStatus = "connected" | "connecting" | "unavailable";

export type ElectricalState = "Resting" | "Depolarizing" | "Fired" | "Refractory";

export function electricalState(neuron: NeuronSnapshot): ElectricalState {
  if (neuron.fired) {
    return "Fired";
  }
  if (neuron.refractoryTicks > 0) {
    return "Refractory";
  }
  if (neuron.membranePotentialMv > neuron.restingPotentialMv) {
    return "Depolarizing";
  }
  return "Resting";
}

export function distanceToThresholdMv(neuron: NeuronSnapshot): number {
  return neuron.thresholdMv - neuron.membranePotentialMv;
}
