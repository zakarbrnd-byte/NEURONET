//! Autonomous cell abstractions.
//!
//! Do not think in terms of a single hardcoded node. Every living unit is a
//! `Cell`. Millions of identical instances can later be held as
//! `Vec<Box<dyn Cell>>` without changing this architecture.

mod cell;
mod digital_cell;
mod state;

pub use cell::{Cell, CellError};
pub use digital_cell::{DigitalCell, DigitalCellIdentity};
pub use state::CellState;
