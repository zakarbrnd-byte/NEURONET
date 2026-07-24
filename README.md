# NEURONET

An experimental **Artificial Life Operating System (ALOS)**.

NEURONET explores whether cognition can emerge from a decentralized society of
autonomous computational cells. This is not a chatbot, LLM, or conventional
neural network. Each cell both computes and stores memory. There is never a
central brain.

## Version 0.15 — Mission Control

The browser is now the microscope.

```bash
./scripts/launch.sh
```

Open [http://127.0.0.1:8080](http://127.0.0.1:8080).

Mission Control lets you:

- observe a live Digital Cell
- watch lifecycle events
- view energy and memory statistics
- inject messages
- wake / sleep / step one tick

No terminal interaction is required after launch.

### Development

```bash
# Terminal 1 — organism host + API
cargo run -p neuronet-backend

# Terminal 2 — Vite observatory
cd frontend && npm install && npm run dev
```

### Tests

```bash
cargo test --workspace
cd frontend && npm run build
```

### Documentation

- [`docs/architecture.md`](docs/architecture.md)
- [`docs/mission-control.md`](docs/mission-control.md)

## Foundational Laws

1. No central brain
2. Local knowledge only
3. Memory and computation are inseparable
4. Everything evolves
5. Intelligence must emerge
