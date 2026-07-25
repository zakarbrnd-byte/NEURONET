# NEURONET Roadmap

**NEURONET — A Digital Nervous System.**

| | |
| --- | --- |
| **Current version** | **0.6C Structural Plasticity Foundations** |
| **Next** | **0.6D Structural Growth (create synapses)** |
| **Constitution** | [`NEURONET.md`](NEURONET.md) |

Before implementing any item, answer:

> Does this make NEURONET behave more like a living nervous system?

If the answer is no, do not implement it.

---

## Completed

### 0.1–0.5 ✅

Digital Cell → Biological Neuron → Neural Core → Backend Network → Mission Control.

### 0.6A Artificial Neural Tissue ✅

| | |
| --- | --- |
| **Purpose** | Physical tissue organization. |
| **Scientific objective** | Fixed positions, regions, layers, cell types, morphology, E/I. |
| **Observable outcome** | Tissue View + Biology panel + tissue header. |

### 0.6B Synaptic Plasticity ✅

| | |
| --- | --- |
| **Purpose** | Make synapses living biological objects. |
| **Scientific objective** | Usage, health, stability, age, deterministic Hebbian weight change, history. |
| **Observable outcome** | Synapse Inspector; weight-driven stroke thickness; strengthen/weaken cues. |

### 0.6C Structural Plasticity Foundations ✅ ← CURRENT

| | |
| --- | --- |
| **Purpose** | Observe where future growth or pruning *could* occur. |
| **Scientific objective** | Growth candidates, coactivation evidence, pruning risk — without topology change. |
| **Observable outcome** | Development mode; candidate inspector; pruning fields; structured structural events. |

**Explicit non-goal of 0.6C:** create or delete synapses.

---

## Next

### 0.6D Structural Growth ← NEXT

| | |
| --- | --- |
| **Purpose** | Allow mature candidates to become real synapses under backend rules. |
| **Scientific objective** | Deterministic synapse birth from maturing candidates with inspectable events. |
| **Observable outcome** | New synapses appear in snapshots/traces — never as silent UI edits. |

Pruning (actual deletion) may follow in a later structural milestone after growth is stable.

**Out of scope until later milestones:** body, prediction, memory, learning engines, cognition.

---

## Later

### 0.9 Artificial Body

Smartphone as first body.

### 1.0 Closed Sensorimotor Loop

Perception → action → feedback.

### 1.1–1.4

Prediction → Memory → Learning → Emergent Cognition (observe; do not hard-code).
