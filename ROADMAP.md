# NEURONET Roadmap

**NEURONET — A Digital Nervous System.**

Milestones follow biological development.

| | |
| --- | --- |
| **Current version** | **0.6A Artificial Neural Tissue** |
| **Constitution** | [`NEURONET.md`](NEURONET.md) |

Before implementing any item, answer:

> Does this make NEURONET behave more like a living nervous system?

If the answer is no, do not implement it.

---

## Completed

### 0.1 Digital Cell ✅

| | |
| --- | --- |
| **Purpose** | Establish the first autonomous computational unit and repository foundation. |
| **Scientific objective** | Show that a discrete digital unit can exist as a stable, inspectable object. |
| **Observable outcome** | Project shell capable of hosting later neural objects. |

### 0.2 Biological Neuron ✅

| | |
| --- | --- |
| **Purpose** | Replace a generic digital node with a simplified biological neuron. |
| **Scientific objective** | Make resting potential, depolarization, threshold firing, and refractory recovery explicit. |
| **Observable outcome** | Inspectable membrane, threshold, refractory, and fired state. |

### 0.3 Neural Core ✅

| | |
| --- | --- |
| **Purpose** | Centralize electrical dynamics in a dedicated neural simulation core. |
| **Scientific objective** | Keep firing and recovery rules consistent, testable, and not UI-local. |
| **Observable outcome** | Deterministic neuron stepping with documented educational parameters. |

### 0.4 Backend Network ✅

| | |
| --- | --- |
| **Purpose** | Move network ownership to a Rust backend and render the real backend graph. |
| **Scientific objective** | Prove multi-neuron topology lives in one authoritative simulator. |
| **Observable outcome** | Frontend displays backend neurons and connections only. |

### 0.5 Mission Control ✅

| | |
| --- | --- |
| **Purpose** | Make firing and propagation observable tick by tick in a one-screen observatory. |
| **Scientific objective** | Validate discrete-time propagation with structured step traces. |
| **Observable outcome** | Mission Control shell with Network graph, sheets, and electrode-style stimulation. |

---

## Current

### 0.6A Artificial Neural Tissue ← CURRENT

| | |
| --- | --- |
| **Purpose** | Give the network a physical tissue organization. |
| **Scientific objective** | Fixed positions, regions, layers, cell types, morphology, and E/I synapses — without growth or learning. |
| **Observable outcome** | Tissue View (soma/dendrite/axons), Biology panel fields, tissue header (Alive / Cells / Synapses / Region / Age), deterministic reset of geometry. |

**Out of scope:** learning, memory, growth, pruning, moving neurons, body, prediction, cognition.

---

## Next within 0.6

### 0.6B Synaptic Plasticity

| | |
| --- | --- |
| **Purpose** | Allow existing synapses to strengthen and weaken. |
| **Scientific objective** | Study Hebbian-style adaptation and connection history. |
| **Observable outcome** | Weight changes visible in Mission Control and logged by the backend. |

### 0.6C Structural Plasticity

| | |
| --- | --- |
| **Purpose** | Allow the wiring diagram itself to change. |
| **Scientific objective** | Growth/pruning metaphors and birth of new synapses as inspectable processes. |
| **Observable outcome** | New or removed connections appear in snapshots and traces. |

---

## Later

### 0.7 Synaptic Plasticity (alias path)

Retained as the broader plasticity chapter if 0.6B is expanded beyond the tissue track.

### 0.8 Structural Plasticity

See 0.6C / continued structural work.

### 0.9 Artificial Body

Smartphone as first body: sensors and actuators as typed pathways into tissue.

### 1.0 Closed Sensorimotor Loop

Perception → action → feedback without a scripted central agent brain.

### 1.1 Prediction

Prediction and prediction error as inspectable dynamics.

### 1.2 Memory

Working and longer-term retention as backend-owned mechanisms.

### 1.3 Learning

Experience-driven change through tissue mechanisms — not a bolted-on ML trainer.

### 1.4 Emergent Cognition

Observe whether cognition-like organization appears. Do not hard-code intelligence.

---

## Document map

- Constitution: [`NEURONET.md`](NEURONET.md)
- Philosophy: [`docs/PROJECT_PHILOSOPHY.md`](docs/PROJECT_PHILOSOPHY.md)
- Architecture: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- Scientific model: [`docs/SCIENTIFIC_MODEL.md`](docs/SCIENTIFIC_MODEL.md)
- Development guide: [`docs/DEVELOPMENT_GUIDE.md`](docs/DEVELOPMENT_GUIDE.md)
