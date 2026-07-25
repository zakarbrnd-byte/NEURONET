# NEURONET

**Version 0.4 — Backend Neural Core and Network View**

NEURONET explores whether cognition can emerge from biologically-inspired computational principles.

It is **not** a chatbot and **not** an LLM.

## Architecture

- The **Rust backend** owns the neural network, membrane potentials, firing, connections, and events.
- The **React frontend** is an observatory. It draws backend snapshots and sends commands.
- The frontend never invents neurons, connections, or firing results.

## What Version 0.4 includes

Backend neural core with a deterministic starter network:

- `NEURON-001` → `NEURON-002`
- `NEURON-002` → `NEURON-003`

Educational millivolt neuron values:

- Resting potential: `-70 mV`
- Fire threshold: `-55 mV`
- Positive signals depolarize the membrane

Chrome Debug Board features:

- SVG network view from `GET /api/network`
- Neuron status panel with biological terms
- Backend event feed
- Weak Signal (`+5 mV`), Strong Signal (`+20 mV`), Next Network Tick, Reset Network
- Connection status: Connected / Connecting / Backend Unavailable

This millivolt model is an **educational approximation**, not a complete biophysical simulation.

## Biological terms

| Term | Meaning in NEURONET 0.4 |
| --- | --- |
| Resting Potential | Quiet baseline membrane voltage (`-70 mV`) |
| Current Membrane Potential | Present voltage of the selected neuron |
| Fire Threshold | Voltage that triggers a spike (`-55 mV`) |
| Refractory Period | Short rest after firing when the neuron cannot fire again |
| Fatigue | Temporary exhaustion after firing |
| Energy | Simple visual budget reduced by firing |

## Run locally

### 1. Backend

```bash
cd backend
cargo run
```

Default URL:

```text
http://127.0.0.1:3000
```

Optional environment:

```bash
NEURONET_PORT=3000
NEURONET_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### 2. Frontend

```bash
cp .env.example .env
npm install
npm run dev
```

Open:

```text
http://localhost:5173/NEURONET/
```

`.env` should contain:

```bash
VITE_API_BASE_URL=http://127.0.0.1:3000
```

## Tests

```bash
npm test
```

Or separately:

```bash
npm run test:frontend
npm run test:backend
```

## Build frontend

```bash
npm run build
```

## GitHub Pages limitation

GitHub Pages can host the React frontend, but **cannot run the Rust backend**.

The public site:

```text
https://zakarbrnd-byte.github.io/NEURONET/
```

will show **Backend Unavailable** unless a public backend URL is configured at build time with `VITE_API_BASE_URL`.

The Pages deployment does **not** silently fall back to frontend simulation.

## API overview

- `GET /api/health`
- `GET /api/network`
- `GET /api/events`
- `POST /api/neurons/:id/signals`
- `POST /api/network/step`
- `POST /api/network/reset`

## Folder map

```text
NEURONET/
├── backend/
│   ├── Cargo.toml
│   └── src/
│       ├── main.rs
│       ├── lib.rs
│       ├── api.rs
│       ├── network.rs
│       ├── neuron.rs
│       └── connection.rs
├── src/
│   ├── components/
│   ├── features/
│   │   ├── neuron/
│   │   └── network/
│   ├── services/
│   │   └── neuralApi.ts
│   ├── types/
│   │   └── neural.ts
│   ├── App.tsx
│   └── styles.css
├── .env.example
├── README.md
└── ROADMAP.md
```
