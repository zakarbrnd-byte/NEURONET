# NEURONET

A decentralized adaptive cognitive network.

NEURONET explores whether cognition can emerge from a society of autonomous computational cells. This is not a chatbot, LLM, or conventional neural network. Each cell both computes and stores memory. There is never a central brain.

## Version 0.1 — Digital Cell

The first autonomous computational organism.

```bash
cargo run
```

An autonomous `DigitalCell` will:

- wake
- receive local messages
- process experience
- store memory
- sleep
- persist identity, energy, and memory to SQLite
- restore after restart

Stop with `Ctrl+C`.

### Configuration

| Variable | Meaning | Default |
|----------|---------|---------|
| `NEURONET_DB` | SQLite path for cell persistence | `neuronet_cell.db` |
| `RUST_LOG` | Tracing filter | `info` |

### Tests

```bash
cargo test
```

### Documentation

See [`docs/architecture.md`](docs/architecture.md) for philosophy, lifecycle, decisions, and roadmap.

## Principles

1. No central controller
2. Local knowledge only
3. Everything evolves
4. Memory and computation live together
