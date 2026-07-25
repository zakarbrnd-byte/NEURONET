# NEURONET Architecture

**NEURONET — A Digital Nervous System.**

Ownership and deployment boundaries for the Artificial Nervous System observatory.

| Document | Role |
| --- | --- |
| [`../NEURONET.md`](../NEURONET.md) | Constitution |
| [`PROJECT_PHILOSOPHY.md`](PROJECT_PHILOSOPHY.md) | Philosophy |
| [`SCIENTIFIC_MODEL.md`](SCIENTIFIC_MODEL.md) | Model assumptions |
| [`DEVELOPMENT_GUIDE.md`](DEVELOPMENT_GUIDE.md) | Contributor rules |

**Shipped runtime target:** Version **0.8 Autonomous Sensory Environment**  
(Virtual sensory environment + receptors + preserved development/plasticity.)

---

## Overview

```text
┌─────────────────────────────────────────────────────────┐
│  Mission Control (React / TypeScript / Vite)            │
│  visualization · interaction · inspection · commands    │
│  RENDERING + OBSERVATION OWNERSHIP                      │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTP (REST)
                            │ snapshots, step traces, signals
┌───────────────────────────▼─────────────────────────────┐
│  Neural Core (Rust / Axum)                              │
│  neurons · synapses · environment · receptors ·         │
│  plasticity · development · discrete ticks              │
│  SIMULATION OWNERSHIP — SOURCE OF TRUTH                 │
└─────────────────────────────────────────────────────────┘
```

Backend owns reality.  
Frontend observes reality and issues explicit commands that the backend executes.

---

## Backend

The Rust backend owns:

| Concern | Notes |
| --- | --- |
| Neurons | Identity, electrical fields, tissue morphology |
| Living synapses | Weight, type, usage, health, stability, age, pruning observation |
| Membrane potential | Accumulation, threshold, firing decisions |
| Tissue | Deterministic positions, region/layer/cell type |
| Synaptic plasticity | Deterministic Hebbian / idle decay (0.6B) |
| Structural plasticity | Candidates, pruning risk, birth/prune commits (0.6D) |
| Development | Progenitor birth, lifecycle, migration, settlement (0.7) |
| Environment | Virtual sensory events, receptors, sensory connections (0.8) |
| Simulation | Discrete ticks, propagation, event logs, step traces |
| Authority | All neural state mutations |

Location: `backend/` (`neuron`, `synapse`, `structural`, `development`, `environment`, `network`, `api`).

Frontend must never invent neurons, synapses, environmental events, receptor
activations, developmental lifecycle, migration, signals, propagation, membrane
potentials, learning, or simulation state.

---

## Frontend

The React frontend owns:

| Concern | Notes |
| --- | --- |
| Visualization | Network + Tissue SVG; pulses from backend propagation traces only |
| Interaction | Tap inspect, long-press stimulate command, Step / Run / Pause / Reset |
| Inspection | Node / Synapse / Receptor / Growth Candidate / Timeline / Controls sheets |
| UI state | Selection, open panel, Tissue display mode, auto-step scheduling, gesture feedback |

Frontend local state must not include a parallel neural reality.

Location: `src/` (Mission Control page, features, services).

---

## Mission Control

Mission Control is the observatory shell — a microscope, not a mind.

Regions:

1. `mission-control-header` — brand, version, connection, tick, run/paused
2. `mission-control-main` — primary column
3. `network-viewport` — largest area; backend neurons and connections
4. `selected-neuron-strip` — compact summary
5. `quick-action-bar` — Step, Run/Pause, Reset
6. `bottom-navigation` — Network, Node, Timeline, Controls
7. `overlay-panel-layer` — detail sheets

Viewport-locked layout (`100dvh`, document `overflow: hidden`). Only sheets scroll internally.

Stimuli are commands. The backend decides tissue response.

---

## API

Current REST surface (0.8):

| Method | Path | Role |
| --- | --- | --- |
| `GET` | `/api/health` | Liveness; reports version `0.8` |
| `GET` | `/api/network` | Full snapshot (`development`, `environment`) |
| `GET` | `/api/events` | Recent structured events |
| `POST` | `/api/neurons/:id/signals` | Laboratory electrode (mV); rejects ineligible cells |
| `POST` | `/api/network/step` | Advance one tick; return step trace |
| `POST` | `/api/network/reset` | Reset tissue + environment |
| `POST` | `/api/environment/controls` | Toggle env/background/patterns/preset |

Step traces include `environmentTrace` (deliveries, activated receptors, patterns).
Tick order: environment → receptor delivery → firing → propagation → plasticity →
structure → development.

Visual connection pulses must map to structured `propagations`, not client-side guesses.

Prefer additive API evolution. Do not move authority into the browser for convenience.

---

## Simulation ownership

| Owner | Responsibility |
| --- | --- |
| Backend | Tick advancement, fire decisions, weight application, refractory, event emission |
| Frontend | Request steps on a timer when “Run” is active; never simulate membrane locally |

If the backend is unavailable, Mission Control shows connection state. It does not invent a fake network.

---

## Rendering ownership

| Owner | Responsibility |
| --- | --- |
| Frontend | Layout, SVG placement, sheets, accessibility, gesture UX |
| Backend | Which neurons exist, which edges exist, which mV values are true |

Graph layout heuristics (positioning unknown nodes) are presentation only. They must not create neural entities.

---

## Testing philosophy

- Backend tests lock electrical and network rules.
- Frontend tests lock observatory behavior (shell regions, sheets, gestures, API calls).
- Tests should prove observability contracts: structured events, no invented firings.
- Do not add “fake progress” scaffolds that claim unimplemented biology.

Definition of done includes observability: if it cannot be inspected, it is incomplete.

---

## Deployment architecture

| Surface | Host | Role |
| --- | --- | --- |
| Frontend | GitHub Pages | Static Mission Control build |
| Backend | Render | Neural core API |

- GitHub Actions builds with `VITE_API_BASE_URL` pointing at the public backend.
- Render may cold-start; in-memory tissue resets on restart.
- CORS allow-lists explicit origins (including the Pages host).

Do not relocate simulation to the browser to mask latency.

---

## GitHub Pages

- Serves the Vite production build under `/NEURONET/`.
- Contains no neural authority.
- Must remain a pure observatory client.

---

## Render

- Hosts the Rust API process.
- Owns the live tissue process memory for that instance.
- Blueprint/Dockerfile live under `backend/` and `render.yaml`.

---

## Future scaling

As the project grows toward tissue, plasticity, and body:

1. Keep simulation ownership in the backend (or later, explicitly distributed tissue processes — never in Mission Control).
2. Grow APIs additively with structured traces for every new biological mechanism.
3. Scale Mission Control as an instrument panel: more inspectors, not more invented dynamics.
4. Body sensors/actuators should enter as typed events into the same authority boundary.
5. Prefer designs that remain meaningful if neuron counts grow large.

---

## Design gate

> Does this make NEURONET behave more like a living nervous system?

If no, reject the design — even if it would make a flashier demo.
