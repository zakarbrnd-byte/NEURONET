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
PORT=3000
# or
NEURONET_PORT=3000
NEURONET_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,https://zakarbrnd-byte.github.io
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

## Public deployment (Render + GitHub Pages)

GitHub Pages hosts the React observatory. It **cannot** run the Rust backend.

Selected backend host: **Render** (free web service, Docker blueprint in `render.yaml`).

### How deployment works

1. Render builds `backend/Dockerfile` and runs one persistent-ish free web service.
2. That service exposes the existing Axum API over HTTPS.
3. GitHub Pages builds the frontend with `VITE_API_BASE_URL` pointing at the Render URL.
4. The browser calls the real backend. There is no frontend simulation fallback.

Backend state is **in memory**. When Render restarts or the free service wakes from sleep, the network resets to the deterministic three-neuron starter state.

### Deploy the backend on Render (phone-friendly)

1. Open [https://render.com](https://render.com) and sign in with GitHub.
2. Tap **New +** → **Blueprint**.
3. Select the `NEURONET` repository.
4. Apply the Blueprint (`render.yaml`).
5. Wait until the `neuronet-backend` service is Live.
6. Open the service URL and add `/api/health`.

Example:

```text
https://neuronet-backend.onrender.com/api/health
```

Expected response:

```json
{
  "status": "ok",
  "version": "0.4"
}
```

Also check:

```text
https://YOUR-RENDER-URL/api/network
```

You should see three neurons and two connections.

### Required environment variables

Backend (set by `render.yaml` / Render):

| Variable | Purpose |
| --- | --- |
| `PORT` | Provided automatically by Render |
| `NEURONET_CORS_ORIGINS` | Defaults in Blueprint to `https://zakarbrnd-byte.github.io` |
| `RUST_LOG` | Optional logging level |

Frontend build (GitHub Actions):

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Public HTTPS backend base URL, no trailing slash |

### Set `VITE_API_BASE_URL` in GitHub

1. Open the GitHub repo on your phone or computer.
2. Go to **Settings → Secrets and variables → Actions → Variables**.
3. Tap **New repository variable**.
4. Name: `VITE_API_BASE_URL`
5. Value: your Render URL, for example `https://neuronet-backend.onrender.com`
6. Save.

### Redeploy the frontend

1. GitHub → **Actions**
2. Open **Deploy to GitHub Pages**
3. Tap **Run workflow** → **Run workflow**

Or push any commit to `main`.

After deploy, open:

```text
https://zakarbrnd-byte.github.io/NEURONET/
```

You should see **Backend Connected**, three neurons, two connections, working signal/tick controls, and backend events.

### Test health quickly

```bash
curl https://YOUR-RENDER-URL/api/health
```

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
