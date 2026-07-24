# CONTRIBUTING.md — Working on NEURONET

Thank you for contributing to Project NEURONET.

This repository is a scientific research platform for artificial life.
Contributions should strengthen the organism substrate, the observatory, or the
research record — not turn NEURONET into a chatbot product.

---

## Before You Write Code

Read:

1. `PHILOSOPHY.md` — constitution / Five Laws
2. `ARCHITECTURE.md` — system structure
3. `ROADMAP.md` — what belongs in the current version
4. `CLAUDE.md` — guidance for human and AI agents
5. `HYPOTHESES.md` — if your change claims scientific effect

If a change violates a Foundational Law, it will be rejected.

---

## Coding Standards

### General

- Prefer clarity over cleverness
- No placeholder logic presented as complete
- No `TODO` comments that smuggle unfinished architecture into main
- No dead code
- Small, reviewable pull requests

### Rust (backend)

- Idiomatic, safe Rust (`unsafe` is forbidden at foundation and discouraged forever)
- Explicit errors over panics in library code
- Document public modules and APIs
- Keep cell autonomy boundaries obvious in type design

### TypeScript / React (frontend)

- Modern React + TypeScript
- Mission Control remains a scientific console
- Prefer stable layouts and module activation over redesign churn
- Shared contracts live in `/shared` when crossed by backend and frontend

### Architecture Rules (enforced socially and in review)

1. No central brain
2. Local knowledge only for cells
3. Memory and compute remain co-located in cells
4. Design for evolution (learn/forget/rewire later)
5. Do not hardcode cognition
6. Mission Control is instrumentation, not mind

---

## Git Workflow

1. Branch from `main`
2. Use descriptive branch names
3. Keep commits focused
4. Open a pull request early when architecture is uncertain
5. Ensure CI passes

Suggested prefixes:

- `feat/` for roadmap capabilities
- `docs/` for documentation
- `research/` for hypotheses/experiments
- `chore/` for tooling

Cloud agent branches may follow environment-required naming conventions.

---

## Commit Style

Use imperative, descriptive subject lines:

```text
Add local energy clamp helpers for Digital Cell
Document H005 metabolic cost experiment plan
Tighten CI foundation path checks
```

Guidelines:

- One logical change per commit when practical
- Explain *why* in the body if the diff is non-obvious
- Reference hypothesis IDs when relevant (`H002`, etc.)

---

## Documentation Requirements

- Public architectural changes update `ARCHITECTURE.md`
- Roadmap-impacting work updates `ROADMAP.md`
- New research claims update `HYPOTHESES.md` and/or `docs/experiments/`
- New folders include a `README.md` stating purpose
- Do not leave empty directories

---

## Testing Requirements

- New backend modules ship with unit tests
- Cross-module behavior ships with integration tests under `backend/tests/`
- API contracts get explicit tests when `backend/api` is implemented
- Research experiments record methods and results; anecdotes are not results
- CI must remain green

At foundation stage, the bar is:

- repository structure intact
- backend scaffold compiles
- lint/format checks pass

---

## Review Criteria

Reviewers will ask:

- Does this preserve the Five Laws?
- Is this the right roadmap version?
- Will this still make sense with millions of cells?
- Did we accidentally invent a central controller?
- Are claims evidenced or merely asserted?

---

## Community Tone

NEURONET is ambitious and patient.

We optimize for decades of coherent research, not viral demos.
Argue with evidence. Change the constitution only with extraordinary cause.
