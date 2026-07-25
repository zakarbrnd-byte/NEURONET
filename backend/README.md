# NEURONET Backend (0.6A)

**NEURONET — A Digital Nervous System.**

Rust neural core. Source of truth for neurons, connections, tissue geometry, stepping, and events.

Read first: [`../NEURONET.md`](../NEURONET.md).

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

## Artificial Neural Tissue

Five deterministic neurons with fixed positions, morphology, and one inhibitory cell (NEURON-004).

`GET /api/network` includes `tissue` metadata and per-neuron biology fields.

`POST /api/network/step` returns a structured step trace with signed `amountMv` (inhibitory deliveries are negative).

Health version: `0.6A`.

## Public host

Render Blueprint: `../render.yaml` + `Dockerfile`

CORS allow-list should include:

```text
https://zakarbrnd-byte.github.io
```

In-memory state resets when the host restarts. Tissue **Age** is process uptime.
