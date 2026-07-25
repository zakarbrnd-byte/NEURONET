# NEURONET

**A Digital Nervous System.**

| | |
| --- | --- |
| **Project type** | Experimental Artificial Nervous System |
| **Shipped observatory** | Version **0.5** — Network Dynamics + Mission Control |
| **Current development target** | Version **0.6** — Artificial Neural Tissue |
| **Constitution** | [`NEURONET.md`](NEURONET.md) |

NEURONET constructs a biologically-inspired digital nervous system and scientifically observes whether cognition can emerge through development.

It is not a chatbot. It is not an LLM. It is not a text prediction product.

---

## Project Philosophy

NEURONET is an experimental **Artificial Nervous System** project.

The goal is not to directly program intelligence.

The goal is to build tissue, embodiment, interaction, memory, structural adaptation, and learning as biological conditions — then observe what, if anything, emerges.

Intelligence, if it appears, should emerge from the system. It should never be hardcoded as a central reasoning service.

Read the constitution first: [`NEURONET.md`](NEURONET.md).  
Extended discussion: [`docs/PROJECT_PHILOSOPHY.md`](docs/PROJECT_PHILOSOPHY.md).

---

## Current Version

**Implemented runtime:** `0.5`

- Rust neural core owns neurons, connections, membrane potentials, firing, propagation, ticks, and events.
- React Mission Control observes backend snapshots and step traces.
- Public deployment: GitHub Pages frontend + Render backend.

**Planning target:** `0.6 Artificial Neural Tissue`

Do not treat planning versions as implemented until the corresponding milestone ships.

---

## Current Scientific Stage

The project currently models:

- neurons
- membrane potentials
- firing
- propagation
- refractory recovery
- deterministic neural tissue (fixed excitatory topology)

---

## Current Scientific Limitations

The project does **not** yet model:

- memory
- learning
- synaptic or structural plasticity
- embodiment / body
- prediction
- cognition

Fatigue and energy fields exist as simplified educational indicators. They are not biophysical accounts of metabolism.

Inhibition is not yet implemented (planned under 0.6 tissue).

See [`docs/SCIENTIFIC_MODEL.md`](docs/SCIENTIFIC_MODEL.md).

---

## Project Principles

1. **Backend owns reality. Frontend only observes.**  
   Mission Control may inspect and send commands. It must never invent neural state.

2. **Increase biological realism.**  
   Prefer tissue, receptors, and adaptation over app-like “smart” features.

3. **Everything must be observable.**  
   If it cannot be visualized or inspected, it is not complete.

4. **Follow biological development order.**  
   Cell → neuron → tissue → plasticity → body → sensorimotor loop → prediction → memory → learning → cognition.

5. **Never program intelligence directly.**  
   No central mind service. No hardcoded cognition theater.

Design gate:

> Does this make NEURONET behave more like a living nervous system?

If no, do not implement it.

---

## Long-Term Vision

Study whether cognition can emerge from a digital nervous system that develops through biological stages.

Success is not benchmark leaderboards or conversational fluency.  
Success is a coherent, testable artificial nervous system that can be observed honestly.

---

## Development Strategy

Milestones follow biological development, not conventional AI feature lists.

```text
Digital Cell → Neuron → Neural Tissue → Plasticity → Body
→ Sensorimotor Loop → Prediction → Memory → Learning → Emergent Cognition
```

Roadmap: [`ROADMAP.md`](ROADMAP.md).  
Contributor / agent rules: [`docs/DEVELOPMENT_GUIDE.md`](docs/DEVELOPMENT_GUIDE.md).  
Ownership boundaries: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Architecture (summary)

| Layer | Role |
| --- | --- |
| **Rust backend** | Source of truth: neurons, connections, simulation |
| **Mission Control (React)** | Observatory: visualization, inspection, commands |
| **API** | REST snapshots, signals, step traces, reset |

The frontend never invents membrane potentials, firings, or signal paths.

---

## Version 0.5 network (shipped)

Deterministic five-neuron topology with branching and convergence:

```text
                  NEURON-003
                ↗            ↘
NEURON-001 → NEURON-002       NEURON-005
                ↘            ↗
                  NEURON-004
```

Fixed excitatory weights:

| Connection | Weight |
| --- | --- |
| 001 → 002 | 16 mV |
| 002 → 003 | 16 mV |
| 002 → 004 | 16 mV |
| 003 → 005 | 8 mV |
| 004 → 005 | 8 mV |

NEURON-005 needs converging input from both 003 and 004.

---

## Mission Control

One-screen observatory shell:

- compact status bar
- network graph (largest region)
- selected-neuron summary strip
- quick Step / Run·Pause / Reset
- bottom navigation → Node, Timeline, and Controls sheets

Direct node interaction:

- **Tap** a neuron to open the inspector (no signal).
- **Long-press** (~500 ms) a neuron to inject **+5 mV** through the backend.
- In Controls / Node sheets: **Stimulate +5 mV**, **Strong Stimulus +20 mV**.

This is **direct electrode-style stimulation**. It is not natural touch perception. Future versions may route input through sensory receptor nodes.

---

## Reproduce the cascade

1. Reset Network
2. Tap NEURON-001 to open the inspector
3. Strong Stimulus +20 mV
4. Step One Tick repeatedly

Expected discrete progression:

| Tick | Fired | Propagations |
| --- | --- | --- |
| 1 | N-001 | N-001 → N-002 (+16 mV) |
| 2 | N-002 | N-002 → N-003 (+16), N-002 → N-004 (+16) |
| 3 | N-003, N-004 | both → N-005 (+8 each) |
| 4 | N-005 | none |

Or use **Run Sequence** (800 ms between backend steps, max 12). Pause stops future requests only.

Every visual pulse comes from a structured backend propagation in `POST /api/network/step`.

---

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

---

## Tests and builds

```bash
npm test
npm run build
cd backend && cargo test && cargo build --release
```

---

## Public deployment

- Frontend (GitHub Pages): https://zakarbrnd-byte.github.io/NEURONET/
- Backend (Render): https://neuronet-backend-qphx.onrender.com

GitHub Actions builds the frontend with repository variable `VITE_API_BASE_URL`.

Render free services may cold-start after idle time. The first request can be slow; backend memory resets on restart.

Verify Mission Control layout:

https://zakarbrnd-byte.github.io/NEURONET/?ui=mission-control-1

---

## API

- `GET /api/health` → version `0.5`
- `GET /api/network`
- `GET /api/events`
- `POST /api/neurons/:id/signals`
- `POST /api/network/step` → structured step trace
- `POST /api/network/reset`
