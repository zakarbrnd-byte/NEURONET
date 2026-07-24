//! Object-safe `Cell` contract for all autonomous computational organisms.
//!
//! Future cell types implement this trait. The runtime never assumes a concrete
//! type beyond what this interface exposes, so `Vec<Box<dyn Cell>>` remains valid.

use thiserror::Error;

/// Errors that may occur during a cell lifecycle transition.
#[derive(Debug, Error)]
pub enum CellError {
    /// The cell lacks sufficient energy to complete an action.
    #[error("insufficient energy for {action}")]
    InsufficientEnergy {
        /// Lifecycle action that could not be completed.
        action: &'static str,
    },

    /// The cell is in an unexpected state for the requested transition.
    #[error("invalid state transition: {from} -> {to}")]
    InvalidTransition {
        /// Current state.
        from: String,
        /// Attempted next state.
        to: String,
    },

    /// Persistence or serialization failure surfaced through the cell.
    #[error("cell persistence failure: {0}")]
    Persistence(String),

    /// Unexpected internal failure.
    #[error("cell internal error: {0}")]
    Internal(String),
}

/// Autonomous computational cell.
///
/// Lifecycle contract (invoked once per local tick):
///
/// `wake → receive → process → remember → sleep → tick`
///
/// Implementations own their memory, energy, and inbox. They never consult a
/// global controller.
pub trait Cell: Send {
    /// Transition from sleep into awareness and pay the wake energy cost.
    fn wake(&mut self) -> Result<(), CellError>;

    /// Drain the local inbox. Returns how many messages were received.
    fn receive(&mut self) -> Result<usize, CellError>;

    /// Transform received signals into internal experience.
    fn process(&mut self) -> Result<(), CellError>;

    /// Commit formed experiences into local memory.
    fn remember(&mut self) -> Result<(), CellError>;

    /// Return to rest and recover energy.
    fn sleep(&mut self) -> Result<(), CellError>;

    /// Advance the local tick counter after a completed lifecycle cycle.
    fn tick(&mut self) -> Result<(), CellError>;

    /// Run one full autonomous lifecycle cycle.
    fn advance(&mut self) -> Result<(), CellError> {
        self.wake()?;
        self.receive()?;
        self.process()?;
        self.remember()?;
        self.sleep()?;
        self.tick()?;
        Ok(())
    }
}
