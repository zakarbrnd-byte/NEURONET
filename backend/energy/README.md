# backend/energy

Metabolic energy model for Digital Cells.

## Intended contents (future)

- Energy budget type
- Lifecycle costs and recovery
- Clamping rules (`0..=100` in early versions)

## Rules

- Energy is local to each cell
- No shared energy pool that implies central metabolism
- Adaptive metabolism may evolve without relocating ownership
