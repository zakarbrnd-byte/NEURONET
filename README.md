# NEURONET

**A Digital Nervous System.**

| | |
| --- | --- |
| **Project type** | Experimental Artificial Nervous System |
| **Current version** | **0.6A — Artificial Neural Tissue** |
| **Constitution** | [`NEURONET.md`](NEURONET.md) |

NEURONET constructs a biologically-inspired digital nervous system and scientifically observes whether cognition can emerge through development.

It is not a chatbot. It is not an LLM. It is not a text prediction product.

---

## Project Philosophy

The goal is not to directly program intelligence.

The goal is to build tissue, embodiment, interaction, memory, structural adaptation, and learning as biological conditions — then observe what, if anything, emerges.

Read [`NEURONET.md`](NEURONET.md) and [`docs/PROJECT_PHILOSOPHY.md`](docs/PROJECT_PHILOSOPHY.md).

---

## Current Version — 0.6A Artificial Neural Tissue

Physical organization of a deterministic observatory tissue:

- fixed neuron positions (backend-owned)
- region / layer / cell type / DNA id
- soma, dendrite field, axon length
- excitatory and inhibitory cells and synapses
- Mission Control **Network** and **Tissue** views

**Not included in 0.6A:** learning, memory, growth, pruning, moving neurons, body, prediction, cognition.

---

## Network View vs Tissue View

| View | Role |
| --- | --- |
| **Network View** | Schematic graph for dynamics. Educational layout. Arrow links. |
| **Tissue View** | Physical organization. Backend positions never move. Solid soma + transparent dendrite field. Smooth axons. Excitatory **arrow** `────►` vs inhibitory **bar** `────⊣`. |

---

## Current Scientific Stage

**Implemented**

- neurons, membrane potentials, firing, propagation, refractory recovery
- deterministic tissue with fixed positions
- one inhibitory cell (NEURON-004) and one inhibitory synapse (004 → 005)

**Not yet**

- memory, learning, structural plasticity / growth, embodiment, cognition

---

## Architecture

- The **Rust backend** owns neurons, connections, membrane potentials, tissue geometry, firing, propagation, ticks, and events.
- The **React Mission Control** observes snapshots and step traces.
- The frontend never invents neural state, signal paths, or firings.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Observatory tissue (0.6A)

```text
                  NEURON-003 (E)
                ↗            ↘ +8
NEURON-001 → NEURON-002       NEURON-005
                ↘            ↗ −8
                  NEURON-004 (I)
```

Fixed positions (normalized):

| Neuron | x | y | Type |
| --- | --- | --- | --- |
| N-001 | 0.12 | 0.50 | Excitatory |
| N-002 | 0.32 | 0.50 | Excitatory |
| N-003 | 0.60 | 0.28 | Excitatory |
| N-004 | 0.60 | 0.72 | Inhibitory |
| N-005 | 0.88 | 0.50 | Excitatory |

Reset recreates the identical tissue. Age counts seconds since the backend process started.

## Mission Control

One-screen observatory:

- tissue status header (Alive · Cells · Synapses · Region · Age)
- Network or Tissue viewport
- selected-neuron strip → Node sheet (includes **Biology**)
- quick Step / Run·Pause / Reset
- bottom nav: Network · Tissue · Timeline · Controls

Direct node interaction (both views):

- **Tap** — inspect (no signal)
- **Long-press** (~500 ms) — inject **+5 mV** via backend

## Reproduce dynamics

1. Reset Network
2. Strong Stimulus +20 mV on NEURON-001
3. Step One Tick repeatedly

N-001 → N-002 → {N-003, N-004}. On the convergent tick, N-003 delivers **+8 mV** while inhibitory N-004 delivers **−8 mV**, so net drive on N-005 cancels in this tissue.

Or use **Run Sequence** (800 ms between backend steps, max 12).

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

GitHub Actions builds with repository variable `VITE_API_BASE_URL`.

Render free services may cold-start; backend memory resets on restart.

## API

- `GET /api/health` → version `0.6A`, `ageSeconds`
- `GET /api/network` → snapshot including `tissue` + neuron biology fields
- `GET /api/events`
- `POST /api/neurons/:id/signals`
- `POST /api/network/step` → structured step trace (signed `amountMv`)
- `POST /api/network/reset`
