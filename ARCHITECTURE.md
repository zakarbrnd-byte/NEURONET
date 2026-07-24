# ARCHITECTURE.md — NEURONET System Architecture

This document describes the intended architecture of NEURONET as a research
platform. It is written for the foundation stage: folders and contracts exist;
organism logic does not yet.

 complementary constitution: `PHILOSOPHY.md`  
 complementary schedule: `ROADMAP.md`

---

## Architectural Intent

NEURONET is an Artificial Life Operating System (ALOS).

The architecture optimizes for:

- autonomous cells
- local knowledge
- co-located memory and compute
- evolutionary extensibility
- long-lived observatory tooling

The architecture rejects:

- central reasoning engines
- global cognitive memory
- hardcoded planning stacks
- chatbot interaction as the primary metaphor

---

## Repository Layout

```text
NEURONET/
├── backend/                 # Rust organism host + observatory API
│   ├── src/                 # crate roots
│   ├── core/                # shared backend primitives
│   ├── cell/                # Digital Cell
│   ├── memory/              # local memory
│   ├── messaging/           # local messaging
│   ├── scheduler/           # local clocks
│   ├── runtime/             # process-local host
│   ├── energy/              # metabolism
│   ├── api/                 # Mission Control API
│   ├── storage/             # persistence adapters
│   └── tests/
├── frontend/                # Mission Control UI
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── layouts/
│       ├── services/
│       ├── hooks/
│       ├── types/
│       └── assets/
├── shared/                  # cross-boundary contracts
│   ├── types/
│   ├── protocols/
│   └── constants/
├── docs/                    # research artifacts
│   ├── diagrams/
│   ├── experiments/
│   ├── research/
│   └── screenshots/
└── .github/workflows/       # CI
```

---

## Backend

### Role

The backend hosts living computational cells and exposes instrumentation.

It is an organism host, not an application server with business logic.

### Planned stack

- Rust (stable)
- Cargo workspace
- Tokio
- Axum (observatory API)
- Serde
- SQLite
- Tracing

### Module responsibilities

| Module | Responsibility |
|--------|----------------|
| `cell` | Autonomous cell trait + Digital Cell |
| `memory` | Local memory entries and stores |
| `messaging` | Envelopes and per-cell inboxes |
| `energy` | Metabolic budget |
| `scheduler` | Local tick timing |
| `runtime` | Hosting, snapshots, activity chronicle |
| `storage` | Durable local state |
| `api` | Mission Control HTTP/WebSocket surface |
| `core` | Shared non-cognitive primitives |

### Non-negotiables

- No master controller process that thinks for cells
- Scheduler is local, never omniscient
- Storage snapshots local state; it does not centralize mind

---

## Digital Cell

The Digital Cell is the atomic organism.

### Lifecycle (planned)

```text
Wake → Receive → Process → Remember → Sleep → Tick++
```

### Ownership

Each cell owns:

- identity
- energy
- state
- memory
- message queue
- tick counter

### Scaling assumption

Version 0.1 may run one cell, but every type and trait must assume millions of
identical instances may exist later (`Vec<Box<dyn Cell>>` readiness).

---

## Frontend — Mission Control

### Role

Mission Control is the permanent operating console for NEURONET.

Comparable to a scientific mission console / microscope:

- observe
- debug
- test
- experiment

It is not the product UI for a chatbot.

### Planned stack

- React
- TypeScript
- Vite

### Structural commitment

The sidebar module registry is permanent:

- Digital Cell
- Network Map
- Experiment Lab
- Memory Explorer
- Evolution Monitor
- Metrics
- Time Machine
- Brain Graph
- Node Inspector
- Settings

Future versions activate modules. They do not redesign Mission Control.

---

## Communication

### Early transport

REST between Mission Control and backend.

### Transport seam

Frontend services depend on an abstract client interface so WebSockets (or other
streams) can replace polling with minimal panel changes.

### Message philosophy

Messages are local signals between cells (or experimenter injections into a
cell inbox). There is no semantic global bus.

---

## Persistence

Persistence preserves organism continuity across process restarts.

Planned persisted elements:

- cell identity
- energy
- local memory
- tick / metabolic metadata as needed

Persistence is durability for life, not a shared cognitive substrate.

---

## Future Network

Version 0.2+ introduces living networks:

- many cells
- neighbor sets
- local delivery
- adaptive connections (0.3+)

Network growth must remain compatible with Laws 1–5.
No graph service may become a central brain.

---

## Shared Contracts

`/shared` keeps backend and frontend honest:

- `types/` — status, events, commands
- `protocols/` — REST / WebSocket contracts
- `constants/` — version labels, module IDs, bounds

Breaking protocol changes require documentation and roadmap awareness.

---

## Module Evolution Strategy

1. Implement the smallest living unit (Digital Cell).
2. Instrument it (Mission Control).
3. Replicate it (Living Network).
4. Allow it to adapt (Adaptive Brain / Learning Engine).
5. Measure emergence (Observatory / Experiment Lab / Emergent Concepts).

At every step, prefer additive modules over rewrites.

---

## What This Foundation Deliberately Omits

- No Digital Cell implementation
- No Mission Control UI implementation
- No experimental learning code
- No placeholder “AI” services

Scaffolding exists so implementation can begin without re-litigating structure.
