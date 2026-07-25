# CLAUDE.md — Guidance for coding agents

NEURONET is an experimental **Artificial Nervous System** project.

Read [`docs/PROJECT_PHILOSOPHY.md`](docs/PROJECT_PHILOSOPHY.md) before implementing features.

## What this project is

NEURONET is not a chatbot, not an LLM, and not a text prediction system.

Its purpose is to construct a digital nervous system that develops through biological principles and to observe whether cognition can eventually emerge.

We are not programming intelligence.  
We are cultivating the conditions from which intelligence may emerge.

## Rules

1. Make only one small milestone at a time.
2. The backend owns simulation state. The frontend only observes and sends commands.
3. Never invent neuron state, connections, or propagation in the browser.
4. Animate a connection only from a structured backend propagation event.
5. Do not introduce AI or cognition claims without evidence.
6. Preserve mobile Chrome compatibility and the Render + GitHub Pages deployment path.
7. Prefer simple, readable code.
8. Every new feature should become more biologically realistic — never more computer-like.
9. Before implementing, answer: “Does this make NEURONET behave more like a living nervous system?” If no, do not implement it.
10. Do not implement memory, learning, body, or cognition ahead of their roadmap milestones.

## Current milestone

**Shipped:** 0.5 Network Dynamics + Mission Control  

**Current development target: 0.6 Artificial Neural Tissue**

Physical organization, neuron positions, regions, layers, cell types, developmental identity parameters, excitatory and inhibitory neurons.

Do not implement 0.6 application logic unless the user explicitly requests that engineering work.

## Canonical docs

- [`docs/PROJECT_PHILOSOPHY.md`](docs/PROJECT_PHILOSOPHY.md)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`ROADMAP.md`](ROADMAP.md)
- [`README.md`](README.md)
