# backend/scheduler

Local metabolic clocks for hosted cells.

## Intended contents (future)

- Per-runtime tick intervals
- Cooperative life-loop helpers

## Rules

- This is **not** a master scheduler of the NEURONET society
- Each runtime owns local tempo
- Millions of cells imply many local clocks, never one omniscient ticker
