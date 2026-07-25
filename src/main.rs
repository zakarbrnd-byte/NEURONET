//! NEURONET v0.1 — Digital Cell
//!
//! Starts one autonomous computational organism. The architecture assumes
//! millions of identical cells will eventually exist; this binary simply hosts
//! the first living instance.

use std::env;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use anyhow::{Context, Result};
use tracing::info;
use tracing_subscriber::EnvFilter;

use neuronet_core::CellRuntime;

fn default_db_path() -> PathBuf {
    env::var_os("NEURONET_DB")
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("neuronet_cell.db"))
}

fn init_tracing() {
    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info"));

    tracing_subscriber::fmt()
        .with_env_filter(filter)
        .with_target(false)
        .with_level(true)
        .compact()
        .init();
}

#[tokio::main]
async fn main() -> Result<()> {
    init_tracing();

    let db_path = default_db_path();
    info!(
        version = env!("CARGO_PKG_VERSION"),
        db = %db_path.display(),
        "NEURONET Digital Cell Runtime"
    );

    let runtime = CellRuntime::open(&db_path)
        .with_context(|| format!("failed to open cell runtime at {}", db_path.display()))?;

    if let Some(cell) = runtime.primary() {
        info!(
            cell_id = %cell.id(),
            energy = cell.energy(),
            tick_count = cell.tick_count(),
            memories = cell.memory().len(),
            "Primary digital cell ready"
        );
    }

    let shutdown = Arc::new(AtomicBool::new(false));
    let flag = Arc::clone(&shutdown);

    tokio::spawn(async move {
        match tokio::signal::ctrl_c().await {
            Ok(()) => {
                info!("Shutdown signal received");
                flag.store(true, Ordering::SeqCst);
            }
            Err(err) => {
                tracing::error!(error = %err, "Failed to listen for ctrl-c");
            }
        }
    });

    runtime
        .run(shutdown)
        .await
        .context("cell runtime terminated with error")?;

    info!("NEURONET Digital Cell halted cleanly");
    Ok(())
}
