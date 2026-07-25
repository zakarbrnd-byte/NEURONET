# NEURONET

**A Digital Nervous System.**

| | |
| --- | --- |
| **Project type** | Experimental Artificial Nervous System |
| **Current version** | **0.6C — Structural Plasticity Foundations** |
| **Constitution** | [`NEURONET.md`](NEURONET.md) |

NEURONET constructs a biologically-inspired digital nervous system and scientifically observes whether cognition can emerge through development.

---

## Current Version — 0.6C Structural Plasticity Foundations

**Version 0.6C observes structural readiness and pruning risk.**  
**It does not create or delete synapses.**

The backend evaluates:

- which neuron pairs are plausible growth candidates
- which existing synapses are stable, monitoring, or at risk
- why those classifications were made (structured reason codes)

Tissue View adds a frontend-only display mode selector:

- **Activity** — firing and propagation emphasis
- **Structure** — soma, dendritic fields, axons, synapse strength
- **Development** — dashed growth candidates + pruning-risk markers

Mission Control never decides that a connection should grow or be pruned.

**Not included:** synapse creation/deletion, axon geometry growth over time, neuron birth/death, DNA mutation, randomness, body, memory, cognition.

See [`docs/experiments/0.6C_STRUCTURAL_PLASTICITY_FOUNDATIONS.md`](docs/experiments/0.6C_STRUCTURAL_PLASTICITY_FOUNDATIONS.md).

---

## Prior: 0.6B Synaptic Plasticity

Synapses remain first-class living objects (weight, usage, health, stability, age, Hebbian / idle adaptation). 0.6C adds observational structural state on top of that model.

---

## Network View vs Tissue View

| View | Role |
| --- | --- |
| **Network View** | Schematic graph. Tap a neuron or a synapse. Stroke thickness follows weight. |
| **Tissue View** | Fixed backend positions, morphology, E/I endings, Development candidates. |

Tap a connection/axon → **Synapse Inspector** (includes Development / pruning observation).  
Tap a dashed candidate → **Growth Candidate Inspector** (observation only).

---

## Architecture

- The **Rust backend** owns neurons, living synapses, tissue geometry, synaptic plasticity, **structural development state**, ticks, and events.
- **Mission Control** observes snapshots and step traces only.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Observatory tissue

Five neurons with living synapses `SYNAPSE-001`…`SYNAPSE-005`.  
NEURON-004 / SYNAPSE-005 are inhibitory.

Reset restores identical tissue and baseline synapse state, clears growth candidates and pair history, and restores stable/protected pruning observation defaults.  
Age of the tissue process continues across reset.

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

Verification marker: **Structural Plasticity Foundations · Version 0.6C**  
Example: https://zakarbrnd-byte.github.io/NEURONET/?version=0.6C
