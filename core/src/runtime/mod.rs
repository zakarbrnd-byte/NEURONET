//! Cell runtime: local persistence and orchestration.
//!
//! A runtime is itself a local organism host. It does not command the NEURONET
//! society. It only keeps the cells it owns alive, persisted, and ticking.

mod persistence;

pub use persistence::{CellPersistence, PersistenceError};

use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use thiserror::Error;
use tracing::{error, info};

use crate::node::{Cell, DigitalCell};
use crate::scheduler::LocalScheduler;

pub use persistence::PersistedCell;

/// Errors raised by the local cell runtime.
#[derive(Debug, Error)]
pub enum RuntimeError {
    /// Persistence layer failure.
    #[error(transparent)]
    Persistence(#[from] PersistenceError),

    /// Cell lifecycle failure.
    #[error(transparent)]
    Cell(#[from] crate::node::CellError),
}

/// Hosts one or more autonomous cells with local persistence and a local clock.
///
/// The type is deliberately ready for `Vec<Box<dyn Cell>>` growth: today it
/// manages a `Vec` of digital cells; tomorrow any `Cell` implementor can join.
#[derive(Debug)]
pub struct CellRuntime {
    cells: Vec<DigitalCell>,
    persistence: CellPersistence,
    scheduler: LocalScheduler,
    db_path: PathBuf,
}

impl CellRuntime {
    /// Open (or create) a runtime backed by the SQLite database at `db_path`.
    ///
    /// If a cell was previously persisted, it is restored. Otherwise a new
    /// digital cell is born and immediately persisted.
    pub fn open(db_path: impl AsRef<Path>) -> Result<Self, RuntimeError> {
        let db_path = db_path.as_ref().to_path_buf();
        let persistence = CellPersistence::open(&db_path)?;

        let cells = match persistence.load_primary()? {
            Some(persisted) => {
                info!(
                    cell_id = %persisted.identity.id,
                    "Restoring digital cell into runtime"
                );
                vec![DigitalCell::restore(persisted.identity, persisted.memory)]
            }
            None => {
                let cell = DigitalCell::birth();
                info!(cell_id = %cell.id(), "No persisted cell found; birthing new organism");
                let runtime = Self {
                    cells: vec![cell],
                    persistence,
                    scheduler: LocalScheduler::default(),
                    db_path: db_path.clone(),
                };
                runtime.persist_all()?;
                return Ok(runtime);
            }
        };

        Ok(Self {
            cells,
            persistence,
            scheduler: LocalScheduler::default(),
            db_path,
        })
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

    /// Persist every hosted cell.
    pub fn persist_all(&self) -> Result<(), RuntimeError> {
        for cell in &self.cells {
            self.persistence.save_cell(cell)?;
        }
        Ok(())
    }

    /// Advance every hosted cell through one full lifecycle, then persist.
    pub fn advance_all(&mut self) -> Result<(), RuntimeError> {
        for cell in &mut self.cells {
            cell.advance()?;
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

        // Local clock copy — the runtime is not borrowed by a master controller.
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
}
