# backend

Rust workspace member that will host the NEURONET organism runtime and
Mission Control observatory API.

## Purpose

- Own autonomous computational cell logic
- Persist local cell state
- Expose research instrumentation APIs
- Never become a central brain

## Layout

| Path | Role |
|------|------|
| `src/` | Crate roots (`lib.rs`, `main.rs`) |
| `core/` | Shared backend domain primitives |
| `cell/` | Digital Cell contract and implementations |
| `memory/` | Local memory structures owned by cells |
| `messaging/` | Local message envelopes and inboxes |
| `scheduler/` | Local metabolic clocks (not global masters) |
| `runtime/` | Process-local organism hosting |
| `energy/` | Metabolic energy model |
| `api/` | Observatory / Mission Control HTTP surface |
| `storage/` | Persistence adapters (e.g. SQLite) |
| `tests/` | Integration tests |

## Status

Foundation only (`0.0.0`). No organism logic is implemented yet.

See `ENGINEERING_ROADMAP.md` version 0.1 for the first implementation target.
