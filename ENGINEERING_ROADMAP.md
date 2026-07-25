# ENGINEERING_ROADMAP.md

This document tracks **software delivery**.

It does not certify scientific discovery.  
Scientific questions live in [`RESEARCH_ROADMAP.md`](RESEARCH_ROADMAP.md).  
Claims and experiments live in [`HYPOTHESES.md`](HYPOTHESES.md).

Every engineering version must preserve the Five Foundational Laws in
[`PHILOSOPHY.md`](PHILOSOPHY.md).

---

## Version 0.0 — Repository Foundation

### Goal

Create a durable laboratory repository that future versions can extend for years
without restructuring the project’s identity.

### Deliverables

- Constitution and architecture documents
- Separated engineering and research roadmaps
- Hypothesis tracker and changelog
- Backend / frontend / shared / docs directory architecture
- Cargo workspace preparation
- Frontend and shared package preparation
- GitHub Actions foundation workflow
- Folder purpose documentation

### Success Criteria

- Repository communicates scientific purpose without external docs
- Engineering vs research concerns are clearly separated
- Scaffold compiles (`cargo check --workspace`)
- CI validates foundation paths and Rust scaffold quality
- No organism logic, Mission Control UI, or fake AI services are present

**Status:** current

---

## Version 0.1 — Digital Cell Runtime

### Goal

Implement the first autonomous computational organism as a reusable cell runtime.

### Deliverables

- Object-safe `Cell` lifecycle contract
- `DigitalCell` with local energy, memory, messaging, and state
- Local scheduler / runtime host for one cell
- SQLite persistence and restore
- Unit and integration tests for lifecycle, energy, memory, and persistence
- Architecture ready for `Vec<Box<dyn Cell>>` scale assumptions

### Success Criteria

- One Digital Cell runs autonomously
- Lifecycle advances without a central cognitive controller
- State restores after process restart
- No global memory plane is introduced
- Code assumes many identical future cells

---

## Version 0.15 — Mission Control

### Goal

Establish the permanent browser observatory for living cells.

### Deliverables

- Observatory API (REST first)
- Mission Control shell (top bar, permanent sidebar registry, workspace)
- Digital Cell panel, controls, and activity feed
- Shared protocol contracts under `/shared`
- Client interface designed for later WebSocket replacement

### Success Criteria

- Researchers can observe a live cell in the browser
- Experimenter interventions do not become hardcoded cognition
- Disabled future modules exist in the sidebar without requiring redesign
- Mission Control remains instrumentation, not a central brain

---

## Version 0.2 — Living Network

### Goal

Move from a solitary organism to a society of interacting cells.

### Deliverables

- Multi-cell runtime hosting
- Neighbor relationships
- Local inter-cell messaging
- Persistence keyed by many cell identities
- Network-facing Mission Control readiness (module still may be partial)

### Success Criteria

- Multiple cells coexist without a master thinker
- Communication remains local
- Removing one cell does not require rewriting architecture
- No omniscient graph controller is introduced

---

## Version 0.3 — Adaptive Brain

### Goal

Introduce local plasticity: relationships can strengthen, weaken, form, and die.

### Deliverables

- Connection weight / affinity model owned locally
- Rules for create / prune operations
- Instrumentation for topology change over time
- Tests proving adaptation does not require global planning

### Success Criteria

- Topology changes emerge from local rules
- No central planner assigns roles
- Memory/compute ownership remains inside cells
- Adaptation is reversible and inspectable

---

## Version 0.4 — Observatory

### Goal

Expand Mission Control into a multi-cell scientific console.

### Deliverables

- Network Map module
- Node Inspector module
- Metrics surfaces
- Time-oriented observation primitives
- Stable shared telemetry contracts

### Success Criteria

- Researchers can inspect societies without controlling thought
- Modules activate inside the existing Mission Control shell
- Telemetry scale assumptions remain multi-cell native

---

## Version 0.5 — Experiment Lab

### Goal

Make experimentation a first-class engineered capability.

### Deliverables

- Experiment definitions linked to hypothesis IDs
- Controlled stimulus protocols
- Reproducible run records under `docs/experiments/`
- Comparison utilities across trials

### Success Criteria

- An experiment can be named, run, and archived reproducibly
- Results reference hypothesis status updates
- Lab tooling cannot silently become a cognitive engine

---

## Version 0.6 — Learning Engine

### Goal

Implement local learning and forgetting dynamics under metabolic constraints.

### Deliverables

- Reinforcement / decay mechanisms inside cell memory
- Confidence dynamics
- Energy-aware learning costs
- Comparative harnesses for learning regimes

### Success Criteria

- Learning remains local to cells
- Forgetting is supported as a real mechanism
- No global trainer optimizes the society as one model

---

## Version 0.7 — Emergent Concepts

### Goal

Provide measurement systems for higher-order structure arising without ontology
tables.

### Deliverables

- Association and clustering metrics
- Controls for false-positive detection
- Visualization hooks in Mission Control
- Research exports for concept-formation studies

### Success Criteria

- Concept-like structure can be measured without being hardcoded
- Negative controls exist and are used
- Engineering enables research; it does not declare victory

---

## Version 1.0 — Cognitive Organism

### Goal

Reach an engineering milestone where the living society substrate is complete
enough for serious distributed-cognition research.

### Deliverables

- Stable multi-cell organism platform
- Adaptive topology
- Observatory + Experiment Lab maturity
- Documented reproducibility path for major hypotheses

### Success Criteria

- Platform supports end-to-end society experiments without architectural rewrite
- Five Laws still hold in production paths
- Engineering readiness is not confused with proof of consciousness
- Research roadmap phases 1–7 are runnable in principle

---

## Version Discipline

1. Do not skip constraints to chase demos.
2. Prefer additive modules over rewrites.
3. Keep Mission Control shell stable; activate modules over time.
4. Reject designs that require a central brain.
5. Update `CHANGELOG.md` with every released engineering version.
