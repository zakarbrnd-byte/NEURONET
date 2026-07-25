# CONTRIBUTING.md

Thank you for contributing to Project NEURONET.

This repository is a university-lab-style scientific platform for artificial life.
Contributions should strengthen the organism substrate, the observatory, or the
research record.

---

## Before You Start

Read:

1. [`PHILOSOPHY.md`](PHILOSOPHY.md) — constitution
2. [`ARCHITECTURE.md`](ARCHITECTURE.md) — system structure
3. [`ENGINEERING_ROADMAP.md`](ENGINEERING_ROADMAP.md) — software versions
4. [`RESEARCH_ROADMAP.md`](RESEARCH_ROADMAP.md) — scientific phases
5. [`HYPOTHESES.md`](HYPOTHESES.md) — if making scientific claims
6. [`CLAUDE.md`](CLAUDE.md) — required for AI coding agents

Changes that violate the Five Foundational Laws will be rejected.

---

## Coding Standards

### General

- Prefer clarity over cleverness
- No fake completeness (placeholder logic presented as done)
- No TODO comments that smuggle unfinished architecture into mainline
- No dead code
- Small, reviewable pull requests

### Rust (backend)

- Idiomatic safe Rust
- `unsafe` is forbidden at foundation stage and strongly discouraged forever
- Explicit errors over panics in library code
- Document public modules and APIs
- Keep cell autonomy boundaries obvious in types

### TypeScript / React (frontend)

- Modern React + TypeScript when UI work begins
- Mission Control remains a scientific console
- Prefer stable layouts and module activation over redesign churn
- Cross-boundary contracts belong in `/shared`

---

## Architecture Rules

1. No central brain
2. Local knowledge only for cells
3. Memory and compute remain co-located in cells
4. Design for evolution (learn / forget / rewire later)
5. Do not hardcode cognition
6. Mission Control is instrumentation, not mind
7. Do not confuse engineering milestones with scientific confirmation

---

## Git Workflow

1. Branch from `main`
2. Use descriptive branch names
3. Keep commits focused
4. Open a pull request when architecture is uncertain
5. Keep CI green

Suggested prefixes:

- `feat/` roadmap capabilities
- `docs/` documentation
- `research/` hypotheses and experiments
- `chore/` tooling

Cloud agents may follow environment-required branch naming.

---

## Commit Style

Use imperative subjects:

```text
Add Digital Cell energy clamp helpers
Document H009 observatory perturbation protocol
Tighten foundation CI path checks
```

Include hypothesis IDs when relevant. Explain why in the commit body when the
diff is non-obvious.

---

## Documentation Standards

- Architectural changes update `ARCHITECTURE.md` and/or `docs/architecture/`
- Software version changes update `ENGINEERING_ROADMAP.md` and `CHANGELOG.md`
- Scientific phase changes update `RESEARCH_ROADMAP.md`
- New claims update `HYPOTHESES.md` and optionally `docs/hypotheses/`
- New folders include a README stating purpose
- Do not leave empty directories

Distinguish:

- **Engineering status** (what software exists)
- **Research status** (what questions are answered)

---

## Testing Standards

- New backend modules ship with unit tests
- Cross-module behavior ships with integration tests under `backend/tests/`
- API contracts receive explicit tests when implemented
- Experiments record methods and results; anecdotes are not results
- CI must remain green

Foundation-stage bar:

- structure intact
- backend scaffold compiles
- clippy/format checks pass

---

## Review Process

Reviewers evaluate:

1. Law compatibility
2. Correct roadmap lane (engineering vs research)
3. Millions-of-cells readiness where cell APIs are touched
4. Absence of accidental central controllers
5. Evidence quality for any scientific claim
6. Documentation completeness

A dazzling demo that violates locality is not mergeable.

---

## Community Tone

NEURONET is ambitious and patient.

Argue with evidence.  
Prefer durable architecture over viral screenshots.  
Change the constitution only with extraordinary cause.
