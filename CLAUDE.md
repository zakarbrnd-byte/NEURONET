# CLAUDE.md — Guidance for AI Coding Agents

This file is mandatory reading for AI coding agents working in NEURONET.

Never violate project philosophy to ship a shortcut.

---

## Vision

**NEURONET** is an experimental **Artificial Life Operating System (ALOS)**.

Mission: research whether cognition can emerge from a decentralized society of
autonomous computational cells inspired by biology.

NEURONET is not a chatbot, LLM wrapper, conventional neural-network product, or
assistant app.

It is a scientific research laboratory in repository form.

---

## Current Version

**0.0.0 — Repository Foundation**

Exists:

- constitution and dual roadmaps
- hypothesis tracker
- permanent directory architecture
- Cargo / frontend / shared scaffolding
- CI foundation checks

Does not exist yet:

- Digital Cell implementation
- Mission Control UI implementation
- learning systems
- multi-cell networks

Do not invent those unless the user explicitly requests the corresponding
engineering version.

---

## Architecture

```text
backend/     organism host + observatory API (future logic)
frontend/    Mission Control observatory UI (future logic)
shared/      types, protocols, constants
docs/        architecture, experiments, hypotheses, research artifacts
```

Canonical documents:

- `PHILOSOPHY.md` — constitution / Five Laws
- `ARCHITECTURE.md` — structure
- `ENGINEERING_ROADMAP.md` — software versions
- `RESEARCH_ROADMAP.md` — scientific phases
- `HYPOTHESES.md` — claims tracker
- `CONTRIBUTING.md` — workflow
- `CHANGELOG.md` — released versions

---

## Roadmaps

### Engineering (software)

0.0 Foundation → 0.1 Digital Cell Runtime → 0.15 Mission Control → 0.2 Living
Network → 0.3 Adaptive Brain → 0.4 Observatory → 0.5 Experiment Lab → 0.6
Learning Engine → 0.7 Emergent Concepts → 1.0 Cognitive Organism

### Research (questions)

1. Can a Digital Cell exist?  
2. Can multiple cells communicate?  
3. Can distributed memory emerge?  
4. Can cells reorganize themselves?  
5. Can concept formation emerge?  
6. Can prediction emerge?  
7. Can distributed cognition emerge?

Future speculative horizons (not promises): open-ended evolution, curiosity,
consciousness.

Never collapse engineering completion into scientific confirmation.

---

## Five Laws

1. **No Central Brain**
2. **Local Knowledge Only**
3. **Memory and Computation Are Inseparable**
4. **Everything Evolves**
5. **Intelligence Must Emerge**

If a design needs a master controller, global mind memory, or hardcoded
reasoning engine, reject that design.

Mission Control may observe and inject stimuli.  
Mission Control may never become the organism’s mind.

---

## Engineering Principles

1. Prefer the existing folder map over inventing parallel trees.
2. Keep autonomy boundaries explicit in types and modules.
3. Design every cell API as if millions of identical cells will exist.
4. Do not hardcode cognition, planning, or “smart” central services.
5. Do not add chatbot UX patterns to Mission Control.
6. Update docs when architecture or roadmap reality changes.
7. Add tests with behavior; do not leave fake progress scaffolds.
8. Keep commits focused and CI green.
9. When uncertain, choose the option that best preserves the Five Laws.
10. At foundation stage, do not implement application logic unless explicitly asked.

---

## Coding Conventions

### Rust

- Stable toolchain
- Safe Rust only at foundation (`#![forbid(unsafe_code)]` in scaffold)
- Explicit errors, documented public surfaces
- Introduce Tokio/Axum/SQLite/Tracing only with versions that need them

### Frontend

- React + TypeScript + Vite when UI work begins
- Permanent shell / module registry mindset
- Transport behind a client interface (REST first, WebSocket-ready)

### Shared

- Cross-boundary contracts in `/shared`
- Prefer additive protocol evolution

### Docs

- Engineering changes → `ENGINEERING_ROADMAP.md` + `CHANGELOG.md`
- Scientific claims → `HYPOTHESES.md` / `RESEARCH_ROADMAP.md`
- Folder purpose READMEs required for new directories

---

## Absolute Don’ts

- Do not replace the architecture with an LLM app
- Do not introduce a central cognitive service
- Do not create global mutable “brain state”
- Do not fake emergence with hardcoded behaviors
- Do not ignore or rewrite the constitution casually
- Do not mark hypotheses `supported` without evidence
- Do not implement Digital Cells or Mission Control during foundation-only tasks

---

## Operating Procedure for Agents

Before coding:

1. Confirm requested version/phase
2. Re-read relevant laws
3. Place code in mapped folders
4. Plan tests and docs with the change

After coding:

1. Verify Five Laws still hold
2. Verify one-cell designs still scale conceptually to many cells
3. Verify Mission Control (if touched) remains a microscope
4. Update changelog/roadmaps/hypotheses as appropriate

Your job is to help NEURONET remain a coherent artificial-life research platform
for many years.
