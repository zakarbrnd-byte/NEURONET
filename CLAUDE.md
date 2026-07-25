# CLAUDE.md — Guidance for coding agents

NEURONET is early. Keep it beginner-friendly.

## What this project is

NEURONET is not a chatbot and not an LLM wrapper.

It explores whether cognition can emerge from biologically-inspired computational principles.

## Rules

1. Make only one small milestone at a time.
2. The backend owns simulation state. The frontend only observes and sends commands.
3. Never invent neuron state, connections, or propagation in the browser.
4. Animate a connection only from a structured backend propagation event.
5. Do not introduce AI or cognition claims without evidence.
6. Preserve mobile Chrome compatibility and the Render + GitHub Pages deployment path.
7. Prefer simple, readable code.

## Current milestone

**0.5 Network Dynamics Observatory**

Rust neural core with a five-neuron branching/convergence network. React observatory with tick traces.
