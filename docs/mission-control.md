# Mission Control — NEURONET v0.15

Mission Control is the permanent operating console for observing, debugging,
testing, and experimenting with the artificial organism.

It is **not** a product frontend bolted onto a chatbot. It is the microscope and
flight console for an Artificial Life Operating System.

## Role in the Architecture

- The Digital Cell remains autonomous.
- Mission Control never becomes a central brain.
- Control actions are experimenter interventions (wake, sleep, step, inject).
- Cognition is never hardcoded into the console.

## Launch

```bash
./scripts/launch.sh
```

Then open [http://127.0.0.1:8080](http://127.0.0.1:8080).

Development mode (API + Vite hot reload):

```bash
cargo run -p neuronet-backend
cd frontend && npm run dev
```

## Observatory API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/status` | Live cell telemetry |
| GET | `/api/logs` | Recent lifecycle events (newest first) |
| POST | `/api/message` | Inject `{ "payload": "..." }` into the cell inbox |
| POST | `/api/control` | `{ "command": "wake" \| "sleep" \| "tick" }` |
| GET | `/api/meta` | Console identity / version / transport |

REST is the v0.15 transport. The frontend talks through a `NeuronetClient`
interface so WebSockets can replace polling later without redesigning panels.

## Module Registry

The sidebar is permanent:

- Digital Cell (enabled)
- Network Map
- Experiment Lab
- Memory Explorer
- Evolution Monitor
- Metrics
- Time Machine
- Brain Graph
- Node Inspector
- Settings

Future releases activate modules. They do not redesign Mission Control.
