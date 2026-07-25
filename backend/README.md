# NEURONET Backend (0.5 shipped)

Rust neural core. Source of truth for neurons, connections, stepping, and events.

Project philosophy and ownership: [`../docs/PROJECT_PHILOSOPHY.md`](../docs/PROJECT_PHILOSOPHY.md), [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md).

**Current development target (planning):** Version 0.6 — Artificial Neural Tissue.  
This package still exposes health version `0.5` until that milestone is implemented.

## Local

```bash
cargo run
cargo test
```

Listens on `0.0.0.0`.

Port resolution:

1. `PORT` (cloud hosts)
2. `NEURONET_PORT` (optional local override)
3. default `3000`

## Observatory network

Five deterministic neurons with branching and convergence.

`POST /api/network/step` returns a structured step trace:

- `tick`
- `firedNeuronIds`
- `propagations` (`eventId`, `sourceNeuronId`, `targetNeuronId`, `amountMv`)
- `eventIds`
- `network`

## Public host

Render Blueprint: `../render.yaml` + `Dockerfile`

CORS allow-list should include:

```text
https://zakarbrnd-byte.github.io
```

In-memory state resets when the host restarts.
