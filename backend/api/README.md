# backend/api

Observatory API surface for Mission Control.

## Intended contents (future)

- REST endpoints for status, logs, message injection, and control
- DTO mapping to `shared/` contracts
- Transport seam so WebSockets can replace polling later

## Rules

- API is instrumentation and experimentation, not cognition
- Control commands are researcher interventions
- Never encode planning or reasoning in handlers
