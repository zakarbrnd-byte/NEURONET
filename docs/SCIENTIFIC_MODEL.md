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
| Structural plasticity / growth | Future work (0.6C) |
| Body / sensors | Future work (0.9+) |
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

NEURON-004 is inhibitory; CONNECTION-005 delivers −8 mV when N-004 fires.
Positions never move. Reset restores the identical geometry.

This demonstrates physical organization plus excitation/inhibition.
It is **not** cortical tissue and **not** developmental morphogenesis.

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

**Future work**

| Milestone | Intent |
| --- | --- |
| 0.7 Synaptic | Strengthen / weaken existing synapses; Hebbian-style adaptation; connection history |
| 0.8 Structural | Growth / pruning metaphors; birth of new synapses |

Plasticity must remain backend-owned and Mission Control–observable.  
Do not “learn” by silently editing UI state.

---

## Future: body

**Future work (0.9+)**

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
