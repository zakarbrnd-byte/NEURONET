# NEURONET

**Version 0.5 — Network Dynamics Observatory**

NEURONET explores whether cognition can emerge from biologically-inspired computational principles.

It is **not** a chatbot and **not** an LLM.

## Architecture

- The **Rust backend** owns neurons, connections, membrane potentials, firing, propagation, ticks, and events.
- The **React frontend** is an observatory. It renders backend snapshots and step traces.
- The frontend never invents neural state, signal paths, or firing decisions.

## Version 0.5 network

Deterministic five-neuron topology with branching and convergence:

```text
                  NEURON-003
                ↗            ↘
NEURON-001 → NEURON-002       NEURON-005
                ↘            ↗
                  NEURON-004
```

Fixed excitatory weights:

| Connection | Weight |
| --- | --- |
| 001 → 002 | 16 mV |
| 002 → 003 | 16 mV |
| 002 → 004 | 16 mV |
| 003 → 005 | 8 mV |
| 004 → 005 | 8 mV |

NEURON-005 needs converging input from both 003 and 004.

## Direct node interaction

- **Tap** a neuron to open the inspector (no signal).
- **Long-press** (~500 ms) a neuron to inject **+5 mV** through the backend.
- In the inspector: **Stimulate +5 mV**, **Strong Stimulus +20 mV**, or **Close**.

This is labeled **direct electrode-style stimulation**. It is not natural touch perception. Future versions may route input through sensory receptor nodes.

## Reproduce the cascade

1. Reset Network
2. Tap NEURON-001 to open the inspector
3. Strong Stimulus +20 mV
4. Step One Tick repeatedly

Expected discrete progression:

| Tick | Fired | Propagations |
| --- | --- | --- |
| 1 | N-001 | N-001 → N-002 (+16 mV) |
| 2 | N-002 | N-002 → N-003 (+16), N-002 → N-004 (+16) |
| 3 | N-003, N-004 | both → N-005 (+8 each) |
| 4 | N-005 | none |

Or use **Run Sequence** (800 ms between backend steps, max 12). Pause stops future requests only.

Every visual pulse comes from a structured backend propagation in `POST /api/network/step`.

## Scientific scope

This is a simplified educational model. It demonstrates membrane accumulation, threshold firing, refractory recovery, directed excitatory connections, and discrete-time propagation.

It does **not** demonstrate learning, memory, cognition, inhibition, or biophysical timing accuracy.

## Run locally

### Backend

```bash
cd backend
cargo run
```

### Frontend

```bash
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173/NEURONET/`

## Tests and builds

```bash
npm test
npm run build
cd backend && cargo test && cargo build --release
```

## Public deployment

- Frontend (GitHub Pages): https://zakarbrnd-byte.github.io/NEURONET/
- Backend (Render): https://neuronet-backend-qphx.onrender.com

GitHub Actions builds the frontend with repository variable `VITE_API_BASE_URL`.

Render free services may cold-start after idle time. The first request can be slow; backend memory resets on restart.

## API

- `GET /api/health` → version `0.5`
- `GET /api/network`
- `GET /api/events`
- `POST /api/neurons/:id/signals`
- `POST /api/network/step` → structured step trace
- `POST /api/network/reset`
