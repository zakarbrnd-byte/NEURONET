//! `DigitalCell` — the first autonomous computational organism of NEURONET.
//!
//! One running instance is sufficient for v0.1, but nothing here is hardcoded
//! for singularity. Any number of identical cells may be spawned later.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use tracing::{info, warn};
use uuid::Uuid;

use crate::energy::Energy;
use crate::memory::{MemoryEntry, MemoryStore};
use crate::messaging::{Message, MessageQueue};

use super::cell::{Cell, CellError};
use super::state::CellState;

/// Snapshot of identity and metabolic state suitable for persistence.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DigitalCellIdentity {
    /// Stable unique identity.
    pub id: Uuid,
    /// Moment of first creation.
    pub created_at: DateTime<Utc>,
    /// Current energy level.
    pub energy: u8,
    /// Completed lifecycle ticks.
    pub tick_count: u64,
    /// Last known metabolic state.
    pub state: CellState,
}

/// Working buffer for experiences formed during `process`, committed in `remember`.
#[derive(Debug, Clone, Default)]
struct ExperienceBuffer {
    pending: Vec<MemoryEntry>,
}

impl ExperienceBuffer {
    fn clear(&mut self) {
        self.pending.clear();
    }

    fn push(&mut self, entry: MemoryEntry) {
        self.pending.push(entry);
    }

    fn drain(&mut self) -> Vec<MemoryEntry> {
        std::mem::take(&mut self.pending)
    }

    fn len(&self) -> usize {
        self.pending.len()
    }
}

/// The v0.1 digital cell: compute and memory co-located in one organism.
#[derive(Debug)]
pub struct DigitalCell {
    id: Uuid,
    created_at: DateTime<Utc>,
    energy: Energy,
    state: CellState,
    memory: MemoryStore,
    inbox: MessageQueue,
    tick_count: u64,
    /// Messages drained during the current cycle's `receive`.
    received: Vec<Message>,
    /// Experiences awaiting commitment during `remember`.
    experience: ExperienceBuffer,
}

impl DigitalCell {
    /// Birth a new autonomous digital cell with full energy.
    pub fn birth() -> Self {
        let id = Uuid::new_v4();
        let created_at = Utc::now();
        info!(
            cell_id = %id,
            created_at = %created_at,
            "Digital cell born"
        );
        Self {
            id,
            created_at,
            energy: Energy::new(),
            state: CellState::Sleeping,
            memory: MemoryStore::new(),
            inbox: MessageQueue::new(),
            tick_count: 0,
            received: Vec::new(),
            experience: ExperienceBuffer::default(),
        }
    }

    /// Restore a cell from persisted identity and memory.
    pub fn restore(identity: DigitalCellIdentity, memory: MemoryStore) -> Self {
        info!(
            cell_id = %identity.id,
            energy = identity.energy,
            tick_count = identity.tick_count,
            memories = memory.len(),
            "Digital cell restored from persistence"
        );
        Self {
            id: identity.id,
            created_at: identity.created_at,
            energy: Energy::with_level(identity.energy),
            state: CellState::Sleeping,
            memory,
            inbox: MessageQueue::new(),
            tick_count: identity.tick_count,
            received: Vec::new(),
            experience: ExperienceBuffer::default(),
        }
    }

    /// Stable unique identity of this cell.
    pub fn id(&self) -> Uuid {
        self.id
    }

    /// Creation timestamp.
    pub fn created_at(&self) -> DateTime<Utc> {
        self.created_at
    }

    /// Current energy level.
    pub fn energy(&self) -> u8 {
        self.energy.level()
    }

    /// Current metabolic state.
    pub fn state(&self) -> CellState {
        self.state
    }

    /// Completed lifecycle ticks.
    pub fn tick_count(&self) -> u64 {
        self.tick_count
    }

    /// Borrow local memory.
    pub fn memory(&self) -> &MemoryStore {
        &self.memory
    }

    /// Borrow the local inbox.
    pub fn inbox(&self) -> &MessageQueue {
        &self.inbox
    }

    /// Deliver a message into this cell's local inbox.
    ///
    /// In a multi-cell society this is how neighbors speak. In v0.1 it also
    /// supports tests and controlled stimuli without a central bus.
    pub fn deliver(&mut self, message: Message) {
        self.inbox.enqueue(message);
    }

    /// Capture a persistence-friendly identity snapshot.
    pub fn identity_snapshot(&self) -> DigitalCellIdentity {
        DigitalCellIdentity {
            id: self.id,
            created_at: self.created_at,
            energy: self.energy.level(),
            tick_count: self.tick_count,
            state: self.state,
        }
    }
}

