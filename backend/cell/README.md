# backend/cell

Home of the Digital Cell.

## Intended contents (future)

- Object-safe `Cell` trait (`wake`, `receive`, `process`, `remember`, `sleep`, `tick`)
- `DigitalCell` implementation
- Cell state machine (`Sleeping`, `Awake`, `Processing`)

## Rules

- Every cell is autonomous
- Memory and computation live together inside the cell
- Architecture must support `Vec<Box<dyn Cell>>` without redesign
- Never hardcode cognition, planning, or reasoning
