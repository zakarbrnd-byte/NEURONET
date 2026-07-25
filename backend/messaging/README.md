# backend/messaging

Local communication primitives between cells.

## Intended contents (future)

- Message envelope (identity, sender, timestamp, payload)
- Per-cell inbox / queue
- Future neighbor delivery adapters

## Rules

- No central message bus that understands meaning
- A cell only sees messages it has received
- Transport may evolve; envelope semantics should remain stable
