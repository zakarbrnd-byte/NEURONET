/** Backend network snapshot and step-trace types. Frontend never invents these values. */

export interface NeuronPosition {
  x: number;
  y: number;
}

export type CellType = "excitatory" | "inhibitory";
export type SynapseType = "excitatory" | "inhibitory";

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
  position: NeuronPosition;
  region: string;
  layer: number;
  cellType: CellType;
  dnaId: string;
  somaRadius: number;
  dendriteRadius: number;
  axonLength: number;
}

export interface WeightHistoryEntry {
  tick: number;
  weight: number;
}

/** Living synapse — first-class biological object (0.6B). */
export interface SynapseSnapshot {
  id: string;
  sourceNeuronId: string;
  targetNeuronId: string;
  weight: number;
  type: SynapseType;
  usageCount: number;
  lastActivatedTick: number | null;
  stability: number;
  health: number;
  age: number;
  creationTick: number;
  weightHistory: WeightHistoryEntry[];
  lastWeightDelta: number;
}

export interface TissueInfo {
  label: string;
  region: string;
  alive: boolean;
  cellCount: number;
  synapseCount: number;
  ageSeconds: number;
}

export interface NetworkSnapshot {
  tick: number;
  neurons: NeuronSnapshot[];
  synapses: SynapseSnapshot[];
  tissue: TissueInfo;
}

export interface PropagationTrace {
  eventId: string;
  synapseId?: string;
  sourceNeuronId: string;
  targetNeuronId: string;
  amountMv: number;
}

export interface NetworkStepTrace {
  tick: number;
  firedNeuronIds: string[];
  propagations: PropagationTrace[];
  eventIds: string[];
  network: NetworkSnapshot;
}

export interface NetworkEvent {
  id: string;
  timestamp: string;
  networkTick: number;
  type: string;
  neuronId?: string;
  sourceNeuronId?: string;
  targetNeuronId?: string;
  amountMv?: number;
  message: string;
}

export interface HealthResponse {
  status: string;
  version: string;
  ageSeconds?: number;
}

export type ConnectionStatus = "connected" | "connecting" | "unavailable";

export type ElectricalState = "Resting" | "Depolarized" | "Fired" | "Refractory";

export interface TimelineEntry {
  tick: number;
  firedNeuronIds: string[];
  propagations: PropagationTrace[];
  depolarizedCount: number;
  summary: string;
}

export function electricalState(neuron: NeuronSnapshot): ElectricalState {
  if (neuron.fired) {
    return "Fired";
  }
  if (neuron.refractoryTicks > 0) {
    return "Refractory";
  }
  if (neuron.membranePotentialMv > neuron.restingPotentialMv + 0.01) {
    return "Depolarized";
  }
  return "Resting";
}

export function distanceToThresholdMv(neuron: NeuronSnapshot): number {
  return neuron.thresholdMv - neuron.membranePotentialMv;
}

export function shortNeuronId(id: string): string {
  return id.replace("NEURON-", "N-");
}

export function formatAge(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rem = seconds % 60;
  if (minutes < 60) return `${minutes}m ${rem}s`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

export function explainStep(trace: NetworkStepTrace): string[] {
  const lines: string[] = [];

  if (trace.firedNeuronIds.length === 0 && trace.propagations.length === 0) {
    lines.push("No neuron reached threshold. Membranes moved toward resting potential.");
    return lines;
  }

  for (const id of trace.firedNeuronIds) {
    lines.push(`${id} reached its firing threshold and fired.`);
    lines.push(`${id} entered refractory state.`);
  }

  for (const prop of trace.propagations) {
    const sign = prop.amountMv >= 0 ? "+" : "";
    lines.push(
      `${prop.sourceNeuronId} delivered ${sign}${prop.amountMv} mV to ${prop.targetNeuronId}.`,
    );
  }

  return lines;
}

export function timelineSummary(trace: NetworkStepTrace): string {
  const fired = trace.firedNeuronIds.map(shortNeuronId);
  if (fired.length === 0 && trace.propagations.length === 0) {
    return "Quiet recovery tick";
  }
  const parts: string[] = [];
  if (fired.length > 0) {
    parts.push(`${fired.join(" and ")} fired`);
  }
  if (trace.propagations.length > 0) {
    parts.push(`${trace.propagations.length} signal(s) delivered`);
  }
  return parts.join("; ");
}

export function countDepolarized(neurons: NeuronSnapshot[]): number {
  return neurons.filter((neuron) => electricalState(neuron) === "Depolarized").length;
}

export function countRefractory(neurons: NeuronSnapshot[]): number {
  return neurons.filter((neuron) => electricalState(neuron) === "Refractory").length;
}

export function networkIsQuiet(snapshot: NetworkSnapshot, lastTrace: NetworkStepTrace | null): boolean {
  const active = snapshot.neurons.some((neuron) => {
    const state = electricalState(neuron);
    return state === "Depolarized" || state === "Fired";
  });
  const pending = (lastTrace?.propagations.length ?? 0) > 0;
  return !active && !pending;
}
