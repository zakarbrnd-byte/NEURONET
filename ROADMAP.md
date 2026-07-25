# NEURONET Roadmap

**NEURONET — A Digital Nervous System.**

Milestones follow biological development. They are not a conventional AI feature checklist.

| | |
| --- | --- |
| **Shipped runtime** | 0.5 Mission Control observatory |
| **Current target** | **0.6 Artificial Neural Tissue** |
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
| **Scientific objective** | Show that a discrete digital “cell-like” unit can exist as a stable, inspectable object. |
| **Observable outcome** | Project shell and early debug surface capable of hosting later neural objects. |

### 0.2 Biological Neuron ✅

| | |
| --- | --- |
| **Purpose** | Replace a generic digital node with a simplified biological neuron. |
| **Scientific objective** | Make resting potential, depolarization, threshold firing, and refractory recovery explicit. |
| **Observable outcome** | A neuron whose membrane potential, threshold distance, refractory state, and fired flag can be inspected. |

### 0.3 Neural Core ✅

| | |
| --- | --- |
| **Purpose** | Centralize electrical dynamics in a dedicated neural simulation core. |
| **Scientific objective** | Ensure firing and recovery rules are consistent, testable, and not UI-local. |
| **Observable outcome** | Deterministic neuron stepping with documented educational parameters. |

### 0.4 Backend Network ✅

| | |
| --- | --- |
| **Purpose** | Move network ownership to a Rust backend and render the real backend graph. |
| **Scientific objective** | Prove that multi-neuron topology and connections live in one authoritative simulator. |
| **Observable outcome** | Frontend displays backend neurons and connections; browser does not invent tissue state. |

### 0.5 Mission Control ✅

| | |
| --- | --- |
| **Purpose** | Make firing and propagation observable tick by tick through a one-screen observatory. |
| **Scientific objective** | Validate discrete-time excitatory propagation (branching and convergence) with structured step traces. |
| **Observable outcome** | Mission Control shows graph, selected-neuron strip, timeline events, and electrode-style stimulation; every visual pulse maps to a backend propagation. |

---

## Current

### 0.6 Artificial Neural Tissue ← CURRENT

| | |
| --- | --- |
| **Purpose** | Organize many neurons as tissue, not only as a flat educational graph. |
| **Scientific objective** | Introduce physical/organizational structure: positions, regions, layers, cell types, developmental identity parameters, excitatory and inhibitory neurons. |
| **Observable outcome** | Mission Control can inspect tissue organization and E/I dynamics without inventing state in the browser. |

**Out of scope for 0.6:** memory, learning, body, prediction, cognition.

---

## Future

### 0.7 Synaptic Plasticity

| | |
| --- | --- |
| **Purpose** | Allow existing connections to strengthen and weaken through activity. |
| **Scientific objective** | Study Hebbian-style adaptation and connection history as tissue change over time. |
| **Observable outcome** | Weight changes and adaptation events are visible in Mission Control and logged by the backend. |

### 0.8 Structural Plasticity

| | |
| --- | --- |
| **Purpose** | Allow the wiring diagram itself to change. |
| **Scientific objective** | Model axon/dendrite growth metaphors, pruning, and birth of new synapses as inspectable processes. |
| **Observable outcome** | New, removed, or remodeled connections appear in snapshots and traces — not as silent UI edits. |

### 0.9 Artificial Body

| | |
| --- | --- |
| **Purpose** | Give the nervous system a body, beginning with a smartphone. |
| **Scientific objective** | Route real sensors (touch, camera, microphone, device sensors) and actuators (speaker, haptics) toward receptor/effector pathways. |
| **Observable outcome** | Sensory events and effector commands are visible as structured inputs/outputs into backend tissue — not as hardcoded app behaviors labeled “perception.” |

### 1.0 Closed Sensorimotor Loop

| | |
| --- | --- |
| **Purpose** | Close perception → action → feedback. |
| **Scientific objective** | Study activity patterns that persist because the system acts on an environment that acts back. |
| **Observable outcome** | Loop traces show sensory intake, tissue activity, and action consequences without a central scripted “agent brain.” |

### 1.1 Prediction

| | |
| --- | --- |
| **Purpose** | Introduce prediction and prediction error as tissue dynamics. |
| **Scientific objective** | Ask whether predictive structure can arise without a hardcoded reasoning engine. |
| **Observable outcome** | Prediction-related signals/errors are inspectable fields or events, not hidden model weights claimed as “understanding.” |

### 1.2 Memory

| | |
| --- | --- |
| **Purpose** | Persist useful organization beyond immediate ticks. |
| **Scientific objective** | Distinguish working vs longer-term retention as mechanisms that can be measured. |
| **Observable outcome** | Memory-related state is backend-owned and Mission Control–inspectable. |

### 1.3 Learning

| | |
| --- | --- |
| **Purpose** | Allow experience to change future behavior through tissue mechanisms. |
| **Scientific objective** | Study generalization as an outcome of plasticity + embodiment + loops — not as a bolted-on ML trainer. |
| **Observable outcome** | Learning effects are reproducible from logged experience and observable parameter/structure change. |

### 1.4 Emergent Cognition

| | |
| --- | --- |
| **Purpose** | Observe whether cognition-like organization appears. |
| **Scientific objective** | Test the project’s central question without hardcoding intelligence. |
| **Observable outcome** | Claims, if any, are tied to measurable patterns and criteria — never to marketing demos that fake a mind. |

**Do not hard-code intelligence at any milestone.**

---

## Document map

- Constitution: [`NEURONET.md`](NEURONET.md)
- Philosophy: [`docs/PROJECT_PHILOSOPHY.md`](docs/PROJECT_PHILOSOPHY.md)
- Architecture: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- Scientific model: [`docs/SCIENTIFIC_MODEL.md`](docs/SCIENTIFIC_MODEL.md)
- Development guide: [`docs/DEVELOPMENT_GUIDE.md`](docs/DEVELOPMENT_GUIDE.md)
