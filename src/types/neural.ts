/** Backend network snapshot and step-trace types. Frontend never invents these values. */

export interface NeuronPosition {
  x: number;
  y: number;
}

export type CellType = "excitatory" | "inhibitory";
export type SynapseType = "excitatory" | "inhibitory";

/** Simplified developmental lifecycle (Version 0.7) — backend-owned. */
export type LifecycleState =
  | "quiescent"
  | "maturing"
  | "differentiating"
  | "migrating"
  | "settling"
  | "settled";

export interface MigrationPath {
  waypoints: NeuronPosition[];
  currentSegment: number;
}

export interface MorphologyProfile {
  somaRadius: number;
  dendriteRadius: number;
  axonReach: number;
}

export interface TissueRegion {
  id: string;
  name: string;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  description: string;
}

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
  /** Developmental fields (0.7). */
  lifecycle: LifecycleState;
  developmentalAge: number;
  phaseAge: number;
  birthTick: number;
  settledTick: number | null;
  targetPosition: NeuronPosition | null;
  originalTargetPosition: NeuronPosition | null;
  migrationPath: MigrationPath | null;
  migrationProgress: number;
  migrationDistance: number;
  morphologyProgress: number;
  cellTypeAssigned: CellType | null;
  electricallyEligibleFromTick: number | null;
  structurallyEligibleFromTick: number | null;
  developmentalOrigin: string;
  matureMorphology: MorphologyProfile;
  blockingConditions: string[];
}

export interface WeightHistoryEntry {
  tick: number;
  weight: number;
}

export type PruningStatus = "stable" | "monitoring" | "atRisk" | "protected";
export type CandidateStatus = "observing" | "eligible" | "maturing" | "blocked";

/** Living synapse — first-class biological object (0.6B–0.6D). */
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
  pruningRisk: number;
  inactivityTicks: number;
  lowWeightTicks: number;
  lowHealthTicks: number;
  protectedUntilTick: number;
  pruningStatus: PruningStatus;
  pruningReasons: string[];
  structurallyProtected: boolean;
  protectionReason: string | null;
  originCandidateId: string | null;
  eligibleFromTick: number;
  atRiskEvals: number;
}

export interface StructuralConfigSummary {
  enabled: boolean;
  evaluationIntervalTicks: number;
  maxCandidateDistance: number;
  minimumCoactivationScore: number;
  candidateMaturationTicks: number;
  creationReadinessThreshold: number;
  creationHoldEvals: number;
  pruningWeightThreshold: number;
  pruningHealthThreshold: number;
  pruningInactivityTicks: number;
  pruningGraceTicks: number;
  pruningCommitRiskThreshold: number;
  pruningLowWeightDuration: number;
  pruningLowHealthDuration: number;
  pruningSustainedAtRiskEvals: number;
  maxCandidates: number;
  minTotalSynapses: number;
  maxTotalSynapses: number;
  maxOutgoingPerNeuron: number;
  maxIncomingPerNeuron: number;
  preserveDemoPath: boolean;
}

export interface GrowthCandidate {
  id: string;
  sourceNeuronId: string;
  targetNeuronId: string;
  proposedConnectionType: SynapseType;
  distance: number;
  coactivationScore: number;
  structuralCompatibility: number;
  readiness: number;
  status: CandidateStatus;
  createdTick: number;
  lastEvaluatedTick: number;
  maturationTicks: number;
  supportingReasons: string[];
  blockingReasons: string[];
}

export interface TopologySummary {
  cellCount: number;
  synapseCount: number;
  candidateCount: number;
  atRiskSynapseCount: number;
  createdThisSession: number;
  prunedThisSession: number;
  maxSynapseCapacity: number;
  minSynapseFloor: number;
}

export interface StructuralHistoryEntry {
  tick: number;
  kind: string;
  synapseId?: string | null;
  candidateId?: string | null;
  sourceNeuronId?: string | null;
  targetNeuronId?: string | null;
  connectionType?: SynapseType | null;
  weight?: number | null;
  reasonCodes: string[];
  synapseCountBefore: number;
  synapseCountAfter: number;
}

