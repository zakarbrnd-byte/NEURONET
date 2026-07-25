//! SQLite persistence for digital cell identity, energy, and memory.
//!
//! Persistence is local to the organism's runtime host. It is not a shared
//! world-brain. Each database file may hold many cells in preparation for a
//! multi-cell society, keyed by cell identity.

use std::path::Path;

use chrono::{DateTime, TimeZone, Utc};
use rusqlite::{params, Connection, OptionalExtension};
use thiserror::Error;
use uuid::Uuid;

use crate::memory::{MemoryEntry, MemoryStore};
use crate::node::{CellState, DigitalCell, DigitalCellIdentity};

/// Errors from the persistence layer.
#[derive(Debug, Error)]
pub enum PersistenceError {
    /// SQLite reported a failure.
    #[error("sqlite error: {0}")]
    Sqlite(#[from] rusqlite::Error),

    /// A stored UUID could not be parsed.
    #[error("invalid uuid in database: {0}")]
    InvalidUuid(String),

    /// A stored timestamp could not be parsed.
    #[error("invalid timestamp in database: {0}")]
    InvalidTimestamp(i64),

    /// A stored cell state label was unrecognized.
    #[error("invalid cell state in database: {0}")]
    InvalidState(String),
}

/// Fully loaded persisted cell.
#[derive(Debug, Clone)]
pub struct PersistedCell {
    /// Identity and metabolic snapshot.
    pub identity: DigitalCellIdentity,
    /// Local memories.
    pub memory: MemoryStore,
}

/// SQLite-backed persistence for autonomous cells.
#[derive(Debug)]
pub struct CellPersistence {
    conn: Connection,
}

impl CellPersistence {
    /// Open or create the database at `path`, initializing schema as needed.
    pub fn open(path: impl AsRef<Path>) -> Result<Self, PersistenceError> {
        let conn = Connection::open(path)?;
        conn.execute_batch(
            r#"
            PRAGMA foreign_keys = ON;

            CREATE TABLE IF NOT EXISTS cells (
                id TEXT PRIMARY KEY NOT NULL,
                created_at INTEGER NOT NULL,
                energy INTEGER NOT NULL,
                tick_count INTEGER NOT NULL,
                state TEXT NOT NULL,
                is_primary INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS memories (
                id TEXT PRIMARY KEY NOT NULL,
                cell_id TEXT NOT NULL,
                seq INTEGER NOT NULL DEFAULT 0,
                timestamp INTEGER NOT NULL,
                payload TEXT NOT NULL,
                confidence REAL NOT NULL,
                FOREIGN KEY(cell_id) REFERENCES cells(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_memories_cell_id ON memories(cell_id);
            CREATE INDEX IF NOT EXISTS idx_memories_cell_seq ON memories(cell_id, seq);
            "#,
        )?;
        Self::ensure_memory_seq_column(&conn)?;
        Ok(Self { conn })
    }

    fn ensure_memory_seq_column(conn: &Connection) -> Result<(), PersistenceError> {
        let mut stmt = conn.prepare("PRAGMA table_info(memories)")?;
        let columns = stmt
            .query_map([], |row| row.get::<_, String>(1))?
            .collect::<Result<Vec<_>, _>>()?;
        if !columns.iter().any(|name| name == "seq") {
            conn.execute_batch(
                "ALTER TABLE memories ADD COLUMN seq INTEGER NOT NULL DEFAULT 0;",
            )?;
        }
        Ok(())
    }

    /// Persist a cell's identity, energy, and full memory set.
    pub fn save_cell(&self, cell: &DigitalCell) -> Result<(), PersistenceError> {
        let identity = cell.identity_snapshot();
        let tx = self.conn.unchecked_transaction()?;

        tx.execute(
            r#"
            INSERT INTO cells (id, created_at, energy, tick_count, state, is_primary)
            VALUES (?1, ?2, ?3, ?4, ?5, 1)
            ON CONFLICT(id) DO UPDATE SET
                energy = excluded.energy,
                tick_count = excluded.tick_count,
                state = excluded.state,
                is_primary = 1
            "#,
            params![
                identity.id.to_string(),
                identity.created_at.timestamp_millis(),
                identity.energy as i64,
                identity.tick_count as i64,
                identity.state.as_str(),
            ],
        )?;

        // Ensure only one primary marker remains when multiple cells exist.
        tx.execute(
            "UPDATE cells SET is_primary = CASE WHEN id = ?1 THEN 1 ELSE 0 END",
            params![identity.id.to_string()],
        )?;

        tx.execute(
            "DELETE FROM memories WHERE cell_id = ?1",
            params![identity.id.to_string()],
        )?;

        for (seq, entry) in cell.memory().entries().iter().enumerate() {
            tx.execute(
                r#"
                INSERT INTO memories (id, cell_id, seq, timestamp, payload, confidence)
                VALUES (?1, ?2, ?3, ?4, ?5, ?6)
                "#,
                params![
                    entry.id.to_string(),
                    identity.id.to_string(),
                    seq as i64,
                    entry.timestamp.timestamp_millis(),
                    entry.payload,
                    entry.confidence,
                ],
            )?;
        }

        tx.commit()?;
        Ok(())
    }

    /// Load the primary persisted cell, if any.
    pub fn load_primary(&self) -> Result<Option<PersistedCell>, PersistenceError> {
        let mut stmt = self.conn.prepare(
            r#"
            SELECT id, created_at, energy, tick_count, state
            FROM cells
            WHERE is_primary = 1
            ORDER BY created_at ASC
            LIMIT 1
            "#,
        )?;

        let row = stmt
            .query_row([], |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, i64>(1)?,
                    row.get::<_, i64>(2)?,
                    row.get::<_, i64>(3)?,
                    row.get::<_, String>(4)?,
                ))
            })
            .optional()?;

        let Some((id, created_at, energy, tick_count, state)) = row else {
            return Ok(None);
        };

        let identity = DigitalCellIdentity {
            id: parse_uuid(&id)?,
            created_at: millis_to_utc(created_at)?,
            energy: energy.clamp(0, 100) as u8,
            tick_count: tick_count.max(0) as u64,
            state: parse_state(&state)?,
        };

        let memory = self.load_memories(identity.id)?;
        Ok(Some(PersistedCell { identity, memory }))
    }

