//! NEURONET Mission Control backend library.
//!
//! Separated from the binary so observatory routes can be tested without
//! binding a production listener.

#![warn(missing_docs)]

pub mod api;
pub mod observatory;

pub use observatory::AppState;
