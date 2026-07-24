# backend/core

Shared domain primitives used across backend modules.

## Intended contents (future)

- Common error types
- Identifiers and timestamps
- Cross-module traits that do not own cell cognition
- Constants shared by runtime, storage, and API layers

## Rules

- No global memory plane
- No central controller
- Prefer small, composable types over god-objects
