//! In-cell memory store.
//!
//! Designed so future versions can add forgetting, reinforcement, and pruning
//! without relocating ownership away from the cell.

use serde::{Deserialize, Serialize};

use super::MemoryEntry;

/// Local collection of memories owned by one cell.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
pub struct MemoryStore {
    entries: Vec<MemoryEntry>,
}

impl MemoryStore {
    /// Create an empty memory store.
    pub fn new() -> Self {
        Self {
            entries: Vec::new(),
        }
    }

    /// Restore a store from previously persisted entries.
    pub fn from_entries(entries: Vec<MemoryEntry>) -> Self {
        Self { entries }
    }

    /// Number of retained memories.
    pub fn len(&self) -> usize {
        self.entries.len()
    }

    /// Whether the store holds no memories.
    pub fn is_empty(&self) -> bool {
        self.entries.is_empty()
    }

    /// Borrow all memories in insertion order.
    pub fn entries(&self) -> &[MemoryEntry] {
        &self.entries
    }

    /// Remember a new entry.
    pub fn remember(&mut self, entry: MemoryEntry) {
        self.entries.push(entry);
    }

    /// Forget a memory by identity. Returns `true` if something was removed.
    ///
    /// Present so evolutionary forgetting can be activated without redesign.
    pub fn forget(&mut self, id: uuid::Uuid) -> bool {
        let before = self.entries.len();
        self.entries.retain(|entry| entry.id != id);
        self.entries.len() != before
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn remember_and_forget() {
        let mut store = MemoryStore::new();
        let entry = MemoryEntry::new("signal", 0.8);
        let id = entry.id;
        store.remember(entry);
        assert_eq!(store.len(), 1);
        assert!(store.forget(id));
        assert!(store.is_empty());
    }
}
