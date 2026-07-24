# CLAUDE.md — Guidance for AI Coding Agents

This file is for future AI coding agents (and humans acting as architects).

Read it before generating code in this repository.

---

## Project Vision

**NEURONET** is an experimental **Artificial Life Operating System (ALOS)**.

Mission: research whether cognition can emerge from a decentralized society of
autonomous computational cells inspired by biology.

NEURONET is **not**:

- a chatbot
- an LLM wrapper
- a conventional neural network framework
- an AI assistant product

It is a scientific research platform.

---

## Current Version

**0.0 — Repository Foundation**

What exists:

- constitution and roadmap documents
- permanent directory architecture
- Cargo workspace scaffold
- frontend folder preparation
- shared contracts folders
- CI skeleton

What does **not** exist yet:

- Digital Cell implementation
- Mission Control UI implementation
- learning systems
- multi-cell networks

Do not invent those in drive-by refactors. Implement them only when the user
explicitly requests the corresponding roadmap version.

---

## Architecture Map

```text
backend/     Rust organism host + observatory API (future)
frontend/    Mission Control observatory UI (future)
shared/      cross-boundary types/protocols/constants
docs/        research artifacts and diagrams
```

Canonical docs:

- `PHILOSOPHY.md` — constitution
- `ARCHITECTURE.md` — structure
- `ROADMAP.md` — version plan
- `HYPOTHESES.md` — research claims
- `CONTRIBUTING.md` — human/agent workflow

---

## Roadmap (agent-facing summary)

| Version | Name | Agent implication |
|---------|------|-------------------|
| 0.0 | Foundation | Docs + scaffold only |
| 0.1 | Digital Cell | Implement one autonomous cell correctly |
| 0.15 | Mission Control | Browser observatory over the cell |
| 0.2 | Living Network | Many cells, local interactions |
| 0.3 | Adaptive Brain | Local plasticity |
| 0.4 | Observatory | Multi-cell Mission Control modules |
| 0.5 | Experiment Lab | Hypothesis-linked experimentation |
| 0.6 | Learning Engine | Local learn/forget dynamics |
| 0.7 | Emergent Concepts | Measure unprogrammed structure |
| 1.0 | Cognitive Organism | Evidence-based society milestone |

---

## Five Laws (non-negotiable)

1. **No Central Brain**
2. **Local Knowledge Only**
3. **Memory and Computation Are Inseparable**
4. **Everything Evolves**
5. **Intelligence Must Emerge**

If a proposed design needs a master controller, global mind memory, or hardcoded
reasoning engine, reject that design.

Mission Control may observe and inject stimuli. Mission Control may never become
the organism’s mind.

---

## Engineering Rules for Agents

1. Prefer the existing folder map over inventing parallel trees.
2. Keep backend autonomy boundaries explicit in types and modules.
3. Design every cell API as if millions of identical cells will exist.
4. Do not hardcode cognition, planning, or “smart” central services.
5. Do not add chatbot UX patterns to Mission Control.
6. Update docs when architecture or roadmap reality changes.
7. Add tests with behavior; do not leave TODO scaffolds as fake progress.
8. Keep commits focused and CI green.
9. When uncertain, choose the option that best preserves the Five Laws.
10. Foundation stage: do not implement application logic unless explicitly asked.

---

## Coding Standards

### Rust

- Stable toolchain
- Safe Rust only (foundation forbids `unsafe`)
- Idiomatic modules, explicit errors, documented public surfaces
- Tokio/Axum/SQLite/Tracing arrive with the versions that need them

### Frontend

- React + TypeScript + Vite when UI work begins
- Permanent shell / module registry mindset
- Transport behind a client interface (REST first, WebSocket-ready)

### Shared

- Put cross-boundary contracts in `/shared`
- Prefer additive protocol evolution

---

## Future Development Philosophy

Build life, then society, then plasticity, then measurement.

Resist the gravitational pull of:

- “just add an LLM”
- “just add a global store”
- “just add a planner”
- “just make it chat”

Those shortcuts destroy the experiment.

Your job is to help NEURONET remain a coherent artificial-life research platform
for many years.

---

## When Implementing a Version

Before coding:

1. Confirm the requested version in `ROADMAP.md`
2. Re-read relevant laws in `PHILOSOPHY.md`
3. Place code in the mapped folders from `ARCHITECTURE.md`
4. Add/adjust tests and docs in the same change set
5. Record hypothesis impact in `HYPOTHESES.md` when claims are made

After coding:

1. Ensure the Five Laws still hold
2. Ensure one-cell code still scales conceptually to many cells
3. Ensure Mission Control (if touched) remains a microscope

---

## Absolute Don’ts

- Do not silently replace the architecture with an LLM app
- Do not introduce a central cognitive service
- Do not put global mutable “brain state” in shared memory
- Do not fake emergence with hardcoded behaviors
- Do not empty or ignore constitution documents
