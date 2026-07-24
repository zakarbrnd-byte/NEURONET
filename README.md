# NEURONET

**Artificial Life Operating System (ALOS)**

Research whether cognition can emerge from a decentralized society of
autonomous computational cells inspired by biology.

---

## Project Vision

NEURONET is a scientific research platform for artificial life.

It is **not** another chatbot.  
It is **not** another Large Language Model.  
It is **not** another conventional neural network product.

Instead of simulating intelligence as a monolithic model, NEURONET investigates
whether intelligence can **grow** from local interactions among autonomous
computational cells — organisms that both compute and remember.

There is never a central brain.

---

## Mission

Build an enduring experimental substrate where:

- computational cells live with local memory and local metabolism
- societies form through local communication
- adaptation and forgetting can evolve over time
- observation is possible without control becoming cognition
- hypotheses can be tested, supported, or falsified

---

## Artificial Life Operating System

NEURONET is designed as an **ALOS** — an operating platform for digital life
research.

| Layer | Role |
|-------|------|
| Digital Cell | Atomic autonomous organism |
| Runtime / Network | Local hosting and future societies |
| Mission Control | Permanent scientific observatory |
| Experiment Lab | Future hypothesis execution environment |

Mission Control is comparable to a flight/science console: it observes and
supports experiments. It does not think for the organism.

---

## Repository Structure

```text
NEURONET/
├── backend/                 # Rust organism host + API (scaffolded)
│   ├── src/
│   ├── core/
│   ├── cell/
│   ├── memory/
│   ├── messaging/
│   ├── scheduler/
│   ├── runtime/
│   ├── energy/
│   ├── api/
│   ├── storage/
│   └── tests/
├── frontend/                # Mission Control UI preparation
├── shared/                  # types, protocols, constants
├── docs/                    # diagrams, experiments, research, screenshots
├── .github/workflows/       # CI
├── README.md
├── ROADMAP.md
├── PHILOSOPHY.md
├── ARCHITECTURE.md
├── HYPOTHESES.md
├── CONTRIBUTING.md
├── CLAUDE.md
└── LICENSE
```

Every major folder includes a README describing its purpose.

---

## Tech Stack

### Planned backend

- Rust (stable)
- Cargo workspace
- Tokio
- Axum
- Serde
- SQLite
- Tracing

### Planned frontend

- React
- TypeScript
- Vite

### Communication

- REST first for Mission Control
- Architecture prepared for WebSockets later

### Current status

Foundation scaffolding only. Organism logic is intentionally unimplemented.

---

## Roadmap Summary

| Version | Focus |
|---------|-------|
| **0.0** | Repository foundation (current) |
| **0.1** | Digital Cell |
| **0.15** | Mission Control |
| **0.2** | Living Network |
| **0.3** | Adaptive Brain |
| **0.4** | Observatory |
| **0.5** | Experiment Lab |
| **0.6** | Learning Engine |
| **0.7** | Emergent Concepts |
| **1.0** | Cognitive Organism |

See [`ROADMAP.md`](ROADMAP.md) for long-term versions and version discipline.

---

## Quick Start

### Prerequisites

- Rust stable (`rustup`)
- Git

### Verify foundation

```bash
cargo check --workspace
cargo run -p neuronet-backend
```

Expected result: the scaffold binary identifies NEURONET and reports that
organism logic is not loaded yet.

### Read the constitution

1. [`PHILOSOPHY.md`](PHILOSOPHY.md)
2. [`ARCHITECTURE.md`](ARCHITECTURE.md)
3. [`ROADMAP.md`](ROADMAP.md)
4. [`HYPOTHESES.md`](HYPOTHESES.md)
5. [`CONTRIBUTING.md`](CONTRIBUTING.md)
6. [`CLAUDE.md`](CLAUDE.md) (required for AI coding agents)

---

## Mission Control Overview

Mission Control will be the permanent browser-based observatory for NEURONET.

It will allow researchers to:

- observe live cells
- inspect energy and memory statistics
- watch lifecycle activity
- inject experimental messages
- activate future modules (Network Map, Experiment Lab, and more)

It will **not** become a central reasoning engine.

Frontend folders are prepared now; UI implementation begins in version **0.15**.

---

## Foundational Laws

1. No Central Brain  
2. Local Knowledge Only  
3. Memory and Computation Are Inseparable  
4. Everything Evolves  
5. Intelligence Must Emerge  

---

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md).

Pull requests that reintroduce a central brain, global cognitive memory, or
hardcoded cognition will be rejected.

---

## License

MIT — see [`LICENSE`](LICENSE).
