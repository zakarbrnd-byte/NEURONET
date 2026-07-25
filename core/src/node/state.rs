//! Lifecycle states of an autonomous cell.

use serde::{Deserialize, Serialize};

/// Discrete metabolic state of a cell.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum CellState {
    /// Resting; energy recovers during this phase.
    Sleeping,
    /// Conscious and ready to receive signals.
    Awake,
    /// Actively transforming received signals into experience.
    Processing,
}

impl CellState {
    /// Human-readable label used in tracing output.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Sleeping => "Sleeping",
            Self::Awake => "Awake",
            Self::Processing => "Processing",
        }
    }
}

impl std::fmt::Display for CellState {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.as_str())
    }
}
