# shared

Cross-boundary contracts for NEURONET.

## Purpose

Keep backend, frontend, and documentation aligned on:

- types
- protocols
- constants

## Layout

| Path | Role |
|------|------|
| `types/` | Shared data contracts |
| `protocols/` | REST / future WebSocket contracts |
| `constants/` | Module IDs, bounds, version labels |

## Rules

- Prefer additive changes
- Version breaking protocol changes deliberately
- Do not hide cognition inside shared utilities
- Distinguish contract docs from scientific claims