    /// Load a cell by identity.
    pub fn load_cell(&self, cell_id: Uuid) -> Result<Option<PersistedCell>, PersistenceError> {
        let mut stmt = self.conn.prepare(
            r#"
            SELECT id, created_at, energy, tick_count, state
            FROM cells
            WHERE id = ?1
            LIMIT 1
            "#,
        )?;

        let row = stmt
            .query_row(params![cell_id.to_string()], |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, i64>(1)?,
                    row.get::<_, i64>(2)?,
                    row.get::<_, i64>(3)?,
                    row.get::<_, String>(4)?,
                ))
            })
            .optional()?;

        let Some((id, created_at, energy, tick_count, state)) = row else {
            return Ok(None);
        };

        let identity = DigitalCellIdentity {
            id: parse_uuid(&id)?,
            created_at: millis_to_utc(created_at)?,
            energy: energy.clamp(0, 100) as u8,
            tick_count: tick_count.max(0) as u64,
            state: parse_state(&state)?,
        };

        let memory = self.load_memories(identity.id)?;
        Ok(Some(PersistedCell { identity, memory }))
    }

    fn load_memories(&self, cell_id: Uuid) -> Result<MemoryStore, PersistenceError> {
        let mut stmt = self.conn.prepare(
            r#"
            SELECT id, timestamp, payload, confidence
            FROM memories
            WHERE cell_id = ?1
            ORDER BY seq ASC, timestamp ASC
            "#,
        )?;

        let rows = stmt.query_map(params![cell_id.to_string()], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, i64>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, f64>(3)?,
            ))
        })?;

        let mut entries = Vec::new();
        for row in rows {
            let (id, timestamp, payload, confidence) = row?;
            entries.push(MemoryEntry::from_parts(
                parse_uuid(&id)?,
                millis_to_utc(timestamp)?,
                payload,
                confidence,
            ));
        }

        Ok(MemoryStore::from_entries(entries))
    }
}

fn parse_uuid(value: &str) -> Result<Uuid, PersistenceError> {
    Uuid::parse_str(value).map_err(|_| PersistenceError::InvalidUuid(value.to_string()))
}

fn millis_to_utc(millis: i64) -> Result<DateTime<Utc>, PersistenceError> {
    Utc.timestamp_millis_opt(millis)
        .single()
        .ok_or(PersistenceError::InvalidTimestamp(millis))
}

fn parse_state(value: &str) -> Result<CellState, PersistenceError> {
    match value {
        "Sleeping" => Ok(CellState::Sleeping),
        "Awake" => Ok(CellState::Awake),
        "Processing" => Ok(CellState::Processing),
        other => Err(PersistenceError::InvalidState(other.to_string())),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::messaging::Message;
    use crate::node::Cell;
    use tempfile::TempDir;

    #[test]
    fn save_and_load_roundtrip() {
        let dir = TempDir::new().expect("tempdir");
        let db = dir.path().join("persist.db");
        let persistence = CellPersistence::open(&db).expect("open");

        let mut cell = DigitalCell::birth();
        cell.deliver(Message::new(cell.id(), "persist-me"));
        cell.advance().expect("advance");
        persistence.save_cell(&cell).expect("save");

        let loaded = persistence
            .load_primary()
            .expect("load")
            .expect("present");
        assert_eq!(loaded.identity.id, cell.id());
        assert_eq!(loaded.identity.energy, cell.energy());
        assert_eq!(loaded.identity.tick_count, cell.tick_count());
        assert_eq!(loaded.memory.len(), cell.memory().len());
        assert_eq!(
            loaded.memory.entries()[0].payload,
            cell.memory().entries()[0].payload
        );
    }
}
