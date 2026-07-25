# Observatory Protocol (draft reserved)

This document reserves the Mission Control observatory contract names.
Implementation begins with version 0.15.

## Planned REST routes

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/status` | Live cell telemetry |
| `GET` | `/api/logs` | Recent lifecycle events |
| `POST` | `/api/message` | Inject payload into local inbox |
| `POST` | `/api/control` | Experimenter commands: `wake`, `sleep`, `tick` |

## Transport evolution

- v0.15: REST + polling
- later: WebSocket (or equivalent) streaming with the same semantic payloads

Protocol documents describe instrumentation channels only.
They do not define intelligence.
