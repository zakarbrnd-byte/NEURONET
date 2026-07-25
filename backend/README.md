# NEURONET Backend (0.6B)

**NEURONET — A Digital Nervous System.**

Rust neural core. Source of truth for neurons, **living synapses**, tissue geometry, stepping, and events.

Read first: [`../NEURONET.md`](../NEURONET.md).

## Local

```bash
cargo run
cargo test
```

Health version: `0.6B`.

`GET /api/network` returns `synapses` (not passive connections): weight, usage, health, stability, age, history.

Plasticity is deterministic Hebbian + idle decay. No randomness.

## Public host

Render Blueprint: `../render.yaml` + `Dockerfile`
