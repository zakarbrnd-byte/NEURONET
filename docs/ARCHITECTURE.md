# NEURONET Architecture

This document describes ownership boundaries for the Artificial Nervous System observatory.

Canonical philosophy: [`PROJECT_PHILOSOPHY.md`](PROJECT_PHILOSOPHY.md).

**Shipped runtime:** Version 0.5 (deterministic network + Mission Control)  
**Current development target:** Version 0.6 (Artificial Neural Tissue)

---

## Overview

```text
┌─────────────────────────────────────────────────────────┐
│  Mission Control (React / TypeScript / Vite)            │
│  visualization · interaction · inspection · commands    │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTP (REST today)
                            │ snapshots, step traces, signals
┌───────────────────────────▼─────────────────────────────┐
│  Neural Core (Rust / Axum)                              │
│  neurons · connections · membrane · tissue · simulation │
│  SOURCE OF TRUTH                                        │
└─────────────────────────────────────────────────────────┘
```

The backend owns reality.  
The frontend only observes (and issues explicit commands that the backend executes).

---

## Backend ownership

The Rust backend owns:

| Concern | Notes |
| --- | --- |
| **Neurons** | Identity, electrical parameters, refractory / fatigue / energy fields as defined by the model |
| **Connections** | Directed links and weights (excitatory today; inhibition planned in 0.6) |
| **Membrane potential** | Accumulation, threshold, firing decisions |
| **Tissue** | Network topology and, in 0.6+, physical/organizational structure |
| **Simulation** | Discrete ticks, propagation, event logs, step traces |
| **Authority** | All neural state mutations happen here |

Public API surface (0.5):

- `GET /api/health`
- `GET /api/network`
- `GET /api/events`
- `POST /api/neurons/:id/signals`
- `POST /api/network/step` → structured step trace
- `POST /api/network/reset`

The frontend must never invent neuron state, connection paths, or firing decisions.

---

## Frontend ownership

The React frontend (Mission Control) owns:

| Concern | Notes |
| --- | --- |
| **Visualization** | SVG network graph, pulses driven by backend propagation traces |
| **Interaction** | Tap to inspect, long-press to request stimulation, Step / Run / Pause / Reset |
| **Inspection** | Node / Timeline / Controls sheets and metric explanations |
| **Mission Control** | One-screen shell: status, graph, strip, quick actions, bottom navigation |
| **State synchronization** | Fetching snapshots/traces; local UI state only (selection, open panel, run loop scheduling) |

Frontend local state may include:

- selected neuron id
- open sheet / sub-tab
- whether an auto-step sequence is requesting ticks
- transient gesture feedback

Frontend local state must **not** include a parallel neural reality.

---

## Why backend authority is essential

1. **Scientific honesty** — Claims about firing and propagation must refer to one simulator.
2. **Observability** — Structured events and step traces can be logged, tested, and replayed.
3. **Scale** — One authoritative tissue model can grow toward many neurons without UI inventing dynamics.
4. **Philosophy** — Mission Control is a microscope. If the UI becomes the mind, the experiment collapses into a conventional app.

Stimuli (tap-hold +5 mV, inspector +5 / +20 mV, reset, step) are commands.  
The backend decides whether and how the tissue responds.

---

## Mission Control shell (frontend)

Regions:

1. `mission-control-header` — brand, version, connection, tick, run/paused
2. `mission-control-main` — primary column
3. `network-viewport` — largest area; backend neurons and connections
4. `selected-neuron-strip` — compact summary; opens Node sheet
5. `quick-action-bar` — Step, Run/Pause, Reset
6. `bottom-navigation` — Network, Node, Timeline, Controls
7. `overlay-panel-layer` — detail sheets (mobile bottom sheets / desktop side panel)

Document body remains viewport-locked (`100dvh`, `overflow: hidden`) during normal operation.
Only detail sheets scroll internally.

---

## Deployment topology

| Surface | Host | Role |
| --- | --- | --- |
| Frontend | GitHub Pages | Static Mission Control build |
| Backend | Render | Neural core API |

`VITE_API_BASE_URL` points the Pages build at the public backend.

Render free tiers may cold-start; in-memory tissue resets on host restart.

Do not move neural authority into the browser to “fix” latency.

---

## Version boundaries

| Version | Architectural meaning |
| --- | --- |
| 0.5 (shipped) | Deterministic excitatory network; Mission Control observatory |
| 0.6 (target) | Artificial neural tissue: positions, regions, layers, cell types, E/I |
| 0.7–0.8 | Plasticity (synaptic, then structural) — still backend-owned |
| 0.9–1.0 | Body + sensorimotor loop — sensors/actuators feed the same backend tissue |
| 1.1+ | Prediction, memory, learning — only as tissue dynamics, not UI intelligence |

---

## Design gate

Before adding a module, API, or UI surface:

> Does this make NEURONET behave more like a living nervous system?

If no, reject the design — even if it would make a flashier demo.
