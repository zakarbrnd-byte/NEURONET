# ARCHITECTURE.md

This document describes the intended architecture of NEURONET as a scientific
Artificial Life Operating System.

Complementary documents:

- Constitution: [`PHILOSOPHY.md`](PHILOSOPHY.md)
- Software versions: [`ENGINEERING_ROADMAP.md`](ENGINEERING_ROADMAP.md)
- Scientific phases: [`RESEARCH_ROADMAP.md`](RESEARCH_ROADMAP.md)

Foundation status: directories and contracts exist; organism logic does not.

---

## Overall Architecture

NEURONET separates three enduring concerns:

1. **Organism substrate** (`backend/`) — autonomous cells, local runtime, persistence
2. **Observatory** (`frontend/` + `backend/api`) — Mission Control instrumentation
3. **Research record** (`docs/`, `HYPOTHESES.md`, roadmaps) — questions, methods, evidence

```text
[ Digital Cells ]--local messages--[ Digital Cells ]
       |                                 |
       v                                 v
[ Local Runtime Host(s) ]         [ Local Runtime Host(s) ]
       \                                 /
        \--------- Observatory API -----/
                         |
                         v
                 [ Mission Control ]
                         |
                         v
              [ Experiments / Hypotheses ]
```

No box in this diagram is permitted to become a central brain.

---

## Backend

### Role

Host living computational cells and expose research instrumentation.

### Planned stack

- Rust (stable), Cargo workspace
- Tokio, Axum, Serde, SQLite, Tracing

### Module map

| Path | Responsibility |
|------|----------------|
| `backend/src` | Crate roots |
| `backend/core` | Shared non-cognitive primitives |
| `backend/cell` | Cell trait and Digital Cell |
| `backend/memory` | Local memory structures |
| `backend/messaging` | Envelopes and per-cell inboxes |
| `backend/energy` | Metabolic budget |
| `backend/scheduler` | Local metabolic clocks |
| `backend/runtime` | Process-local organism hosting |
| `backend/storage` | Persistence adapters |
| `backend/api` | Observatory HTTP/WebSocket surface |
| `backend/tests` | Integration tests |

### Rules

- Scheduler is local, never omniscient
- Storage snapshots local state; it does not centralize mind
- API handlers instrument and intervene; they do not plan

---

## Frontend

### Role

Mission Control — permanent browser observatory.

### Planned stack

- React, TypeScript, Vite

### Folder map

| Path | Responsibility |
|------|----------------|
| `frontend/src` | Application entry and app wiring |
| `frontend/components` | Reusable UI units |
| `frontend/layouts` | Stable shell chrome |
| `frontend/pages` | Module/page surfaces |
| `frontend/services` | Transport clients |
| `frontend/hooks` | Live state hooks |
| `frontend/types` | UI-local types |
| `frontend/assets` | Static assets |

### Shell commitment

Mission Control keeps a permanent module registry (Digital Cell, Network Map,
Experiment Lab, Memory Explorer, Evolution Monitor, Metrics, Time Machine,
Brain Graph, Node Inspector, Settings). Future versions activate modules; they
do not redesign the console identity.

---

## Mission Control

Mission Control is comparable to a scientific mission console:

- observe live organisms
- inspect energy, memory, and activity
- inject experimental stimuli
- run and review trials (future Experiment Lab)

Mission Control is **not** allowed to:

- own global cognitive memory
- become the society’s planner
- hardcode reasoning disguised as “helpful automation”

Transport begins with REST and must remain replaceable by streaming protocols
through a client interface boundary in `frontend/services` and
`shared/protocols`.

---

## Digital Cell

The Digital Cell is the atomic organism.

### Planned lifecycle

```text
Wake → Receive → Process → Remember → Sleep → Tick++
```

### Ownership

Each cell owns identity, energy, state, memory, inbox, and tick count.

### Scale assumption

Version 0.1 may run one cell. Every interface must assume millions of identical
cells may exist later without architectural redesign.

---

## Communication

- Cells communicate through local messages
- Experimenters may inject messages into a cell inbox via observatory APIs
- There is no semantic global bus that understands meaning for the society
- Protocol contracts live in `shared/protocols`

---

## Persistence

Persistence preserves organism continuity across restarts.

Planned persisted elements:

- cell identity
- energy
- local memory
- metabolic metadata required for restore

Persistence is durability for life, not a shared cognitive substrate.

---

## Modules

Modules are additive and law-preserving.

Engineering activates capabilities by version (`ENGINEERING_ROADMAP.md`).  
Research asks whether those capabilities produce scientific phenomena
(`RESEARCH_ROADMAP.md`, `HYPOTHESES.md`).

Never merge those concerns into one status light.

---

## Future Expansion

Expected expansions without constitutional change:

- multi-host societies
- adaptive topology
- local learning / forgetting
- richer observatory modules
- experiment automation and comparative trials

Forbidden expansions:

- central cognitive services
- global mind databases
- hardcoded planners presented as emergence
- chatbot product cores replacing the ALOS mission

---

## Docs Layout

| Path | Purpose |
|------|---------|
| `docs/architecture` | Deep-dive diagrams and ADRs |
| `docs/experiments` | Trial plans and results |
| `docs/hypotheses` | Extended hypothesis writeups |
| `docs/research` | Literature and theory notes |
| `docs/diagrams` | Visual figures |
| `docs/screenshots` | Observatory captures |

---

## What Foundation Omits

- Digital Cell implementation
- Mission Control implementation
- Learning systems
- Network dynamics

Scaffolding exists so implementation can begin without re-litigating structure.
