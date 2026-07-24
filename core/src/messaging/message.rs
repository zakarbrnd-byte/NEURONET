//! Message envelope exchanged between autonomous cells.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// A discrete signal delivered into a cell's local inbox.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Message {
    /// Unique identity of this message.
    pub id: Uuid,
    /// Identity of the sending cell (or self for internal stimuli).
    pub sender: Uuid,
    /// When the message was created (UTC).
    pub timestamp: DateTime<Utc>,
    /// Opaque payload carried by the message.
    pub payload: String,
}

impl Message {
    /// Create a new message from `sender` with the given payload.
    pub fn new(sender: Uuid, payload: impl Into<String>) -> Self {
        Self {
            id: Uuid::new_v4(),
            sender,
            timestamp: Utc::now(),
            payload: payload.into(),
        }
    }

    /// Reconstruct a message from persisted or transported fields.
    pub fn from_parts(
        id: Uuid,
        sender: Uuid,
        timestamp: DateTime<Utc>,
        payload: impl Into<String>,
    ) -> Self {
        Self {
            id,
            sender,
            timestamp,
            payload: payload.into(),
        }
    }
}
