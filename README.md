# NEURONET

**A Digital Nervous System.**

| | |
| --- | --- |
| **Project type** | Experimental Artificial Nervous System |
| **Current version** | **0.8.1 — Autonomous Observation Stabilization** |
| **Constitution** | [`NEURONET.md`](NEURONET.md) |

NEURONET constructs a biologically-inspired digital nervous system and scientifically observes whether cognition can emerge through development.

---

## Current Version — 0.8.1 Autonomous Observation Stabilization

**Stabilization patch on 0.8.** Continuous Run no longer pauses on quiet ticks.
Balanced sensory patterns can produce evidence-based synapse birth within a
documented 300-tick calibration window without early pruning collapse.

Verification marker: **Autonomous Observation Stabilization · Version 0.8.1**  
Health: **0.8.1**

See [`docs/experiments/0.8.1_AUTONOMOUS_RUN_AND_STRUCTURAL_BALANCE.md`](docs/experiments/0.8.1_AUTONOMOUS_RUN_AND_STRUCTURAL_BALANCE.md).

### Prior: 0.8 Autonomous Sensory Environment

Continuous backend-owned sensory input:

```text
Environment → Sensory Event → Receptor → Neural Network
```

Laboratory Electrode remains distinct from receptor input.

See [`docs/experiments/0.8_AUTONOMOUS_SENSORY_ENVIRONMENT.md`](docs/experiments/0.8_AUTONOMOUS_SENSORY_ENVIRONMENT.md).

---

## Prior: 0.7 Developmental Neural Tissue

Backend-owned progenitor birth → maturation → differentiation → migration →
settlement at demo scale (5→8 neurons). Preserved in 0.8.

See [`docs/experiments/0.7_DEVELOPMENTAL_NEURAL_TISSUE.md`](docs/experiments/0.7_DEVELOPMENTAL_NEURAL_TISSUE.md).

---

## Network View vs Tissue View

| View | Role |
| --- | --- |
| **Network View** | Schematic graph. Tap neuron or synapse. |
| **Tissue View** | Activity / Structure / Development / Sensory modes. |

Sensory mode shows receptors, sensory connections, and pattern activity from the backend.

---

## Architecture

- The **Rust backend** owns neurons, synapses, development, and the sensory environment.
- **Mission Control** observes snapshots/events and never invents biology.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Observatory tissue

Five initial settled neurons and five neural synapses, plus three abstract
receptors with five sensory input connections (not neural synapses).

Reset restores tissue, environment seed, pattern counters, and ID sequences.

## Run locally

### Backend

```bash
cd backend
cargo run
```

### Frontend

```bash
cp .env.example .env
npm install
npm run dev
```

### Tests

```bash
npm test
```

## Deployment

| Surface | URL |
| --- | --- |
| Frontend (GitHub Pages) | https://zakarbrnd-byte.github.io/NEURONET/ |
| Backend (Render) | https://neuronet-backend-qphx.onrender.com |

Verification marker: **Autonomous Observation Stabilization · Version 0.8.1**  
Example: https://zakarbrnd-byte.github.io/NEURONET/?version=0.8.1
