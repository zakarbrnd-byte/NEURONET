# NEURONET

**Shipped observatory: Version 0.5 — Network Dynamics + Mission Control**  
**Current development target: Version 0.6 — Artificial Neural Tissue**

NEURONET is an experimental **Artificial Nervous System** project.

It is not an AI product in the usual sense. It does not try to ship a finished mind.
It builds a biologically-inspired digital nervous system and observes what can emerge.

# Project Philosophy

NEURONET is not another chatbot.

It is not another LLM.

It is not a text prediction system.

Its purpose is to construct a digital nervous system that develops through biological principles.

Future cognition, if it ever appears, should emerge naturally from:

- biological organization
- embodiment
- interaction
- memory
- structural adaptation
- learning

rather than from directly programmed intelligence.

The goal is not to imitate existing AI.  
The goal is to investigate whether cognition can emerge from a biologically-inspired digital nervous system.

See [`docs/PROJECT_PHILOSOPHY.md`](docs/PROJECT_PHILOSOPHY.md) for the full design constitution.

## Current Scientific Stage

The project currently models:

- ✔ neurons
- ✔ membrane potentials
- ✔ firing
- ✔ propagation
- ✔ refractory recovery
- ✔ deterministic neural tissue

It does **not** yet model:

- ✘ memory
- ✘ learning
- ✘ structural plasticity
- ✘ embodiment
- ✘ cognition

# Project Principles

1. **The backend owns reality. The frontend only observes.**  
   Neural state, connections, and simulation ticks live in the Rust backend. Mission Control visualizes and issues commands; it never invents membrane potentials or firings.

2. **Every new feature should become more biologically realistic. Never more computer-like.**  
   Prefer tissue, receptors, and adaptation over dashboards, chat UX, or hardcoded “smart” services.

3. **Everything must be observable.**  
   If it cannot be observed, it cannot be validated. Mission Control exists as a microscope, not as a mind.

4. **Development follows biological development.**

   ```text
   Cells
   ↓
   Neurons
   ↓
   Tissue
   ↓
   Body
   ↓
   Experience
   ↓
   Learning
   ↓
   Cognition
   ```

5. **Intelligence is never programmed directly.**  
   It must emerge from the system — or not appear at all.

Before any future feature ships, ask:

> Does this make NEURONET behave more like a living nervous system?

If the answer is no, do not implement it.

## Architecture

- The **Rust backend** owns neurons, connections, membrane potentials, firing, propagation, ticks, and events.
- The **React frontend (Mission Control)** is an observatory. It renders backend snapshots and step traces.
- The frontend never invents neural state, signal paths, or firing decisions.

Full ownership boundaries: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

Roadmap: [`ROADMAP.md`](ROADMAP.md).

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

## Mission Control

The public UI is a one-screen Mission Control shell:

- compact status bar
- network graph (largest region)
- selected-neuron summary strip
- quick Step / Run·Pause / Reset
- bottom navigation → Node, Timeline, and Controls sheets

Direct node interaction:

- **Tap** a neuron to open the inspector (no signal).
- **Long-press** (~500 ms) a neuron to inject **+5 mV** through the backend.
- In Controls / Node sheets: **Stimulate +5 mV**, **Strong Stimulus +20 mV**.

This is labeled **direct electrode-style stimulation**. It is not natural touch perception. Future versions may route input through sensory receptor nodes.

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

## Scientific scope

This is a simplified educational model. It demonstrates membrane accumulation, threshold firing, refractory recovery, directed excitatory connections, and discrete-time propagation.

It does **not** demonstrate learning, memory, cognition, inhibition, biophysical timing accuracy, or embodiment.

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

GitHub Actions builds the frontend with repository variable `VITE_API_BASE_URL`.

Render free services may cold-start after idle time. The first request can be slow; backend memory resets on restart.

Verify Mission Control layout:

https://zakarbrnd-byte.github.io/NEURONET/?ui=mission-control-1

## API

- `GET /api/health` → version `0.5`
- `GET /api/network`
- `GET /api/events`
- `POST /api/neurons/:id/signals`
- `POST /api/network/step` → structured step trace
- `POST /api/network/reset`
