# NEURONET

**A Digital Nervous System.**

| | |
| --- | --- |
| **Project type** | Experimental Artificial Nervous System |
| **Current version** | **0.6B — Synaptic Plasticity** |
| **Constitution** | [`NEURONET.md`](NEURONET.md) |

NEURONET constructs a biologically-inspired digital nervous system and scientifically observes whether cognition can emerge through development.

---

## Current Version — 0.6B Synaptic Plasticity

**Synapses are now first-class biological objects.**  
Connections are living structures — not passive lines.

Every synapse owns:

- weight (signal strength in mV)
- type (excitatory / inhibitory)
- usage count
- last activated tick
- stability (0–1)
- health (0–1)
- age (ticks)
- creation tick
- short weight history

Deterministic Hebbian adaptation strengthens a synapse when its source delivers and its target fires on the next tick. Unused synapses slowly weaken. No randomness.

**Not included:** new neurons, pruning, growth, DNA mutation, memory, body, cognition.

---

## Network View vs Tissue View

| View | Role |
| --- | --- |
| **Network View** | Schematic graph. Tap a neuron or a synapse. Stroke thickness follows weight. |
| **Tissue View** | Fixed backend positions, soma/dendrite morphology, curved axons, E/I endings. |

Tap a connection/axon → **Synapse Inspector** (Weight, Usage, Health, Age, Stability, Type, Last Used, history).

---

## Architecture

- The **Rust backend** owns neurons, **living synapses**, membrane potentials, tissue geometry, plasticity, ticks, and events.
- **Mission Control** observes snapshots and step traces only.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Observatory tissue

Five neurons with living synapses `SYNAPSE-001`…`SYNAPSE-005`.  
NEURON-004 / SYNAPSE-005 are inhibitory.

Reset restores identical tissue and baseline synapse state.  
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

Open `http://localhost:5173/NEURONET/`

## Tests and builds

```bash
npm test
npm run build
cd backend && cargo test && cargo build --release
```

## Public deployment

- Frontend (GitHub Pages): https://zakarbrnd-byte.github.io/NEURONET/
- Backend (Render): https://neuronet-backend-qphx.onrender.com

## API

- `GET /api/health` → version `0.6B`, `ageSeconds`
- `GET /api/network` → `neurons`, **`synapses`**, `tissue`
- `GET /api/events`
- `POST /api/neurons/:id/signals`
- `POST /api/network/step` → step trace with `synapseId` on propagations
- `POST /api/network/reset`
