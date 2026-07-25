//! A single memory fragment retained by a cell.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// One remembered experience belonging exclusively to a cell.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct MemoryEntry {
    /// Unique identity of this memory fragment.
    pub id: Uuid,
    /// When the memory was formed (UTC).
    pub timestamp: DateTime<Utc>,
    /// Opaque payload describing what was remembered.
    pub payload: String,
    /// Confidence in this memory, in the closed range `0.0..=1.0`.
    pub confidence: f64,
}

impl MemoryEntry {
    /// Form a new memory with the given payload and confidence.
    ///
    /// Confidence is clamped into `0.0..=1.0`.
    pub fn new(payload: impl Into<String>, confidence: f64) -> Self {
        Self {
            id: Uuid::new_v4(),
            timestamp: Utc::now(),
            payload: payload.into(),
            confidence: confidence.clamp(0.0, 1.0),
        }
    }

    /// Reconstruct a memory from persisted fields.
    pub fn from_parts(
        id: Uuid,
        timestamp: DateTime<Utc>,
        payload: impl Into<String>,
        confidence: f64,
    ) -> Self {
        Self {
            id,
            timestamp,
            payload: payload.into(),
            confidence: confidence.clamp(0.0, 1.0),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn confidence_is_clamped() {
        let high = MemoryEntry::new("over", 2.5);
        let low = MemoryEntry::new("under", -1.0);
        assert_eq!(high.confidence, 1.0);
        assert_eq!(low.confidence, 0.0);
    }
}