export interface StructuralSnapshot {
  config: StructuralConfigSummary;
  growthCandidates: GrowthCandidate[];
  latestEvaluationTick: number | null;
  candidateCount: number;
  atRiskSynapseCount: number;
  topology: TopologySummary;
  history: StructuralHistoryEntry[];
}

export interface DevelopmentConfigSummary {
  maximumTotalNeurons: number;
  maximumConcurrentDevelopingCells: number;
  firstBirthTick: number;
  minimumBirthIntervalTicks: number;
  maturationDurationTicks: number;
  differentiationDurationTicks: number;
  migrationDurationTicks: number;
  settlingDurationTicks: number;
  targetExcitatoryRatio: number;
}

/** Compact development summary from backend NetworkSnapshot (0.7). */
export interface DevelopmentSummary {
  enabled: boolean;
  totalCellCount: number;
  settledNeuronCount: number;
  developingCellCount: number;
  populationCapacity: number;
  latestBirthTick: number | null;
  latestDevelopmentEvaluationTick: number | null;
  nextBirthEligibilityTick: number | null;
  currentLifecycleActivity: string;
  progenitorZone: TissueRegion;
  settlementZones: TissueRegion[];
  config: DevelopmentConfigSummary;
}

/** Version 0.8 — Autonomous Sensory Environment (backend-owned). */
export type EnvironmentPreset = "quiet" | "balanced" | "active";

export type ReceptorType = "background" | "touch_a" | "touch_b";

export interface EnvironmentConfigSummary {
  enabled: boolean;
  deterministicSeed: number;
  preset: EnvironmentPreset;
  backgroundEnabled: boolean;
  backgroundIntervalTicks: number;
  backgroundStrengthMv: number;
  patternAEnabled: boolean;
  patternBEnabled: boolean;
  patternAIntervalTicks: number;
  patternBIntervalTicks: number;
  patternAFirstTick: number;
  patternBFirstTick: number;
  maximumEventsPerTick: number;
}

export interface SensoryReceptor {
  id: string;
  receptorType: ReceptorType;
  position: NeuronPosition;
  region: string;
  sensitivity: number;
  activationThreshold: number;
  currentActivation: number;
  lastActivatedTick: number | null;
  activationCount: number;
  active: boolean;
}

export interface SensoryConnection {
  id: string;
  receptorId: string;
  targetNeuronId: string;
  weightMv: number;
  enabled: boolean;
}

export interface PatternStep {
  offsetTicks: number;
  receptorId: string;
  magnitudeMv: number;
}

export interface SensoryPattern {
  id: string;
  name: string;
  steps: PatternStep[];
  repetitionIntervalTicks: number;
  firstTick: number;
  enabled: boolean;
  activationCount: number;
  lastStartedTick: number | null;
  active: boolean;
  activeStartedTick: number | null;
}

export interface EnvironmentStatistics {
  totalEvents: number;
  backgroundEvents: number;
  patternAStarts: number;
  patternBStarts: number;
  receptorActivations: number;
  sensoryDeliveries: number;
}

export interface EnvironmentHistoryEntry {
  eventId: string;
  tick: number;
  kind: string;
  patternId?: string | null;
  receptorId?: string | null;
  targetNeuronId?: string | null;
  magnitudeMv?: number | null;
  sequenceStep?: number | null;
  reasonCodes: string[];
  message: string;
}

export interface EnvironmentSnapshot {
  environmentId: string;
  name: string;
  enabled: boolean;
  mode: string;
  preset: EnvironmentPreset;
  seed: number;
  ageTicks: number;
  eventCount: number;
  latestEventTick: number | null;
  nextScheduledEventTick: number | null;
  nextBackgroundTick: number | null;
  nextPatternATick: number | null;
  nextPatternBTick: number | null;
  activePatterns: string[];
  statistics: EnvironmentStatistics;
  config: EnvironmentConfigSummary;
  receptors: SensoryReceptor[];
  sensoryConnections: SensoryConnection[];
  patterns: SensoryPattern[];
  recentEvents: EnvironmentHistoryEntry[];
  sensoryInputCount: number;
  neuralSynapseCount: number;
}

export interface SensoryDeliveryTrace {
  receptorId: string;
  targetNeuronId: string;
  magnitudeMv: number;
  connectionId: string;
  eventId: string;
}

