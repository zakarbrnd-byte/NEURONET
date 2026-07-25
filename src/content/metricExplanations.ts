/** Compact plain-language explanations for technical neuron metrics. */
export const METRIC_EXPLANATIONS = {
  restingPotential:
    "The electrical level this neuron returns to when it is not being stimulated.",
  membranePotential:
    "The neuron's current electrical state. As it approaches the threshold, the neuron gets closer to firing.",
  threshold: "The membrane potential required for this neuron to fire.",
  distanceToThreshold: "How much additional depolarization is needed before firing.",
  energy:
    "A simplified simulation cost indicator. It is not a direct biological ATP measurement.",
  fatigue:
    "A simplified temporary exhaustion value that rises after firing and decreases during recovery.",
  refractoryTicks: "How many simulation steps remain before this neuron can fire again.",
  firedLastTick:
    "Whether this neuron fired during the most recent backend simulation step.",
  incoming: "The number of backend connections delivering signals into this neuron.",
  outgoing: "The number of backend connections carrying signals away from this neuron.",
  latestSignal:
    "The most recent signal amount delivered by a real backend propagation event.",
  latestFiringTick: "The most recent network tick during which this neuron fired.",
  neuronTick: "The number of times this neuron has been updated by the backend.",
  networkTick:
    "One complete backend simulation step. It is not equal to one real-world second.",
  region: "Named tissue region this neuron belongs to (backend tissue organization).",
  layer: "Tissue layer index. Higher layers are farther along the observatory pathway.",
  cellType: "Whether this cell is excitatory or inhibitory.",
  dnaId: "Deterministic developmental identity label for this cell (not genomic DNA).",
  position: "Fixed normalized tissue coordinates owned by the backend. Neurons do not move.",
  somaRadius: "Relative size of the cell body used for Tissue View rendering.",
  dendriteRadius: "Relative radius of the transparent dendrite field around the soma.",
  axonLength: "Relative axon extent used for morphology display in Tissue View.",
} as const;

export type MetricExplanationKey = keyof typeof METRIC_EXPLANATIONS;
