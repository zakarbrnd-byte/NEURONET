# NEURONET

**A Digital Nervous System.**

| | |
| --- | --- |
| **Project type** | Experimental Artificial Nervous System |
| **Current version** | **0.7 — Developmental Neural Tissue** |
| **Constitution** | [`NEURONET.md`](NEURONET.md) |

NEURONET constructs a biologically-inspired digital nervous system and scientifically observes whether cognition can emerge through development.

---

## Current Version — 0.7 Developmental Neural Tissue

**Version 0.7 makes artificial tissue visibly develop over simulation time.**

Deterministic lifecycle:

neural progenitor → maturation → differentiation → migration → settlement →
eligibility for electrical and structural behavior

Defaults grow conservatively from **5 settled neurons** to a maximum of **8**.
Only developing cells migrate; settled somas stay fixed. The frontend never
creates cells, chooses destinations, or invents migration.

This is a simplified developmental model — not embryology or stem-cell biology.

See [`docs/experiments/0.7_DEVELOPMENTAL_NEURAL_TISSUE.md`](docs/experiments/0.7_DEVELOPMENTAL_NEURAL_TISSUE.md).

---

## Prior: 0.6D Synapse Birth and Pruning

0.6D commits structural observations into topology mutations under explicit
limits. 0.7 preserves that system and adds cell-level development.

See [`docs/experiments/0.6D_SYNAPSE_BIRTH_AND_PRUNING.md`](docs/experiments/0.6D_SYNAPSE_BIRTH_AND_PRUNING.md).

---

## Network View vs Tissue View

| View | Role |
| --- | --- |
| **Network View** | Schematic graph. Tap neuron or synapse. |
| **Tissue View** | Positions, morphology, Development mode (progenitor zone, migration paths, candidates). |

Tissue Development mode shows backend progenitor zone, developing cells, and settlement targets.

---

## Architecture

- The **Rust backend** owns neurons, living synapses, plasticity, structural mutations, and developmental lifecycle.
- **Mission Control** observes snapshots/events and never invents biology.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Observatory tissue

Five initial settled neurons `NEURON-001`…`NEURON-005` and synapses `SYNAPSE-001`…`SYNAPSE-005`.  
`SYNAPSE-001` and `SYNAPSE-002` are structurally protected backbone pathways.  
Dynamically born cells continue from `NEURON-006`. Dynamic synapses from `SYNAPSE-0006`.

Reset restores the original five-neuron tissue and all ID / developmental counters.

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

Verification marker: **Developmental Neural Tissue · Version 0.7**  
Example: https://zakarbrnd-byte.github.io/NEURONET/?version=0.7
