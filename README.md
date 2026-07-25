# NEURONET

**A Digital Nervous System.**

| | |
| --- | --- |
| **Project type** | Experimental Artificial Nervous System |
| **Current version** | **0.6D — Synapse Birth and Pruning** |
| **Constitution** | [`NEURONET.md`](NEURONET.md) |

NEURONET constructs a biologically-inspired digital nervous system and scientifically observes whether cognition can emerge through development.

---

## Current Version — 0.6D Synapse Birth and Pruning

**Version 0.6D allows deterministic topology change.**

It still does not implement autonomous intelligence, body, memory, or realistic neurodevelopment.

The backend may:

- create a synapse from a fully matured growth candidate
- prune an unprotected synapse after sustained pruning eligibility

All structural changes are backend-owned, slow, evidence-based, observable, and restored by reset. The frontend never forces create/delete.

See [`docs/experiments/0.6D_SYNAPSE_BIRTH_AND_PRUNING.md`](docs/experiments/0.6D_SYNAPSE_BIRTH_AND_PRUNING.md).

---

## Prior: 0.6C Structural Plasticity Foundations

0.6C introduced growth candidates and pruning-risk observation. 0.6D commits those observations into topology mutations under explicit limits.

---

## Network View vs Tissue View

| View | Role |
| --- | --- |
| **Network View** | Schematic graph. Tap neuron or synapse. |
| **Tissue View** | Positions, morphology, Development candidates, birth/prune transitions. |

Tissue Development mode shows topology counters from the backend snapshot.

---

## Architecture

- The **Rust backend** owns neurons, living synapses, plasticity, structural evaluation, and mutation commits.
- **Mission Control** observes snapshots/events and never invents topology.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Observatory tissue

Five initial synapses `SYNAPSE-001`…`SYNAPSE-005`.  
`SYNAPSE-001` and `SYNAPSE-002` are structurally protected backbone pathways.  
Dynamic IDs continue from `SYNAPSE-0006`.

Reset restores the original five-synapse tissue and ID counter.

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

Verification marker: **Synapse Birth and Pruning · Version 0.6D**  
Example: https://zakarbrnd-byte.github.io/NEURONET/?version=0.6D