export interface EnvironmentTrace {
  eventsGenerated: string[];
  receptorsActivated: string[];
  sensoryDeliveries: SensoryDeliveryTrace[];
  activePatterns: string[];
}

export interface EnvironmentControlsRequest {
  enabled?: boolean;
  backgroundEnabled?: boolean;
  patternAEnabled?: boolean;
  patternBEnabled?: boolean;
  preset?: EnvironmentPreset;
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
  structural: StructuralSnapshot;
  /** Present from Version 0.7; omit/null → no developmental visualization. */
  development?: DevelopmentSummary | null;
  /** Present from Version 0.8; omit/null → no sensory visualization. */
  environment?: EnvironmentSnapshot | null;
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
  /** Present from Version 0.8. */
  environmentTrace?: EnvironmentTrace | null;
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
  entityId?: string;
  previousStatus?: string;
  newStatus?: string;
  readinessOrRisk?: number;
  reasonCodes?: string[];
  synapseId?: string;
  candidateId?: string;
  connectionType?: SynapseType;
  synapseCountBefore?: number;
  synapseCountAfter?: number;
  message: string;
}

export interface HealthResponse {
  status: string;
  version: string;
  ageSeconds?: number;
}

export type ConnectionStatus = "connected" | "connecting" | "unavailable";

export type ElectricalState = "Resting" | "Depolarized" | "Fired" | "Refractory";

export interface TimelineStructuralNote {
  type: string;
  entityId?: string;
  sourceNeuronId?: string;
  targetNeuronId?: string;
  previousStatus?: string;
  newStatus?: string;
  readinessOrRisk?: number;
  reasonCodes: string[];
  message: string;
}

export interface TimelineEntry {
  tick: number;
  firedNeuronIds: string[];
  propagations: PropagationTrace[];
  depolarizedCount: number;
  summary: string;
  structuralNotes?: TimelineStructuralNote[];
}

export function shortNeuronId(id: string): string {
  return id.replace("NEURON-", "N-");
}

export function isStructuralEventType(type: string): boolean {
  return (
    type.startsWith("growth_candidate_") ||
    type.startsWith("synapse_pruning_") ||
    type === "synapse_created" ||
    type === "synapse_pruned" ||
    type === "candidate_creation_blocked" ||
    type === "pruning_blocked"
  );
}

export function isDevelopmentalEventType(type: string): boolean {
  return (
    type === "progenitor_born" ||
    type === "maturation_started" ||
    type === "differentiation_started" ||
    type === "cell_type_assigned" ||
    type.startsWith("migration_") ||
    type === "settling_started" ||
    type === "neuron_settled" ||
    type === "development_blocked" ||
    type === "population_capacity_reached"
  );
}

export function isEnvironmentEventType(type: string): boolean {
  return (
    type.startsWith("environment_") ||
    type.startsWith("receptor_") ||
    type.startsWith("sensory_pattern_") ||
    type === "laboratory_stimulus"
  );
}

export function isObservatoryEventType(type: string): boolean {
  return (
    isStructuralEventType(type) ||
    isDevelopmentalEventType(type) ||
    isEnvironmentEventType(type)
  );
}

export function environmentEventPlainSummary(event: NetworkEvent): string {
  if (event.message) return event.message;
  const receptor = event.sourceNeuronId ?? event.entityId ?? "?";
  const target = event.targetNeuronId
    ? shortNeuronId(event.targetNeuronId)
    : event.neuronId
      ? shortNeuronId(event.neuronId)
      : "?";
  switch (event.type) {
    case "environment_paused":
      return "Environment disabled — no sensory events.";
    case "environment_resumed":
      return event.message || "Environment controls updated.";
    case "environment_event_started":
      return `Background / environment event via ${receptor}.`;
    case "receptor_activated":
      return `${receptor} activated.`;
    case "receptor_input_delivered":
      return `${receptor} delivered sensory input to ${target}.`;
    case "sensory_pattern_started":
      return `Sensory pattern ${event.entityId ?? "?"} started.`;
    case "sensory_pattern_step":
      return `Sensory pattern step via ${receptor}.`;
    case "sensory_pattern_completed":
      return `Sensory pattern ${event.entityId ?? "?"} completed.`;
    case "laboratory_stimulus":
      return `Laboratory electrode stimulated ${target}.`;
    default:
      return event.message || event.type;
  }
}