impl Cell for DigitalCell {
    fn wake(&mut self) -> Result<(), CellError> {
        // Energy costs saturate at zero; the organism continues under metabolic stress.
        self.energy.on_wake();
        self.state = CellState::Awake;
        self.received.clear();
        self.experience.clear();

        if self.energy.is_depleted() {
            warn!(cell_id = %self.id, "Awoke with depleted energy");
        }

        info!(tick = self.tick_count + 1, "Tick {}", self.tick_count + 1);
        info!(state = %self.state, "Awake");
        info!(energy = self.energy.level(), "Energy {}", self.energy.level());
        Ok(())
    }

    fn receive(&mut self) -> Result<usize, CellError> {
        if self.state != CellState::Awake {
            return Err(CellError::InvalidTransition {
                from: self.state.to_string(),
                to: "receive".to_string(),
            });
        }

        self.received = self.inbox.drain();
        let count = self.received.len();
        info!(received = count, "Received {} Messages", count);
        Ok(count)
    }

    fn process(&mut self) -> Result<(), CellError> {
        if self.state != CellState::Awake {
            return Err(CellError::InvalidTransition {
                from: self.state.to_string(),
                to: CellState::Processing.to_string(),
            });
        }

        self.state = CellState::Processing;
        self.energy.on_process();

        // Transform each received message into a candidate memory.
        for message in &self.received {
            let payload = format!(
                "absorbed message {} from {}: {}",
                message.id, message.sender, message.payload
            );
            self.experience
                .push(MemoryEntry::new(payload, 0.85));
        }

        // Every tick produces an intrinsic somatic memory so a solitary cell
        // still forms experience without a central stimulus generator.
        let somatic = format!(
            "tick={} energy={} received={} state={}",
            self.tick_count + 1,
            self.energy.level(),
            self.received.len(),
            self.state
        );
        self.experience.push(MemoryEntry::new(somatic, 0.6));

        info!(
            experiences = self.experience.len(),
            energy = self.energy.level(),
            "Processing"
        );
        Ok(())
    }

    fn remember(&mut self) -> Result<(), CellError> {
        if self.state != CellState::Processing {
            return Err(CellError::InvalidTransition {
                from: self.state.to_string(),
                to: "remember".to_string(),
            });
        }

        self.energy.on_remember();

        let formed = self.experience.drain();
        let count = formed.len();
        for entry in formed {
            self.memory.remember(entry);
        }

        info!(
            stored = count,
            total_memories = self.memory.len(),
            energy = self.energy.level(),
            "Stored Memory"
        );
        Ok(())
    }

    fn sleep(&mut self) -> Result<(), CellError> {
        self.energy.on_sleep();
        self.state = CellState::Sleeping;
        self.received.clear();

        info!(energy = self.energy.level(), "Sleeping");
        Ok(())
    }

    fn tick(&mut self) -> Result<(), CellError> {
        self.tick_count = self.tick_count.saturating_add(1);
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::node::Cell;

    #[test]
    fn birth_creates_autonomous_cell() {
        let cell = DigitalCell::birth();
        assert_eq!(cell.energy(), 100);
        assert_eq!(cell.state(), CellState::Sleeping);
        assert_eq!(cell.tick_count(), 0);
        assert!(cell.memory().is_empty());
        assert!(cell.inbox().is_empty());
    }

    #[test]
    fn lifecycle_advances_and_stores_memory() {
        let mut cell = DigitalCell::birth();
        cell.deliver(Message::new(cell.id(), "hello"));
        cell.deliver(Message::new(Uuid::new_v4(), "neighbor-signal"));

        cell.advance().expect("lifecycle");

        assert_eq!(cell.tick_count(), 1);
        assert_eq!(cell.state(), CellState::Sleeping);
        // Net energy: -1 wake -2 process -1 remember +2 sleep = -2
        assert_eq!(cell.energy(), 98);
        // Two message memories + one somatic memory
        assert_eq!(cell.memory().len(), 3);
        assert!(cell.inbox().is_empty());
    }

    #[test]
    fn restore_preserves_identity_energy_and_memory() {
        let mut cell = DigitalCell::birth();
        cell.advance().expect("tick");
        let identity = cell.identity_snapshot();
        let memory = cell.memory().clone();

        let restored = DigitalCell::restore(identity.clone(), memory.clone());
        assert_eq!(restored.id(), identity.id);
        assert_eq!(restored.energy(), identity.energy);
        assert_eq!(restored.tick_count(), identity.tick_count);
        assert_eq!(restored.memory().len(), memory.len());
        assert_eq!(restored.state(), CellState::Sleeping);
    }
}
