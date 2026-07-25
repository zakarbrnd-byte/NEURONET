# NEURONET Architecture — Version 0.1

## Project Philosophy

NEURONET explores whether cognition can emerge from a decentralized society of autonomous computational cells inspired by biological neurons.

This project is **not**:

- another chatbot
- another LLM
- another conventional neural network
- another AI assistant

It is a new computing architecture inspired by biology rather than traditional CPU/RAM separation. Each computational cell both **computes** and **stores memory**. There is never a central brain. Every future capability must emerge from local interactions.

### Absolute Rules

1. **No Central Controller** — no master scheduler, no master memory, every node autonomous.
2. **Local Knowledge Only** — a cell knows itself, its memory, received messages, and (later) neighbors. Never the global graph.
3. **Everything Evolves** — learning, forgetting, strengthening, weakening, creating, and pruning connections must be additive, not architectural rewrites.
4. **Memory and Computation Live Together** — never separated into global stores and remote processors.

## Why Decentralized Architecture

Centralized cognition recreates the same bottleneck biology abandoned: one point of failure, one scheduler of thought, one memory to corrupt.

A society of identical cells can:

- survive partial failure
- scale by replication rather than redesign
- develop specialization through local interaction
- evolve connection topology without a planner

Version 0.1 proves the atom: one living cell. The molecule — millions of cells — must fit the same shape.

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

Energy is clamped to `0..=100`. Costs saturate at zero; recovery saturates at 100. A solitary cell still forms a somatic memory each tick so experience continues without an external stimulus generator.

### States

- `Sleeping`
- `Awake`
- `Processing`

## Crate Layout

```
NEURONET/
├── Cargo.toml              # workspace + CLI binary
├── src/main.rs             # hosts the first living cell
├── core/                   # reusable Cell Runtime library
│   └── src/
│       ├── node/           # Cell trait + DigitalCell
│       ├── memory/         # local memory entries + store
│       ├── energy/         # metabolic budget
│       ├── messaging/      # envelope + per-cell inbox
│       ├── scheduler/      # local tick clock (not a master)
│       └── runtime/        # persistence + orchestration
├── tests/                  # integration tests
└── docs/architecture.md
```

## Architecture Decisions

### Cell Runtime, not “a Node”

The public contract is the object-safe `Cell` trait:

- `wake`
- `receive`
- `process`
- `remember`
- `sleep`
- `tick`

`DigitalCell` is the first implementor. Future versions may hold `Vec<Box<dyn Cell>>` without redesign.

### Local Scheduler, not Master Scheduler

`LocalScheduler` belongs to a runtime instance. It is a metabolic clock for the cells that runtime hosts. It is **not** a global authority over the NEURONET society. Multi-cell societies will compose many local clocks, never one omniscient ticker.

### Persistence is Local Identity

SQLite stores:

- identity (UUID, creation time, tick count, state)
- energy
- memory fragments (UUID, timestamp, payload, confidence)

Restarting the process restores the same organism. The database may hold many cells keyed by identity so colony hosting remains a configuration change, not a rewrite.

### Messaging without a Bus

Each cell owns a FIFO inbox. Delivery is an explicit local `deliver` into that inbox. Neighbor discovery and transport attach later; the envelope (`id`, `sender`, `timestamp`, `payload`) stays stable.

### Evolution Seams

- `MemoryStore::forget` exists so forgetting can activate without relocating ownership.
- Confidence is first-class on every memory.
- Energy costs are centralized constants for future adaptive metabolism.
- Runtime already iterates a `Vec` of cells.

## Running

```bash
cargo run
```

Environment:

- `NEURONET_DB` — optional path to the SQLite file (default: `neuronet_cell.db`)
- `RUST_LOG` — optional tracing filter (default: `info`)

Graceful shutdown on `Ctrl+C` flushes persistence.

## Future Roadmap

1. **v0.2 — Colony** — many cells in one process, still no central brain.
2. **v0.3 — Neighborhood** — local addressing and neighbor sets.
3. **v0.4 — Synapses** — weighted connections that strengthen and weaken.
4. **v0.5 — Plasticity** — learn, forget, prune, sprout from local rules.
5. **v0.6 — Metabolism** — adaptive energy strategies and dormancy.
6. **v1.0 — Emergent Cognition** — behaviors arising solely from local interaction.

No roadmap item may introduce a central controller, global memory, or omniscient scheduler.
