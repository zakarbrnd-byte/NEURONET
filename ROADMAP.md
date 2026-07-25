# NEURONET Roadmap

**NEURONET — A Digital Nervous System.**

| | |
| --- | --- |
| **Current version** | **0.7 Developmental Neural Tissue** |
| **Next** | **0.8 Embodied Sensory Surface** |
| **Constitution** | [`NEURONET.md`](NEURONET.md) |

Before implementing any item, answer:

> Does this make NEURONET behave more like a living nervous system?

If the answer is no, do not implement it.

---

## Completed

### 0.1–0.5 ✅

Digital Cell → Biological Neuron → Neural Core → Backend Network → Mission Control.

### 0.6A Artificial Neural Tissue ✅

Fixed positions, regions, layers, cell types, morphology, E/I.

### 0.6B Synaptic Plasticity ✅

Living synapses with Hebbian / idle weight change.

### 0.6C Structural Plasticity Foundations ✅

Growth candidates and pruning-risk observation (no topology change).

### 0.6D Synapse Birth and Pruning ✅

| | |
| --- | --- |
| **Purpose** | First runtime topology mutations. |
| **Scientific objective** | Deterministic birth from matured candidates; sustained pruning under limits. |
| **Observable outcome** | `synapse_created` / `synapse_pruned` events; Development transitions; topology counters. |

### 0.7 Developmental Neural Tissue ✅ ← CURRENT

| | |
| --- | --- |
| **Purpose** | Visible, backend-owned cell development at demo scale. |
| **Scientific objective** | Deterministic progenitor birth → maturation → differentiation → migration → settlement. |
| **Observable outcome** | Lifecycle states, Simplified Progenitor Zone, migration paths, eligibility timing, population 5→8. |

Experiment: [`docs/experiments/0.7_DEVELOPMENTAL_NEURAL_TISSUE.md`](docs/experiments/0.7_DEVELOPMENTAL_NEURAL_TISSUE.md).

---

## Next

### 0.8 Embodied Sensory Surface ← NEXT

First bounded sensory surface for the organism — still without claiming cognition,
full body embodiment, or camera/microphone pipelines unless scoped by that milestone.

**Not started.**

**Out of scope until later milestones:** full body, prediction, memory, learning engines, cognition.

---

## Later

### 0.9 Artificial Body

Smartphone as first body.

### 1.0 Closed Sensorimotor Loop

Perception → action → feedback.

### 1.1–1.4

Prediction → Memory → Learning → Emergent Cognition (observe; do not hard-code).
