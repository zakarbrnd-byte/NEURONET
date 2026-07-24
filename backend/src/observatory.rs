//! Shared observatory host state.
//!
//! Mission Control observes and may intervene metabolically. It never becomes
//! a central reasoning engine for the organism.

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;

use tokio::sync::Mutex;
use tracing::{error, info};

use neuronet_core::CellRuntime;

/// Process-wide application state shared by the API and life loop.
#[derive(Clone)]
pub struct AppState {
    /// Local organism host guarded for concurrent observatory access.
    pub runtime: Arc<Mutex<CellRuntime>>,
    /// Cooperative shutdown flag for the autonomous life loop.
    pub shutdown: Arc<AtomicBool>,
    /// Package version string exposed to Mission Control.
    pub version: &'static str,
}

impl AppState {
    /// Construct observatory state around an existing runtime host.
    pub fn new(runtime: CellRuntime, version: &'static str) -> Self {
        Self {
            runtime: Arc::new(Mutex::new(runtime)),
            shutdown: Arc::new(AtomicBool::new(false)),
            version,
        }
    }
}

/// Advance hosted cells once per second until shutdown is requested.
///
/// This is a local metabolic clock for the cells hosted in-process — not a
/// master scheduler of a global NEURONET society.
pub async fn run_autonomous_life(
    runtime: Arc<Mutex<CellRuntime>>,
    shutdown: Arc<AtomicBool>,
) {
    info!("Autonomous life loop online");
    let mut ticker = tokio::time::interval(Duration::from_secs(1));
    ticker.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Delay);
    // Skip the immediate first fire so the first advance aligns to 1 Hz.
    ticker.tick().await;

    while !shutdown.load(Ordering::SeqCst) {
        ticker.tick().await;
        if shutdown.load(Ordering::SeqCst) {
            break;
        }

        let mut guard = runtime.lock().await;
        if let Err(err) = guard.advance_all() {
            error!(error = %err, "Autonomous lifecycle advance failed");
        }
    }

    if let Ok(guard) = runtime.try_lock() {
        if let Err(err) = guard.persist_all() {
            error!(error = %err, "Final persistence flush failed");
        }
    }

    info!("Autonomous life loop halted");
}
