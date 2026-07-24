//! Cell runtime: local persistence, orchestration, and observatory access.
//!
//! A runtime is a local organism host. It does not command the NEURONET society
//! and is not a central brain. Mission Control attaches here as a microscope.

mod persistence;

pub use persistence::{CellPersistence, PersistenceError, PersistedCell};

use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Instant;

use chrono::Utc;
use thiserror::Error;
use tracing::{error, info};
use uuid::Uuid;

use crate::activity::{ActivityEvent, ActivityLog};
use crate::messaging::Message;
use crate::node::{Cell, DigitalCell};
use crate::observatory::{CellStatus, ControlCommand};
use crate::scheduler::LocalScheduler;

/// Errors raised by the local cell runtime.
#[derive(Debug, Error)]
pub enum RuntimeError {
    /// Persistence layer failure.
    #[error(transparent)]
    Persistence(#[from] PersistenceError),

    /// Cell lifecycle failure.
    #[error(transparent)]
    Cell(#[from] crate::node::CellError),

    /// Requested cell was not found in this local host.
    #[error("cell not found: {0}")]
    CellNotFound(Uuid),

    /// Runtime has no cells to operate on.
    #[error("runtime hosts no cells")]
    EmptyRuntime,
}

/// Hosts one or more autonomous cells with local persistence and a local clock.
///
/// Ready for `Vec<Box<dyn Cell>>` growth: today it manages digital cells;
/// tomorrow any `Cell` implementor can join without redesigning Mission Control.
#[derive(Debug)]
pub struct CellRuntime {
    cells: Vec<DigitalCell>,
    persistence: CellPersistence,
    scheduler: LocalScheduler,
    db_path: PathBuf,
    activity: ActivityLog,
    started_at: Instant,
    /// Wall-clock birth of this runtime process (for uptime reporting).
    process_started_at: chrono::DateTime<Utc>,
}

impl CellRuntime {
    /// Open (or create) a runtime backed by the SQLite database at `db_path`.
    ///
    /// If a cell was previously persisted, it is restored. Otherwise a new
    /// digital cell is born and immediately persisted.
    pub fn open(db_path: impl AsRef<Path>) -> Result<Self, RuntimeError> {
        let db_path = db_path.as_ref().to_path_buf();
        let persistence = CellPersistence::open(&db_path)?;
        let started_at = Instant::now();
        let process_started_at = Utc::now();

        let (cells, birthed) = match persistence.load_primary()? {
            Some(persisted) => {
                info!(
                    cell_id = %persisted.identity.id,
                    "Restoring digital cell into runtime"
                );
                (
                    vec![DigitalCell::restore(persisted.identity, persisted.memory)],
                    false,
                )
            }
            None => {
                let cell = DigitalCell::birth();
                info!(cell_id = %cell.id(), "No persisted cell found; birthing new organism");
                (vec![cell], true)
            }
        };

        let mut runtime = Self {
            cells,
            persistence,
            scheduler: LocalScheduler::default(),
            db_path,
            activity: ActivityLog::default(),
            started_at,
            process_started_at,
        };

        if birthed {
            if let Some(cell) = runtime.cells.first() {
                runtime.record(
                    cell.id(),
                    "Birth",
                    "Digital cell born into local runtime host",
                );
            }
            runtime.persist_all()?;
        } else if let Some(cell) = runtime.cells.first() {
            runtime.record(
                cell.id(),
                "Restored",
                format!(
                    "Digital cell restored (tick={}, energy={}, memories={})",
                    cell.tick_count(),
                    cell.energy(),
                    cell.memory().len()
                ),
            );
        }

        Ok(runtime)
    }

    /// Path to the SQLite database used by this runtime.
    pub fn db_path(&self) -> &Path {
        &self.db_path
    }

    /// Number of cells currently hosted.
    pub fn cell_count(&self) -> usize {
        self.cells.len()
    }

    /// Borrow the primary (first) cell.
    pub fn primary(&self) -> Option<&DigitalCell> {
        self.cells.first()
    }

    /// Borrow the primary cell mutably.
    pub fn primary_mut(&mut self) -> Option<&mut DigitalCell> {
        self.cells.first_mut()
    }

    /// Seconds since this runtime process started.
    pub fn uptime_seconds(&self) -> u64 {
        self.started_at.elapsed().as_secs()
    }

    /// Process start timestamp (UTC).
    pub fn process_started_at(&self) -> chrono::DateTime<Utc> {
        self.process_started_at
    }

    /// Observatory status for the primary cell.
    pub fn primary_status(&self) -> Result<CellStatus, RuntimeError> {
        let cell = self.primary().ok_or(RuntimeError::EmptyRuntime)?;
        Ok(CellStatus {
            id: cell.id(),
            tick: cell.tick_count(),
            state: cell.state(),
            energy: cell.energy(),
            memory_count: cell.memory().len(),
            message_queue: cell.inbox().len(),
            created_at: cell.created_at(),
            uptime_seconds: self.uptime_seconds(),
        })
    }

    /// Recent activity events, newest first.
    pub fn recent_activity(&self) -> Vec<ActivityEvent> {
        self.activity.recent()
    }

    /// Recent activity events limited to `limit`, newest first.
    pub fn recent_activity_limited(&self, limit: usize) -> Vec<ActivityEvent> {
        self.activity.recent_limited(limit)
    }

    /// Inject a sensory message into the primary cell's local inbox.
    pub fn inject_message(&mut self, payload: impl Into<String>) -> Result<Uuid, RuntimeError> {
        let payload = payload.into();
        let (cell_id, message_id, queue_len) = {
            let cell = self.primary_mut().ok_or(RuntimeError::EmptyRuntime)?;
            let sender = cell.id();
            let message = Message::new(sender, payload.clone());
            let message_id = message.id;
            cell.deliver(message);
            (cell.id(), message_id, cell.inbox().len())
        };
        self.record(
            cell_id,
            "Message Injected",
            format!("payload={payload:?} queue={queue_len}"),
        );
        Ok(message_id)
    }

    /// Apply an experimenter control command to the primary cell.
    pub fn control(&mut self, command: ControlCommand) -> Result<(), RuntimeError> {
        match command {
            ControlCommand::Wake => self.control_wake(),
            ControlCommand::Sleep => self.control_sleep(),
            ControlCommand::Tick => self.advance_all(),
        }
    }

    /// Persist every hosted cell.
    pub fn persist_all(&self) -> Result<(), RuntimeError> {
        for cell in &self.cells {
            self.persistence.save_cell(cell)?;
        }
        Ok(())
    }

    /// Advance every hosted cell through one full lifecycle, then persist.
    pub fn advance_all(&mut self) -> Result<(), RuntimeError> {
        let cell_ids: Vec<Uuid> = self.cells.iter().map(DigitalCell::id).collect();
        for cell_id in cell_ids {
            self.advance_cell(cell_id)?;
        }
        self.persist_all()?;
        Ok(())
    }

    /// Run forever (or until `shutdown` is set), advancing cells once per second.
    pub async fn run(mut self, shutdown: Arc<AtomicBool>) -> Result<(), RuntimeError> {
        info!(
            cells = self.cells.len(),
            db = %self.db_path.display(),
            "Cell runtime starting autonomous lifecycle"
        );

        let scheduler = LocalScheduler::new(self.scheduler.period());
        let result = scheduler
            .run_until(
                || {
                    if let Err(err) = self.advance_all() {
                        error!(error = %err, "Lifecycle advance failed");
                        return Err(err);
                    }
                    Ok(())
                },
                || shutdown.load(Ordering::SeqCst),
            )
            .await;

        info!("Cell runtime shutting down; flushing persistence");
        self.persist_all()?;
        result
    }

    fn control_wake(&mut self) -> Result<(), RuntimeError> {
        let (cell_id, energy) = {
            let cell = self.primary_mut().ok_or(RuntimeError::EmptyRuntime)?;
            cell.wake()?;
            (cell.id(), cell.energy())
        };
        self.record(
            cell_id,
            "Awake",
            format!("Experimenter wake intervention (energy={energy})"),
        );
        self.persist_all()?;
        Ok(())
    }

    fn control_sleep(&mut self) -> Result<(), RuntimeError> {
        let (cell_id, energy) = {
            let cell = self.primary_mut().ok_or(RuntimeError::EmptyRuntime)?;
            cell.sleep()?;
            (cell.id(), cell.energy())
        };
        self.record(
            cell_id,
            "Sleeping",
            format!("Experimenter sleep intervention (energy={energy})"),
        );
        self.persist_all()?;
        Ok(())
    }

    fn advance_cell(&mut self, cell_id: Uuid) -> Result<(), RuntimeError> {
        let next_tick = {
            let cell = self
                .cells
                .iter_mut()
                .find(|cell| cell.id() == cell_id)
                .ok_or(RuntimeError::CellNotFound(cell_id))?;
            let next_tick = cell.tick_count() + 1;
            cell.wake()?;
            next_tick
        };
        self.record(
            cell_id,
            "Awake",
            format!("Tick {next_tick} — cell entered awake state"),
        );

        let received = {
            let cell = self
                .cells
                .iter_mut()
                .find(|cell| cell.id() == cell_id)
                .ok_or(RuntimeError::CellNotFound(cell_id))?;
            cell.receive()?
        };
        if received == 0 {
            self.record(cell_id, "Received Message", "Received 0 messages");
        } else if received == 1 {
            self.record(cell_id, "Received Message", "Received 1 message");
        } else {
            self.record(
                cell_id,
                "Received Message",
                format!("Received {received} messages"),
            );
        }

        {
            let cell = self
                .cells
                .iter_mut()
                .find(|cell| cell.id() == cell_id)
                .ok_or(RuntimeError::CellNotFound(cell_id))?;
            cell.process()?;
        }
        self.record(
            cell_id,
            "Processing",
            format!("Tick {next_tick} — transforming local experience"),
        );

        let memories = {
            let cell = self
                .cells
                .iter_mut()
                .find(|cell| cell.id() == cell_id)
                .ok_or(RuntimeError::CellNotFound(cell_id))?;
            cell.remember()?;
            cell.memory().len()
        };
        self.record(
            cell_id,
            "Stored Memory",
            format!("Local memory count now {memories}"),
        );

        let energy = {
            let cell = self
                .cells
                .iter_mut()
                .find(|cell| cell.id() == cell_id)
                .ok_or(RuntimeError::CellNotFound(cell_id))?;
            cell.sleep()?;
            cell.energy()
        };
        self.record(
            cell_id,
            "Sleeping",
            format!("Tick {next_tick} complete (energy={energy})"),
        );

        {
            let cell = self
                .cells
                .iter_mut()
                .find(|cell| cell.id() == cell_id)
                .ok_or(RuntimeError::CellNotFound(cell_id))?;
            cell.tick()?;
        }
        Ok(())
    }

    fn record(&mut self, cell_id: Uuid, category: &str, detail: impl Into<String>) {
        let detail = detail.into();
        info!(cell_id = %cell_id, category, %detail, "Activity");
        self.activity
            .record(ActivityEvent::new(cell_id, category, detail));
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn open_births_and_restores() {
        let dir = TempDir::new().expect("tempdir");
        let db = dir.path().join("cell.db");

        let mut runtime = CellRuntime::open(&db).expect("open");
        assert_eq!(runtime.cell_count(), 1);
        let id = runtime.primary().expect("cell").id();
        runtime.advance_all().expect("advance");
        let ticks = runtime.primary().expect("cell").tick_count();
        let energy = runtime.primary().expect("cell").energy();
        let memories = runtime.primary().expect("cell").memory().len();
        drop(runtime);

        let restored = CellRuntime::open(&db).expect("reopen");
        let cell = restored.primary().expect("cell");
        assert_eq!(cell.id(), id);
        assert_eq!(cell.tick_count(), ticks);
        assert_eq!(cell.energy(), energy);
        assert_eq!(cell.memory().len(), memories);
    }

    #[test]
    fn observatory_status_and_injection() {
        let dir = TempDir::new().expect("tempdir");
        let db = dir.path().join("obs.db");
        let mut runtime = CellRuntime::open(&db).expect("open");

        runtime.inject_message("Hello Cell").expect("inject");
        let status = runtime.primary_status().expect("status");
        assert_eq!(status.message_queue, 1);
        assert_eq!(status.energy, 100);

        runtime.control(ControlCommand::Tick).expect("tick");
        let status = runtime.primary_status().expect("status");
        assert_eq!(status.tick, 1);
        assert_eq!(status.message_queue, 0);
        assert!(status.memory_count >= 2);

        let logs = runtime.recent_activity();
        assert!(logs.iter().any(|e| e.category == "Message Injected"));
        assert!(logs.iter().any(|e| e.category == "Stored Memory"));
        assert_eq!(logs.first().map(|e| e.category.as_str()), Some("Sleeping"));
    }
}
