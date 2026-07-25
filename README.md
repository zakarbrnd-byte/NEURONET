# NEURONET

**Artificial Life Operating System (ALOS)**

A scientific research platform investigating whether cognition can emerge from a
decentralized society of autonomous computational cells inspired by biology.

---

## Vision

NEURONET seeks to grow computational life rather than simulate intelligence as a
monolithic model.

We treat cognition as a possible outcome of local interaction, local memory, and
evolutionary dynamics — not as a feature to hardcode into a central service.

If intelligence appears, it must appear as an emergent property of the society
of cells.

---

## Mission

Research whether cognition can emerge from a decentralized society of autonomous
computational cells inspired by biology.

NEURONET is:

- a long-term artificial-life laboratory
- an engineering substrate for living computational organisms
- a measurement environment for scientific hypotheses

NEURONET is **not**:

- another chatbot
- another Large Language Model
- another conventional neural network product
- another AI assistant

---

## Artificial Life Operating System

NEURONET is designed as an **ALOS** — an operating platform for digital organisms
and the instruments required to study them.

| Layer | Purpose |
|-------|---------|
| Digital Cell | Atomic autonomous organism (memory + compute together) |
| Runtime / Network | Process-local hosting and future multi-cell societies |
| Mission Control | Permanent scientific observatory console |
| Experiment Lab | Future environment for controlled trials |

Mission Control is a microscope and flight console.  
It observes and supports experiments.  
It does not become the organism’s mind.

---

## Why This Project Exists

Modern AI development often concentrates capability into centralized models and
control planes. That approach is powerful — and it answers a different question
than the one NEURONET asks.

NEURONET asks:

> Can mind-like organization arise from many simple, local, autonomous units —
> the way biological systems do?

To answer that question honestly, the platform must:

1. forbid a central brain
2. keep knowledge local to cells
3. co-locate memory with computation
4. allow structure to evolve
5. refuse to hardcode cognition

This repository exists to hold that experiment for years.

---

## Repository Structure

```text
NEURONET/
├── backend/                 # Rust organism host + observatory API
│   ├── src/
│   ├── core/
│   ├── api/
│   ├── storage/
│   ├── runtime/
│   ├── cell/
│   ├── messaging/
│   ├── memory/
│   ├── scheduler/
│   ├── energy/
│   └── tests/
├── frontend/                # Mission Control UI preparation
│   ├── src/
│   ├── components/
│   ├── layouts/
│   ├── pages/
│   ├── services/
│   ├── hooks/
│   ├── assets/
│   └── types/
├── shared/                  # Cross-boundary contracts
│   ├── constants/
│   ├── protocols/
│   └── types/
├── docs/                    # Research and architecture artifacts
│   ├── architecture/
│   ├── experiments/
│   ├── hypotheses/
│   ├── research/
│   ├── screenshots/
│   └── diagrams/
├── .github/workflows/       # CI
├── README.md
├── PHILOSOPHY.md            # Constitution
├── ARCHITECTURE.md          # System architecture
├── ENGINEERING_ROADMAP.md   # Software delivery versions
├── RESEARCH_ROADMAP.md      # Scientific questions by phase
├── HYPOTHESES.md            # Hypothesis tracker
├── CONTRIBUTING.md
├── CLAUDE.md                # Guidance for AI coding agents
├── CHANGELOG.md
└── LICENSE
```

Engineering and research are deliberately separated so contributors can track
software readiness without confusing it with scientific progress.

---

## Technology Stack

### Backend (planned)

- Rust (stable)
- Cargo workspace
- Tokio
- Axum
- Serde
- SQLite
- Tracing

### Frontend (planned)

- React
- TypeScript
- Vite

### Shared contracts

- Types, protocols, and constants under `/shared`

### Current implementation status

**Foundation only.**  
The repository compiles as a scaffold. Organism logic, Mission Control, and
Digital Cells are intentionally not implemented yet.

---

## Engineering Roadmap

Software delivery versions (see [`ENGINEERING_ROADMAP.md`](ENGINEERING_ROADMAP.md)):

| Version | Name |
|---------|------|
| 0.0 | Repository Foundation |
| 0.1 | Digital Cell Runtime |
| 0.15 | Mission Control |
| 0.2 | Living Network |
| 0.3 | Adaptive Brain |
| 0.4 | Observatory |
| 0.5 | Experiment Lab |
| 0.6 | Learning Engine |
| 0.7 | Emergent Concepts |
| 1.0 | Cognitive Organism |

---

## Research Roadmap

Scientific phases (see [`RESEARCH_ROADMAP.md`](RESEARCH_ROADMAP.md)):

1. Can a Digital Cell exist?
2. Can multiple cells communicate?
3. Can distributed memory emerge?
4. Can cells reorganize themselves?
5. Can concept formation emerge?
6. Can prediction emerge?
7. Can distributed cognition emerge?

Later speculative questions (hypotheses, not promises): open-ended evolution,
curiosity, and eventually consciousness.

---

## Current Version

**0.0.0 — Repository Foundation**

Delivered:

- constitution and dual roadmaps
- permanent directory architecture
- Cargo workspace preparation
- frontend / shared preparation
- CI foundation checks
- initial hypothesis set

Not delivered (by design):

- Digital Cell runtime
- Mission Control UI
- learning or network dynamics

---

## Future Vision

A durable laboratory where:

- autonomous cells persist and interact locally
- societies form without a central controller
- plasticity and forgetting can evolve
- Mission Control measures without replacing cognition
- hypotheses are tested with evidence, not slogans

Success is scientific coherence over decades — not a viral demo.

---

## Constitution

Read [`PHILOSOPHY.md`](PHILOSOPHY.md) before contributing.

### Five Foundational Laws

1. No Central Brain  
2. Local Knowledge Only  
3. Memory and Computation Are Inseparable  
4. Everything Evolves  
5. Intelligence Must Emerge  

---

## Quick Start

```bash
cargo check --workspace
cargo run -p neuronet-backend
```

The scaffold binary identifies the project and confirms that no organism logic
is loaded.

Further reading:

- [`ARCHITECTURE.md`](ARCHITECTURE.md)
- [`ENGINEERING_ROADMAP.md`](ENGINEERING_ROADMAP.md)
- [`RESEARCH_ROADMAP.md`](RESEARCH_ROADMAP.md)
- [`HYPOTHESES.md`](HYPOTHESES.md)
- [`CONTRIBUTING.md`](CONTRIBUTING.md)
- [`CLAUDE.md`](CLAUDE.md)

---

## License

MIT — see [`LICENSE`](LICENSE).
