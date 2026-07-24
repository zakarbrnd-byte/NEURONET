//! NEURONET backend library scaffold.
//!
//! This crate is intentionally empty of organism logic.
//! Future versions will expose the Digital Cell runtime, persistence, and
//! Mission Control API modules defined under `backend/`.

#![forbid(unsafe_code)]

/// Foundation placeholder confirming the backend library crate compiles.
pub const FOUNDATION_VERSION: &str = env!("CARGO_PKG_VERSION");
