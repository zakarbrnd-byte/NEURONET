# backend/tests

Integration tests for the NEURONET backend.

## Intended coverage (future)

- Cell lifecycle
- Energy accounting
- Memory persistence
- Message queue behavior
- Observatory API contracts

## Rules

- Prefer deterministic tests
- No network dependency unless testing the API boundary
- Research claims in `HYPOTHESES.md` should eventually map to experiments here or under `docs/experiments/`
