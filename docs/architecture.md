# NEURONET Architecture — Version 0.15

## Project Philosophy

NEURONET is an experimental **Artificial Life Operating System (ALOS)**.

It is **not**:

- another chatbot
- another Large Language Model
- another conventional neural network

Its purpose is to research whether cognition can emerge from a decentralized
society of autonomous computational cells inspired by biology.

Instead of simulating intelligence mathematically, NEURONET attempts to grow
intelligence organically through local interactions.

## Foundational Laws

1. **No Central Brain** — no master controller, no central reasoning engine, no global memory.
2. **Local Knowledge Only** — each cell knows itself, its memories, received messages, and (later) neighbors.
3. **Memory and Computation are inseparable** — every cell owns and executes both.
4. **Everything Evolves** — learn, forget, strengthen, weaken, create, and remove relationships must be additive.
5. **Intelligence Must Emerge** — never hardcode reasoning, planning, or cognition.

## Why Decentralized Architecture

Centralized cognition recreates the bottleneck biology abandoned: one point of
failure, one scheduler of thought, one memory to corrupt.

A society of identical cells can survive partial failure, scale by replication,
specialize through local interaction, and evolve topology without a planner.

## Digital Cell Lifecycle

Every second, a local runtime clock advances each hosted cell through:

```
Wake() → Receive() → Process() → Remember() → Sleep() → Tick++
```

| Phase | Responsibility | Energy |
|-------|----------------|--------|
| Wake | Enter awareness | −1 |
| Receive | Drain local inbox | — |
| Process | Transform signals into experience | −2 |
| Remember | Commit experience to local memory | −1 |
| Sleep | Rest and recover | +2 |
| Tick | Advance local counter | — |

Energy is clamped to `0..=100`.

## Mission Control

Mission Control is the permanent observatory console.

- Browser-based microscope into the organism
- REST API in v0.15, WebSocket-ready client boundary
- Sidebar module registry designed for lifelong expansion
- Only the Digital Cell module is active in v0.15

Mission Control may observe and apply experimenter interventions. It must never
become the organism's brain.

## Crate / Project Layout

```
NEURONET/
├── Cargo.toml                 # workspace
├── core/                      # reusable Cell Runtime library
├── backend/                   # Axum Mission Control host + API
├── frontend/                  # React + TypeScript observatory UI
├── shared/                    # API contract (TypeScript)
├── docs/                      # architecture + Mission Control docs
└── scripts/launch.sh          # one-command observatory launch
```

## Architecture Decisions

### Cell Runtime, not “a Node”

The public contract is the object-safe `Cell` trait. `DigitalCell` is the first
implementor. Future versions may hold `Vec<Box<dyn Cell>>`.

### Local Scheduler, not Master Scheduler

`LocalScheduler` / the backend life loop is a metabolic clock for cells hosted
in-process. It is not a global authority over NEURONET.

### Observatory is Instrumentation

`ActivityLog`, `CellStatus`, and control endpoints exist so researchers can see
and perturb the organism. They do not grant cells global knowledge.

### Transport Seam

Frontend panels depend on `NeuronetClient`. REST polling is the first adapter.
WebSockets can replace it without redesigning Mission Control.

### Evolution Seams

- `MemoryStore::forget`
- confidence on every memory
- centralized energy constants
- runtime iterates a `Vec` of cells
- sidebar module registry with enable flags

## Running

```bash
./scripts/launch.sh
```

Environment:

| Variable | Meaning | Default |
|----------|---------|---------|
| `NEURONET_DB` | SQLite path | `neuronet_cell.db` |
| `NEURONET_LISTEN` | API bind address | `127.0.0.1:8080` |
| `NEURONET_FRONTEND_DIST` | Built UI directory | `frontend/dist` |
| `RUST_LOG` | Tracing filter | `info` |

## Future Roadmap

1. **v0.2 — Colony** — many cells in one process, still no central brain
2. **v0.3 — Neighborhood** — local addressing and neighbor sets
3. **v0.4 — Synapses** — weighted connections that strengthen and weaken
4. **v0.5 — Plasticity** — learn, forget, prune, sprout from local rules
5. **v0.6 — Metabolism** — adaptive energy strategies and dormancy
6. **Mission Control modules** — activate Network Map, Memory Explorer, and beyond
7. **v1.0 — Emergent Cognition** — behaviors arising solely from local interaction

No roadmap item may introduce a central controller, global memory, omniscient
scheduler, or hardcoded cognition.
