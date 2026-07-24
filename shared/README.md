# NEURONET Shared Contracts

This directory holds the observatory API contract shared by Mission Control and
the backend.

- `api-types.ts` — TypeScript shapes for REST (and future WebSocket) payloads
- Mission Control modules are registered in the frontend against these IDs so
  future activations never require sidebar redesign

Keep field names synchronized with `backend/src/api/dto.rs`.
