# NEURONET Backend (0.4)

Rust neural core. Source of truth for neurons, connections, stepping, and events.

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

## Public host

Configured for **Render** via:

- `../render.yaml`
- `Dockerfile`

CORS allow-list should include:

```text
https://zakarbrnd-byte.github.io
```

In-memory state resets when the host restarts.
