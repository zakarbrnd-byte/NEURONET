# NEURONET Development Guide

**NEURONET — A Digital Nervous System.**

Rules for humans and AI agents contributing to this repository.

Read first:

1. [`../NEURONET.md`](../NEURONET.md) — Constitution
2. [`PROJECT_PHILOSOPHY.md`](PROJECT_PHILOSOPHY.md)
3. [`ARCHITECTURE.md`](ARCHITECTURE.md)
4. [`SCIENTIFIC_MODEL.md`](SCIENTIFIC_MODEL.md)
5. [`../ROADMAP.md`](../ROADMAP.md)

---

## Coding philosophy

- Prefer biological realism when it remains testable.
- Do not add software complexity that does not increase biological plausibility.
- Keep mechanisms observable through Mission Control and structured backend events.
- Prefer small milestones over speculative mega-features.
- Write for long-term research readability, not demo theatrics.

Design gate before writing code:

> Does this make NEURONET behave more like a living nervous system?

If the answer is no, stop.

---

## Rules for future contributors

1. Follow the biological development order. Do not skip stages.
2. Label work accurately: Implemented / Approximation / Future work.
3. Update docs when architecture or scientific claims change.
4. Do not claim cognition, learning, or biological accuracy without evidence.
5. Keep commits focused; keep CI green.
6. Preserve the public deployment path (GitHub Pages + Render) unless explicitly redesigning it.

---

## Rules for AI agents

1. Read `NEURONET.md` before implementing features.
2. Confirm the requested milestone/version before coding.
3. Do not implement memory, learning, plasticity, body, prediction, or cognition unless that milestone is explicitly requested.
4. Do not convert the project into an LLM/chatbot application.
5. Do not invent neural state in the frontend.
6. Do not animate connections without structured backend propagation data.
7. Do not mark hypotheses or cognition as “achieved.”
8. Prefer editing mapped folders (`backend/`, `src/`, `docs/`) over inventing parallel trees.
9. When uncertain, choose the option that best preserves the constitution.

Agent shortcut file: [`../CLAUDE.md`](../CLAUDE.md) (must stay consistent with this guide).

---

## Rules for testing

- Backend: lock neuron and network rules with unit/integration tests.
- Frontend: lock Mission Control contracts (shell regions, sheets, gestures, API usage).
- Prefer tests that fail if the browser invents firings or the UI scrolls away from the observatory contract.
- Do not ship empty scaffolds that only look like progress.
- A biological mechanism is incomplete until it is testable **and** observable.

---

## Rules for backend ownership

Backend owns:

- neurons
- connections
- membrane potentials
- signals
- propagation
- tissue structure
- learning/plasticity state (when those milestones exist)
- simulation ticks and events

All mutations of neural reality go through backend APIs or internal simulation methods.

---

## Rules for frontend ownership

Frontend owns:

- Mission Control layout and accessibility
- visualization and inspection UX
- command issuance (stimulate, step, run/pause, reset)
- transient UI state (selection, open sheet, gesture feedback)

Frontend must never invent:

- neurons
- connections
- signals
- propagation
- membrane potentials
- learning
- simulation state

---

## Definition of Done

A change is done only when all applicable items hold:

1. **Constitutional fit** — passes the living-nervous-system design gate.
2. **Milestone fit** — belongs to the requested roadmap stage.
3. **Ownership fit** — simulation in backend; rendering/observation in frontend.
4. **Observability** — new mechanisms can be inspected in Mission Control or via structured API traces.
5. **Honesty** — docs distinguish Implemented / Approximation / Future work.
6. **Tests** — relevant backend/frontend tests pass.
7. **Build** — TypeScript/Vite and/or Cargo builds succeed as applicable.
8. **No false cognition** — no hardcoded intelligence theater.

---

## Current milestone reminder

**Shipped runtime:** **0.6B Synaptic Plasticity**

Do not implement 0.6C growth/pruning, body, or cognition unless explicitly asked.
