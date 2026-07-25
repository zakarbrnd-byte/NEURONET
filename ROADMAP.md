# NEURONET Roadmap

**NEURONET — A Digital Nervous System.**

| | |
| --- | --- |
| **Current version** | **0.8.2 Adjustable Simulation Speed** (frontend; backend 0.8.1) |
| **Next** | **0.8B Homeostatic Regulation** or **0.9 Embodied Sensory Surface** |
| **Constitution** | [`NEURONET.md`](NEURONET.md) |

Before implementing any item, answer:

> Does this make NEURONET behave more like a living nervous system?

If the answer is no, do not implement it.

---

## Completed

### 0.1–0.5 ✅

Digital Cell → Biological Neuron → Neural Core → Backend Network → Mission Control.

### 0.6A–0.6D ✅

Tissue positions, synaptic plasticity, structural observation, synapse birth/pruning.

### 0.7 Developmental Neural Tissue ✅

Deterministic progenitor birth → settlement at demo scale.

### 0.8 Autonomous Sensory Environment ✅

| | |
| --- | --- |
| **Purpose** | Continuous backend-owned sensory input via receptors. |
| **Scientific objective** | Environment → receptor → tissue without manual electrode dependence. |
| **Observable outcome** | Background pulses, PATTERN-A/B, receptor deliveries, plasticity under experience. |

Experiment: [`docs/experiments/0.8_AUTONOMOUS_SENSORY_ENVIRONMENT.md`](docs/experiments/0.8_AUTONOMOUS_SENSORY_ENVIRONMENT.md).

### 0.8.1 Autonomous Observation Stabilization ✅

| | |
| --- | --- |
| **Purpose** | Stabilization: Continuous Run through quiet ticks; Balanced birth/pruning calibration. |
| **Not a new scientific milestone** | Demonstration calibration only. |
| **Observable outcome** | Pause reasons; Observer Status; synapse birth within 300 ticks under Balanced. |

Experiment: [`docs/experiments/0.8.1_AUTONOMOUS_RUN_AND_STRUCTURAL_BALANCE.md`](docs/experiments/0.8.1_AUTONOMOUS_RUN_AND_STRUCTURAL_BALANCE.md).

### 0.8.2 Adjustable Simulation Speed ✅ ← CURRENT

| | |
| --- | --- |
| **Purpose** | User-controlled step pacing (0.5×–Max) without changing tick biology. |
| **Backend** | Remains 0.8.1 — frontend-only control/observability. |
| **Observable outcome** | Speed selector; actual ticks/s; latency; render modes; mid-run speed change. |

Experiment: [`docs/experiments/0.8.2_ADJUSTABLE_SIMULATION_SPEED.md`](docs/experiments/0.8.2_ADJUSTABLE_SIMULATION_SPEED.md).

---

## Next

### 0.8B Homeostatic Regulation ← CANDIDATE

If continuous sensory input saturates excitability or weights, add explicit
backend-owned homeostasis. **Not started.**

### 0.9 Embodied Sensory Surface ← CANDIDATE

Connect abstract receptors to a real bounded device surface when the virtual
environment remains stable. **Not started.**

**Out of scope until later milestones:** full body, prediction, memory, learning engines, cognition.

---

## Later

### 1.0 Closed Sensorimotor Loop

Perception → action → feedback.

### 1.1–1.4

Prediction → Memory → Learning → Emergent Cognition (observe; do not hard-code).
