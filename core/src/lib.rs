//! # NEURONET Core
//!
//! Reusable **Cell Runtime** for Project NEURONET — an experimental Artificial
//! Life Operating System (ALOS).
//!
//! This crate defines the autonomous computational organism — not a chatbot,
//! not an LLM, and not a conventional neural network. Every future node is
//! another instance of the same runtime. There is never a central brain.
//!
//! ## Philosophy
//!
//! - No central controller, master scheduler, or shared memory
//! - Local knowledge only (self, local memory, received messages, neighbors)
//! - Memory and computation live together inside each cell
//! - Everything must be able to evolve: learn, forget, strengthen, prune
//! - Intelligence must emerge; never hardcode cognition
//!
//! ## Modules
//!
//! - [`node`] — `Cell` trait and `DigitalCell` implementation
//! - [`memory`] — local memory entries owned by a cell
//! - [`energy`] — metabolic energy budget
//! - [`messaging`] — local message envelope and queue
//! - [`scheduler`] — local tick clock for a runtime instance
//! - [`runtime`] — persistence and orchestration of cell instances
//! - [`activity`] — observatory event chronicle
//! - [`observatory`] — status and control surfaces for Mission Control

#![deny(missing_docs)]
#![warn(clippy::all)]

pub mod activity;
pub mod energy;
pub mod memory;
pub mod messaging;
pub mod node;
pub mod observatory;
pub mod runtime;
pub mod scheduler;

pub use activity::{ActivityEvent, ActivityLog};
pub use energy::Energy;
pub use memory::{MemoryEntry, MemoryStore};
pub use messaging::{Message, MessageQueue};
pub use node::{Cell, CellError, CellState, DigitalCell, DigitalCellIdentity};
pub use observatory::{CellStatus, ControlCommand, MessageInjection};
pub use runtime::{CellPersistence, CellRuntime, RuntimeError};
pub use scheduler::LocalScheduler;
