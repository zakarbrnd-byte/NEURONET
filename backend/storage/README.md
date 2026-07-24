# backend/storage

Persistence adapters for local organism state.

## Intended contents (future)

- SQLite schema and migrations
- Save/restore of cell identity, energy, and local memory
- Multi-cell storage keyed by cell identity

## Rules

- Persistence is durable local state, not a world-brain
- Restart must restore the same organism identity
- Storage format should anticipate many identical cells
