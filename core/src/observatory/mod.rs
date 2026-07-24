//! Observatory snapshots for Mission Control.
//!
//! These types expose local cell state to external instrumentation. They do not
//! grant global knowledge to any cell — Mission Control is a microscope, not a
//! brain.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::node::CellState;

/// Point-in-time status of one digital cell for the observatory API.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CellStatus {
    /// Stable cell identity.
    pub id: Uuid,
    /// Completed lifecycle ticks.
    pub tick: u64,
    /// Current metabolic state label.
    pub state: CellState,
    /// Current energy level (0..=100).
    pub energy: u8,
    /// Number of memories retained locally.
    pub memory_count: usize,
    /// Messages waiting in the local inbox.
    pub message_queue: usize,
    /// Cell creation timestamp (UTC).
    pub created_at: DateTime<Utc>,
    /// Seconds since the local runtime host started.
    pub uptime_seconds: u64,
}

/// Experimenter control commands accepted by the observatory.
///
/// These are external metabolic interventions for research — not cognitive
/// instructions and not a central planner.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ControlCommand {
    /// Force the wake transition.
    Wake,
    /// Force the sleep transition.
    Sleep,
    /// Advance one full lifecycle tick.
    Tick,
}

/// Request body for injecting a sensory message into a cell.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct MessageInjection {
    /// Opaque payload delivered into the cell inbox.
    pub payload: String,
}
