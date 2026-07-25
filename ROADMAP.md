# NEURONET Roadmap

NEURONET develops as an experimental **Artificial Nervous System**.

Milestones follow biological development, not a conventional AI feature list.

**Current development target: Version 0.6 — Artificial Neural Tissue**

Shipped observatory runtime remains **0.5** until 0.6 is implemented.

---

## Completed

### 0.1 Digital Cell ✅

Create the first autonomous computational unit and project foundation.

### 0.2 Biological Neuron ✅

Replace the basic digital node with a simplified biological neuron (membrane potential, threshold, firing, refractory recovery).

### 0.3 Neural Core ✅

Establish the neural simulation core as the authority for electrical dynamics.

### 0.4 Backend Network ✅

Move simulation ownership to a Rust backend and visualize the real backend network.

### 0.5 Mission Control ✅

Make backend firing and signal propagation observable tick by tick. Ship a one-screen Mission Control observatory UI over a deterministic excitatory network.

---

## Current

### 0.6 Artificial Neural Tissue ← CURRENT

Physical and biological organization of many neurons as tissue, not a flat debug graph alone.

Planned themes:

- physical organization
- neuron positions
- regions
- layers
- cell types
- DNA (developmental / identity parameters — not hardcoded cognition)
- excitatory and inhibitory neurons

Do **not** implement memory, learning, body, or cognition in this milestone.

---

## Next

### 0.7 Synaptic Plasticity

- connection strengthening
- connection weakening
- Hebbian adaptation
- connection history

### 0.8 Structural Plasticity

- axon growth
- dendrite growth
- pruning
- birth of new synapses

### 0.9 Artificial Body

- touch receptors
- phone sensors
- camera
- microphone
- speaker

The smartphone becomes the first body.

### 1.0 Closed Sensorimotor Loop

- perception
- action
- feedback

### 1.1 Prediction

- prediction
- prediction error

### 1.2 Memory

- working memory
- long-term memory

### 1.3 Learning

- experience
- generalization

### 1.4 Emergent Cognition

Observe whether cognition emerges naturally.

Do **not** hard-code intelligence.

---

## Development rule

Before implementing any milestone item, answer:

> Does this make NEURONET behave more like a living nervous system?

If the answer is no, do not implement it.

Canonical philosophy: [`docs/PROJECT_PHILOSOPHY.md`](docs/PROJECT_PHILOSOPHY.md)  
Architecture: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
