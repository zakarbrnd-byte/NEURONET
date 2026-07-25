# services

Transport and API clients.

## Rules

- UI panels depend on an abstract client interface
- REST polling is acceptable for early versions
- WebSocket transport should replace polling later with minimal UI change
- Services observe and intervene; they do not embody cognition
