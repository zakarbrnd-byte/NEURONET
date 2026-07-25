# NEURONET Scientific Model

**NEURONET — A Digital Nervous System.**

This document describes the **simplified** biological assumptions used by the project.

It is intentionally modest. NEURONET must not claim biophysical accuracy it does not have.

Constitution: [`../NEURONET.md`](../NEURONET.md)  
Philosophy: [`PROJECT_PHILOSOPHY.md`](PROJECT_PHILOSOPHY.md)

Always distinguish:

| Label | Meaning |
| --- | --- |
| **Implemented** | Present in the shipped runtime and covered by tests |
| **Approximation** | Educational simplification of a real biological idea |
| **Future work** | Roadmap intent; not present |

---

## Status overview

| Mechanism | Status |
| --- | --- |
| Neuron identity + electrical fields | Implemented (approximation) |
| Membrane potential (mV) | Implemented (approximation) |
| Threshold firing | Implemented (approximation) |
| Refractory recovery | Implemented (approximation) |
| Discrete-time propagation | Implemented (approximation) |
| Deterministic tissue positions | Implemented (0.6A) |
| Region / layer / DNA id / morphology | Implemented (0.6A, educational) |
| Excitatory + inhibitory cell types | Implemented (0.6A) |
| Inhibitory synapses (signed mV) | Implemented (0.6A) |
| Fatigue / energy fields | Implemented (coarse educational indicators) |
| Living synapses (usage, health, stability, age) | Implemented (0.6B) |
| Deterministic Hebbian weight change | Implemented (0.6B, approximation) |
| Structural readiness / pruning risk observation | Implemented (0.6C, approximation) |
| Synapse creation / deletion (deterministic) | Implemented (0.6D, approximation) |
| Developmental lifecycle / migration | Implemented (0.7, simplified approximation) |
| Body / sensors | Future work (0.8–0.9+) |
| Prediction / memory / learning / cognition | Future work (1.1–1.4) |

---

## Current neuron model

**Implemented / Approximation**

Each neuron is a struct with:

- `id`
- `restingPotentialMv` (default −70)
- `membranePotentialMv`
- `thresholdMv` (default −55)
- `energy` (starts at 100; decrements on fire)
- `fatigue` (increases on fire; slowly recovers)
- `refractoryTicks`
- `fired`
- `tick`

Positive incoming signals raise membrane potential (depolarization).  
Zero and negative inputs are currently ignored at the neuron receive boundary (0.5 excitatory-only world).

This is **not** a compartmental neuron, **not** a channel model, and **not** a claim of ionic realism.

---

## Current membrane model

**Implemented / Approximation**

- Units are educational millivolts.
- Membrane is clamped to a safe range (approximately −90 to +40 mV).
- When not refractory and membrane ≥ threshold, the neuron fires.
- On fire: membrane resets toward rest, refractory period begins (2 ticks), fatigue increases, energy decreases slightly.
- Otherwise membrane moves toward rest by a fixed recovery step (2 mV per tick in the current constants).

A “tick” is one complete backend simulation step. It is **not** one real-world second.

---

## Propagation model

**Implemented / Approximation**

- Time is discrete.
- On each network step, neurons that fire emit fixed excitatory weights along outgoing connections.
- Propagation is recorded as structured traces: source, target, amount (mV), event id.
- Mission Control may animate only those structured propagations.

There is no continuous axonal delay model, no probabilistic vesicle release, and no neuromodulation.

---

## Tissue model

**Implemented (0.6A) / Approximation**

Shipped tissue is a **deterministic five-neuron** graph with fixed normalized positions,
region/layer labels, morphology radii, and mixed E/I synapses:

```text
NEURON-001 → NEURON-002 → {NEURON-003 (E), NEURON-004 (I)} → NEURON-005
```

NEURON-004 is inhibitory; SYNAPSE-005 delivers −8 mV when N-004 fires.
Positions never move. Reset restores the identical geometry.

This demonstrates physical organization plus excitation/inhibition.
It is **not** cortical tissue and **not** developmental morphogenesis.

---

## Structural plasticity foundations (0.6C)

**Implemented / Approximation**

- Discrete coactivation evidence for directed pairs (same tick or previous→current).
- Growth candidates with readiness, compatibility, maturation progress, reason codes.
- Pruning-risk classification for existing synapses (grace-protected; no deletion).
- Morphology reach uses normalized `axonLength` + `dendriteRadius` in the same space as positions.

**0.6D addition:** matured candidates may birth synapses; sustained at-risk evidence may prune unprotected synapses under topology limits. See [`experiments/0.6D_SYNAPSE_BIRTH_AND_PRUNING.md`](experiments/0.6D_SYNAPSE_BIRTH_AND_PRUNING.md).

**Not implemented in 0.6C/0.6D:** axon outgrowth morphogenesis, neuron birth/death, DNA mutation.

Details (foundations): [`experiments/0.6C_STRUCTURAL_PLASTICITY_FOUNDATIONS.md`](experiments/0.6C_STRUCTURAL_PLASTICITY_FOUNDATIONS.md).

---

## Developmental neural tissue (0.7)

**Implemented / Approximation**

- Deterministic progenitor birth on a tick schedule (default first birth at tick 30).
- Lifecycle: Maturing → Differentiating → Migrating → Settling → Settled.
- Population-ratio differentiation (excitatory / inhibitory).
- Backend-owned settlement targets and migration paths; settled somas never migrate.
- Electrical and structural eligibility begin on the tick after settlement.
- Demo scale: 5 initial settled neurons, maximum 8 total, one concurrent developing cell.

**Not claimed:** embryology, stem-cell biology, chemical gradients, glia, apoptosis,
vascular/metabolic systems, biological scale, or cognition.

Details: [`experiments/0.7_DEVELOPMENTAL_NEURAL_TISSUE.md`](experiments/0.7_DEVELOPMENTAL_NEURAL_TISSUE.md).

---

## Stimulation model

**Implemented / Approximation**

Operator stimulation is **electrode-style**:

- long-press or control: +5 mV
- strong stimulus: +20 mV

This is an experimental injection into a chosen neuron.  
It is **not** sensory transduction through receptors.

---

## Future: plasticity

| Milestone | Status / Intent |
| --- | --- |
| 0.6B Synaptic | Implemented — Hebbian / idle weight change on living synapses |
| 0.6C Structural foundations | Implemented — observe candidates and pruning risk |
| 0.6D Synapse birth and pruning | Implemented — deterministic create/delete under limits |
| 0.7 Developmental neural tissue | Implemented — simplified progenitor → settlement lifecycle |

Plasticity and development must remain backend-owned and Mission Control–observable.  
Do not “learn” by silently editing UI state.

---

## Future: body

**Future work (0.8 Embodied Sensory Surface, then 0.9+)**

Smartphone as first body: touch, camera, microphone, device sensors, speaker/haptics.

Sensory events should become typed inputs into tissue pathways.  
Effector commands should be observable consequences of tissue activity — not scripted app features labeled as biology.

---

## Future: learning and cognition

**Future work (1.1–1.4)**

Prediction, memory, learning, and emergent cognition are late stages.

They must not be faked with:

- hardcoded dialogue
- a central planner
- an embedded LLM presented as the nervous system

If cognition is ever claimed, claims must rest on measurable, inspectable dynamics.

---

## Honesty statement

NEURONET currently offers a **clear educational model** of discrete neural tissue dynamics suitable for observation and engineering iteration.

It does **not** currently offer a biologically accurate brain simulation.

That distinction is intentional and required by the project constitution.