export function receptorTypeLabel(type: ReceptorType): string {
  switch (type) {
    case "background":
      return "Background";
    case "touch_a":
      return "Touch A";
    case "touch_b":
      return "Touch B";
    default:
      return type;
  }
}

export function neuronIsDeveloping(neuron: NeuronSnapshot): boolean {
  return neuron.lifecycle !== "settled" && neuron.lifecycle !== "quiescent";
}

/** Settled + electricallyEligibleFromTick reached — otherwise no stimulation. */
export function neuronIsElectricallyEligible(
  neuron: NeuronSnapshot,
  networkTick: number,
): boolean {
  if (neuron.lifecycle !== "settled") return false;
  if (neuron.electricallyEligibleFromTick == null) return false;
  return networkTick >= neuron.electricallyEligibleFromTick;
}

export function structuralEventPlainSummary(event: NetworkEvent): string {
  const source = event.sourceNeuronId ? shortNeuronId(event.sourceNeuronId) : "?";
  const target = event.targetNeuronId ? shortNeuronId(event.targetNeuronId) : "?";
  const cell = event.neuronId
    ? shortNeuronId(event.neuronId)
    : event.entityId
      ? shortNeuronId(event.entityId)
      : "?";
  switch (event.type) {
    case "growth_candidate_observed":
      return `A possible ${source} → ${target} synapse is being observed.`;
    case "growth_candidate_eligible":
      return `A possible ${source} → ${target} synapse became eligible.`;
    case "growth_candidate_maturing":
      return `A possible ${source} → ${target} synapse entered maturation after repeated coactivation within structural reach.`;
    case "growth_candidate_weakened":
      return `Growth candidate ${source} → ${target} weakened as evidence fell.`;
    case "synapse_pruning_monitored":
      return `Synapse ${source} → ${target} is being monitored for pruning risk.`;
    case "synapse_pruning_risk_increased":
      return `Pruning risk increased for synapse ${source} → ${target}.`;
    case "synapse_pruning_risk_decreased":
      return `Pruning risk decreased for synapse ${source} → ${target}.`;
    case "synapse_created":
      return `Synapse born: ${source} → ${target}.`;
    case "synapse_pruned":
      return `Synapse pruned: ${source} → ${target}.`;
    case "candidate_creation_blocked":
      return `Synapse creation blocked for ${source} → ${target}.`;
    case "pruning_blocked":
      return `Pruning blocked for synapse ${source} → ${target}.`;
    case "progenitor_born":
      return `Progenitor ${cell} born in Simplified Progenitor Zone.`;
    case "maturation_started":
      return `${cell} began maturation.`;
    case "differentiation_started":
      return `${cell} began differentiation.`;
    case "cell_type_assigned":
      return `${cell} was assigned a cell type.`;
    case "migration_started":
      return `${cell} began migration.`;
    case "migration_progressed":
      return `${cell} migration progressed${
        event.readinessOrRisk != null ? ` (${Math.round(event.readinessOrRisk * 100)}%)` : ""
      }.`;
    case "migration_completed":
      return `${cell} completed migration.`;
    case "settling_started":
      return `${cell} entered settling.`;
    case "neuron_settled":
      return `${cell} settled.`;
    case "development_blocked":
      return `Development blocked for ${cell}.`;
    case "population_capacity_reached":
      return event.message || "Population capacity reached.";
    default:
      return event.message;
  }
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
  const sensoryCount = trace.environmentTrace?.sensoryDeliveries.length ?? 0;
  if (fired.length === 0 && trace.propagations.length === 0 && sensoryCount === 0) {
    return "Quiet recovery tick";
  }
  const parts: string[] = [];
  if (fired.length > 0) {
    parts.push(`${fired.join(" and ")} fired`);
  }
  if (trace.propagations.length > 0) {
    parts.push(`${trace.propagations.length} signal(s) delivered`);
  }
  if (sensoryCount > 0) {
    parts.push(`${sensoryCount} sensory input(s)`);
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
