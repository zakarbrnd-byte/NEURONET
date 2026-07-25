/** Canonical beginner-friendly explanations for technical neural metrics. */
export const METRIC_EXPLANATIONS = {
  networkTick: {
    label: "Network Tick",
    explanation:
      "One complete backend simulation step. It is not equal to one real-world second.",
  },
  neuronTick: {
    label: "Neuron Tick",
    explanation: "The number of times this neuron has been updated by the backend.",
  },
  restingPotential: {
    label: "Resting Potential",
    explanation:
      "The electrical level this neuron returns to when it is not being stimulated.",
  },
  currentMembranePotential: {
    label: "Current Membrane Potential",
    explanation:
      "The neuron's current electrical state. As it approaches the threshold, the neuron gets closer to firing.",
  },
  fireThreshold: {
    label: "Fire Threshold",
    explanation: "The membrane potential required for this neuron to fire.",
  },
  distanceToThreshold: {
    label: "Distance to Threshold",
    explanation: "How much additional depolarization is needed before firing.",
  },
  firedDuringLastTick: {
    label: "Fired During Last Tick",
    explanation:
      "Whether this neuron fired during the most recent backend simulation step.",
  },
  refractoryTicks: {
    label: "Refractory Ticks",
    explanation: "How many simulation steps remain before this neuron can fire again.",
  },
  fatigue: {
    label: "Fatigue",
    explanation:
      "A simplified temporary exhaustion value that rises after firing and decreases during recovery.",
  },
  energy: {
    label: "Energy",
    explanation:
      "A simplified simulation cost indicator. It is not a direct biological ATP measurement.",
  },
  incomingConnections: {
    label: "Incoming Connections",
    explanation: "The number of backend connections delivering signals into this neuron.",
  },
  outgoingConnections: {
    label: "Outgoing Connections",
    explanation:
      "The number of backend connections carrying signals away from this neuron.",
  },
  latestReceivedSignal: {
    label: "Latest Received Signal",
    explanation:
      "The most recent signal amount delivered by a real backend propagation event.",
  },
  latestFiringTick: {
    label: "Latest Firing Tick",
    explanation: "The most recent network tick during which this neuron fired.",
  },
} as const;

export type MetricKey = keyof typeof METRIC_EXPLANATIONS;

/** Ordered list of every technical metric that must expose an explanation. */
export const REQUIRED_METRIC_KEYS = Object.keys(METRIC_EXPLANATIONS) as MetricKey[];
