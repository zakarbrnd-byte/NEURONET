# CLAUDE.md — Guidance for coding agents

NEURONET is early. Keep it beginner-friendly.

## What this project is

NEURONET is not a chatbot and not an LLM wrapper.

It explores whether cognition can emerge from biologically-inspired computational principles.

## Rules

1. Make only one small milestone at a time.
2. Introduce one biological principle per milestone when advancing the model.
3. The backend owns simulation state. The frontend only observes and sends commands.
4. Do not invent neuron or connection state in the browser.
5. Do not introduce AI or cognition claims without evidence.
6. Explain major code changes clearly.
7. Preserve mobile Chrome compatibility and GitHub Pages static deployment.
8. Prefer simple, readable code over clever abstractions.

## Current milestone

**0.4 Backend Neural Core and Network View**

Rust + Axum neural core. React observatory. No database. No WebSockets.
