//! Local activity chronicle for observatory surfaces.
//!
//! Mission Control reads this log. It is instrumentation around a cell, not a
//! central reasoning engine. Events are produced by local lifecycle transitions
//! and experimenter interventions only.

use std::collections::VecDeque;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Default number of recent events retained in memory.
pub const DEFAULT_ACTIVITY_CAPACITY: usize = 500;

/// A single observable lifecycle or intervention event.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ActivityEvent {
    /// Unique event identity.
    pub id: Uuid,
    /// When the event occurred (UTC).
    pub timestamp: DateTime<Utc>,
    /// Cell that produced or received the event.
    pub cell_id: Uuid,
    /// Short category label for Mission Control (e.g. `Awake`, `Sleeping`).
    pub category: String,
    /// Human-readable detail line.
    pub detail: String,
}

impl ActivityEvent {
    /// Construct a new activity event stamped with the current UTC time.
    pub fn new(cell_id: Uuid, category: impl Into<String>, detail: impl Into<String>) -> Self {
        Self {
            id: Uuid::new_v4(),
            timestamp: Utc::now(),
            cell_id,
            category: category.into(),
            detail: detail.into(),
        }
    }
}

/// Ring-buffer of recent activity events, newest retained up to capacity.
#[derive(Debug, Clone)]
pub struct ActivityLog {
    events: VecDeque<ActivityEvent>,
    capacity: usize,
}

impl Default for ActivityLog {
    fn default() -> Self {
        Self::new(DEFAULT_ACTIVITY_CAPACITY)
    }
}

impl ActivityLog {
    /// Create an activity log with a maximum retention capacity.
    pub fn new(capacity: usize) -> Self {
        Self {
            events: VecDeque::new(),
            capacity: capacity.max(1),
        }
    }

    /// Number of retained events.
    pub fn len(&self) -> usize {
        self.events.len()
    }

    /// Whether the log is empty.
    pub fn is_empty(&self) -> bool {
        self.events.is_empty()
    }

    /// Record an event, evicting the oldest when over capacity.
    pub fn record(&mut self, event: ActivityEvent) {
        if self.events.len() >= self.capacity {
            self.events.pop_front();
        }
        self.events.push_back(event);
    }

    /// Return events newest-first.
    pub fn recent(&self) -> Vec<ActivityEvent> {
        self.events.iter().rev().cloned().collect()
    }

    /// Return up to `limit` events newest-first.
    pub fn recent_limited(&self, limit: usize) -> Vec<ActivityEvent> {
        self.events.iter().rev().take(limit).cloned().collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn retains_newest_within_capacity() {
        let mut log = ActivityLog::new(3);
        let cell = Uuid::new_v4();
        for idx in 0..5 {
            log.record(ActivityEvent::new(cell, "Tick", format!("n={idx}")));
        }
        assert_eq!(log.len(), 3);
        let recent = log.recent();
        assert_eq!(recent[0].detail, "n=4");
        assert_eq!(recent[2].detail, "n=2");
    }
}
